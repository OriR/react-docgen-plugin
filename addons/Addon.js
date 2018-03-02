module.exports = class Addon {
  constructor(handlers) {
    this.handlers = handlers;
  }

  getTypePartials(extension) {
    throw new Error(`${this.constructor.name} doesn't implement getTypePartials.`);
  }

  handlebarsPlugin(handlebars) {
    throw new Error(`${this.constructor.name} doesn't implement handlebarsPlugins.`);
  }
};
