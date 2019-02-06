const Addon = require('../Addon');
const advancedComposesHandler = require('./advancedComposesHandler');
const { type } = require('react-docgen-renderer-template');

class AdvancedComposeAddon extends Addon {
  constructor() {
    super([advancedComposesHandler]);
  }

  getTypeMapping({ extension }) {
    return {
      shape: type`${({ context }) => {
        if (context.type.custom) {
          return `Shape (${context.type.custom})`
        } else {
          return `Shape`;
        }
      }}`,
      composes: type`${({ context }) => {
        const originalValue = context.type
        ? context.type.value
        : context.value;

      return originalValue
        ? originalValue.replace(/\.propTypes/, '')
        : context.raw;
      }} Props`
    };
  }
}

module.exports = AdvancedComposeAddon;
