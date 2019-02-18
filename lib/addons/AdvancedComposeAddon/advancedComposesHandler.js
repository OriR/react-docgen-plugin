// Majority of this code taken from `react-docgen`
// Added handling of 'composes' type for more complex compositions.
/* $lab:coverage:off$ */
const {
  utils: {
    getMemberValuePath,
    resolveToValue,
    getMembers,
    getPropertyName,
    resolveToModule,
    isReactModuleName,
    printValue,
  },
} = require('react-docgen');
const {
  types: { namedTypes: types },
} = require('recast');
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
    member =>
      (!member.computed && member.path.node.name === 'isRequired') ||
      (member.computed && member.path.node.value === 'isRequired'),
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
          if (type.name === 'custom') {
            const customModule = resolveToModule(valuePath);
            if (customModule) {
              type.customValue = printValue(valuePath);
            }
          }

          propDescriptor.type = type;
          propDescriptor.required = type.name !== 'custom' && isRequiredPropType(valuePath);

          if (type.compositions) {
            Object.keys(type.compositions)
              .filter(
                module =>
                  module !== 'null' && module !== 'prop-types' && module !== '__customShapes',
              )
              .forEach(module => documentation.addComposes(module));

            if (type.compositions.__customShapes) {
              documentation.set('customShapes', type.compositions.__customShapes);
            }
          }
        }
        break;
      default:
        break;
    }
  });
};
/* $lab:coverage:on$ */
