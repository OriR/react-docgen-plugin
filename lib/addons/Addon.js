/* $lab:coverage:off$ */
module.exports = class Addon {
  constructor(reactDocgenCustomHandlers) {
    this.reactDocgenCustomHandlers = reactDocgenCustomHandlers || [];
  }

  getPluginMappings({ extension }) {
    throw new Error(`${this.constructor.name} doesn't implement getHandlebarsPlugin.`);
  }
};
/* $lab:coverage:on$ */
