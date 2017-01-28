const path = require('path');
const process = require('process');
const ReactDocGenMarkdownRenderer = require('react-docgen-markdown-renderer');

/**
 *
 * @constructor
 */
function ReactDocGenPlugin(options) {
  this.options = Object.assign({}, {
    renderers: [new ReactDocGenMarkdownRenderer({ componentsBasePath: process.cwd() })]
  }, options);

  if (!this.options.include) {
    throw new Error('ReactDocGenPlugin must get an `include` property. See documentation for more details.');
  }
}

ReactDocGenPlugin.prototype.apply = function(compiler) {
  const self = this;
  const components = {};

  compiler.plugin('emit', function(compilation, done) {
    const files = Object.keys(components);
    let remainingFiles = files.length;

    const getDocumentationAsset = (doc) => {
      return {
        size() {
          return doc.length;
        },
        source() {
          return doc;
        }
      };
    };

    files.forEach((file) => {
      self.options.renderers.forEach((renderer) => {
        const componentName = path.basename(file, path.extname(file));
        const assetName = componentName + renderer.extension;

        // Read the original asset to generate documentation for (it's probably cached)
        this.inputFileSystem.readFile(file, function(err, componentContent) {

          try {
            // Render the documentation for the current component
            const componentDocumentation = renderer.render(file, componentContent, self.options);

            // Add the documentation file to the compilation assets
            compilation.assets[assetName] = getDocumentationAsset(componentDocumentation);

            // Check if this is the last file that we've read, after it we can safely let webpack know that we're done
            remainingFiles--;
            if (remainingFiles === 0) {
              done();
            }
          }
          catch (error) {
            // TODO: notify about the error in the rendering process.
            done();
          }
        });
      });
    });
  });

  compiler.plugin('normal-module-factory', function(nmf) {
    nmf.plugin('after-resolve', function(data, next) {
      const shouldDocumentFile = typeof self.options.include === 'function' ?
        self.options.include(data.resource) :
        self.options.include.test(data.resource);

      // Collect all the relevant files for the documentation.
      if (shouldDocumentFile) {
        components[data.resource] = true;
      }

      next(null, data);
    });
  });
};

module.exports = ReactDocGenPlugin;
