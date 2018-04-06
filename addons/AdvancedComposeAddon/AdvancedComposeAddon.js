const Addon = require('../Addon');
const advancedComposesHandler = require('./advancedComposesHandler');

class AdvancedComposeAddon extends Addon {
  constructor() {
    super([advancedComposesHandler]);
  }

  getHandlebarsPlugin({ extension }) {
    return (handlebars) => {
      handlebars.registerPartial('composes', '{{withoutPropTypes this}} Props');
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
  }
}

module.exports = AdvancedComposeAddon;
