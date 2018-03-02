const {
  utils: {
    getMemberValuePath,
    resolveToValue,
    getMembers,
    getPropertyName,
    resolveToModule,
    isReactModuleName,
    printValue
  }
} = require('react-docgen');
const { types: { namedTypes: types }} = require('recast');
const getPropType = require('./getPropType');

function isPropTypesExpression(path) {
  const moduleName = resolveToModule(path);
  if (moduleName) {
    return isReactModuleName(moduleName) || moduleName === 'ReactPropTypes';
  }
  return false;
}

function isRequiredPropType(path) {
  return getMembers(path).some(
    member => !member.computed && member.path.node.name === 'isRequired' ||
      member.computed && member.path.node.value === 'isRequired'
  );
}

module.exports = (documentation, path) => {
  let propTypesPath = getMemberValuePath(path, 'propTypes');
  if (!propTypesPath) {
    return;
  }
  propTypesPath = resolveToValue(propTypesPath);
  if (!propTypesPath) {
    return;
  }
  if (!types.ObjectExpression.check(propTypesPath.node)) {
    return;
  }
  propTypesPath.get('properties').each(function(propertyPath) {
    switch (propertyPath.node.type) {
      case types.Property.name:
        const propDescriptor = documentation.getPropDescriptor(getPropertyName(propertyPath));
        const valuePath = propertyPath.get('value');
        const type = isPropTypesExpression(valuePath)
          ? getPropType(valuePath)
          : { name: 'custom', raw: printValue(valuePath) };
        if (type) {
          propDescriptor.type = type;
          propDescriptor.required =
            type.name !== 'custom' && isRequiredPropType(valuePath);
          if (type.compositions) {
            type.compositions
            .filter(module => module !== 'undefined' && module !== 'prop-types')
            .forEach(module => documentation.addComposes(module));
          }
        }
        break;
      default:
        break;
    }
  });
};