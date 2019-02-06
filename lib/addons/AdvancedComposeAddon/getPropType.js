// Majority of this code taken from `react-docgen`
// Added handling of 'composes' type for more complex compositions.
/* $lab:coverage:off$ */
const {
  utils: {
    printValue,
    resolveToValue,
    getPropertyName,
    resolveToModule,
    getMembers,
    docblock: {
      getDocblock
    }
  }
} = require('react-docgen');
const { types: { namedTypes: types }, visit } = require('recast');

let getPropType;

function isNotOrdinaryComposition(path) {
  return types.MemberExpression.check(path.node) && !printValue(path.get('object')).includes('PropTypes');
}


function isRequiredPropType(path) {
  return getMembers(path).some(
    member => !member.computed && member.path.node.name === 'isRequired' ||
      member.computed && member.path.node.value === 'isRequired'
  );
}

function getEnumValues(path) {
  return path.get('elements').map(function(elementPath) {
    return {
      value: printValue(elementPath),
      computed: !types.Literal.check(elementPath.node)
    };
  });
}

function getPropTypeOneOf(argumentPath) {
  const type = { name: 'enum' };
  if (!types.ArrayExpression.check(argumentPath.node)) {
    type.computed = true;
    type.value = printValue(argumentPath);
  } else {
    type.value = getEnumValues(argumentPath);
  }
  return type;
}

function getPropTypeOneOfType(argumentPath, allCompositions) {
  const type = { name: 'union' };
  if (!types.ArrayExpression.check(argumentPath.node)) {
    type.computed = true;
    type.value = printValue(argumentPath);
  } else {
    type.value = argumentPath.get('elements').map(element => getPropType(element, allCompositions));
  }
  return type;
}

function getPropTypeArrayOf(argumentPath, allCompositions) {
  const type = { name: 'arrayOf' };
  const subType = getPropType(argumentPath, allCompositions);

  if (subType.name === 'unknown') {
    type.value = printValue(argumentPath);
    type.computed = true;
  } else if (subType.name === 'custom' && isNotOrdinaryComposition(argumentPath)) {
    type.value = subType;
    type.value.name = 'composes';
    allCompositions[resolveToModule(argumentPath)] = true;
  } else {
    type.value = subType;
  }
  return type;
}

function getPropTypeObjectOf(argumentPath, allCompositions) {
  const type = { name: 'objectOf' };
  const subType = getPropType(argumentPath);

  if (subType.name === 'unknown') {
    type.value = printValue(argumentPath);
    type.computed = true;
  } else if (subType.name === 'custom' && isNotOrdinaryComposition(argumentPath)) {
    type.value = subType;
    type.value.name = 'composes';
    allCompositions[resolveToModule(argumentPath)] = true;
  } else {
    type.value = subType;
  }
  return type;
}

function getPropTypeShape(argumentPath, allCompositions) {
  const type = { name: 'shape', value: 'unknown' };
  if (!types.ObjectExpression.check(argumentPath.node)) {
    argumentPath = resolveToValue(argumentPath);
  }

  if (types.ObjectExpression.check(argumentPath.node)) {
    let value = {};
    argumentPath.get('properties').each(function(propertyPath) {
      if (types.SpreadProperty.check(propertyPath.node) || (types.SpreadElement.check(propertyPath.node))) {
        // We assume it's a composition
        value = printValue(argumentPath);
        type.name = 'composes';
        allCompositions[resolveToModule(propertyPath.get('argument'))] = true;
        return;
      }

      const descriptor = getPropType(propertyPath.get('value'), allCompositions);
      const docs = getDocblock(propertyPath);
      if (docs) {
        descriptor.description = docs;
      }
      descriptor.required = isRequiredPropType(propertyPath.get('value'));
      value[getPropertyName(propertyPath)] = descriptor;
    });
    type.value = value;
  } else if (isNotOrdinaryComposition(argumentPath)) {
    type.value = printValue(argumentPath);
    let foundNode;
    visit(argumentPath.scope.getGlobalScope().node, {
      visitAssignmentExpression: (node) => {
        if (printValue(node.get('left')) === type.value) {
          foundNode = node.get('right');
        }
        return false;
      }
    })
    if (foundNode) {
      allCompositions.__customShapes = allCompositions.__customShapes || {};
      allCompositions.__customShapes[type.value] = getPropTypeShape(foundNode, allCompositions);
      type.custom = type.value;
      Object.assign(type, getPropTypeShape(foundNode, allCompositions));
    } else {
      type.name = 'composes';
      allCompositions[resolveToModule(argumentPath)] = true;
    }
  }

  return type;
}

function getPropTypeInstanceOf(argumentPath) {
  return {
    name: 'instanceOf',
    value: printValue(argumentPath)
  };
}

const simplePropTypes = {
  array: 1,
  bool: 1,
  func: 1,
  number: 1,
  object: 1,
  string: 1,
  any: 1,
  element: 1,
  node: 1
};

const propTypes = {
  oneOf: getPropTypeOneOf,
  oneOfType: getPropTypeOneOfType,
  instanceOf: getPropTypeInstanceOf,
  arrayOf: getPropTypeArrayOf,
  objectOf: getPropTypeObjectOf,
  shape: getPropTypeShape
};

/**
 * Tries to identify the prop type by inspecting the path for known
 * prop type names. This method doesn't check whether the found type is actually
 * from React.PropTypes. It simply assumes that a match has the same meaning
 * as the React.PropTypes one.
 *
 * If there is no match, "custom" is returned.
 */
getPropType = (path, allCompositions = {}) => {
  let descriptor;
  getMembers(path, true).some(member => {
    const node = member.path.node;
    let name;
    if (types.Literal.check(node)) {
      name = node.value;
    } else if (types.Identifier.check(node) && !member.computed) {
      name = node.name;
    }
    if (name) {
      if (simplePropTypes.hasOwnProperty(name)) {
        descriptor = { name };
        return true;
      } else if (propTypes.hasOwnProperty(name) && member.argumentsPath) {
        descriptor = propTypes[name](member.argumentsPath.get(0), allCompositions);
        return true;
      }
    }

    return undefined;
  });

  if (!descriptor) {
    const node = path.node;
    if (types.Identifier.check(node) &&
      simplePropTypes.hasOwnProperty(node.name)) {
      descriptor = { name: node.name };
    } else if (types.CallExpression.check(node) &&
      types.Identifier.check(node.callee) &&
      propTypes.hasOwnProperty(node.callee.name)) {
      descriptor = propTypes[node.callee.name](path.get('arguments', 0));
    } else if (isNotOrdinaryComposition(path)) {

      descriptor = { name: 'composes', required: isRequiredPropType(path) };
      descriptor.value = descriptor.required
        ? printValue(path.get('object'))
        : printValue(path);
      allCompositions[resolveToModule(path)] = true;
    } else if (types.Identifier.check(node)) {
      const root = path.scope.getGlobalScope().node;
      const propMember = printValue(path);
      descriptor = { name: 'unknown', raw: printValue(path) };
      visit(root, {
        visitVariableDeclarator: (node) => {
          if (printValue(node.get('id')) === propMember) {
            const member = getMembers(node.get('init'))[0];
            const type = member.path.node.name;
            descriptor = propTypes[type](member.argumentsPath.get(0), allCompositions);
          }

          return false;
        }
      });
    } else {
      descriptor = { name: 'custom', raw: printValue(path) };
    }
  }

  descriptor.compositions = allCompositions;
  return descriptor;
};

module.exports = getPropType;
/* $lab:coverage:on$ */