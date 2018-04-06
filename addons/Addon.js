module.exports = class Addon {
  constructor(reactDocgenCustomHandlers) {
    this.reactDocgenCustomHandlers = reactDocgenCustomHandlers || [];
  }

  getHandlebarsPlugin({ extension }) {
    throw new Error(`${this.constructor.name} doesn't implement getHandlebarsPlugin.`);
  }
};
