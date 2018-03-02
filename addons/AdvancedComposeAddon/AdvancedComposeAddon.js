const Addon = require('../Addon');
const advancedComposesHandler = require('./advancedComposesHandler');

class AdvancedComposeAddon extends Addon {
  constructor() {
    super([advancedComposesHandler]);
  }

  handlebarsPlugin(handlebars) {
    handlebars.registerHelper('withoutPropTypes', (context) => {
      const originalValue = context.type
        ? context.type.value
        : context.value;

      return originalValue
        ? originalValue.replace(/\.propTypes/, '')
        : context.raw;
    });

    return handlebars;
  }

  getTypePartials(extension) {
    return {
      composes: '{{withoutPropTypes this}} Props'
    };
  }
}

module.exports = AdvancedComposeAddon;
