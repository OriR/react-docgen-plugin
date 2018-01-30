const path = require('path');
const process = require('process');
const reactDocgen = require('react-docgen');
const ReactDocGenMarkdownRenderer = require('react-docgen-markdown-renderer');

/**
 *
 * @constructor
 */
function ReactDocGenPlugin(options) {
  this.options = Object.assign({}, {
    outputPath: '',
    renderers: [new ReactDocGenMarkdownRenderer({componentsBasePath: process.cwd()})],
    resolveCompose(file, composingModule) {
      return path.resolve(path.dirname(file), composingModule);
    }
  }, options);

  if (!this.options.include) {
    throw new Error('ReactDocGenPlugin must get an `include` property. See documentation for more details.');
  }
}

ReactDocGenPlugin.prototype.apply = function (compiler) {
  const self = this;
  const components = {};
  const loaded = {};

  compiler.plugin('emit', function (compilation, done) {
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

    const getComposes = (file) => {
      const composes = loaded[file].composes;

      return composes.reduce((allComposed, composing) => {
        const composedPath = self.options.resolveCompose(file, composing);

        // A resolveCompose function should return null/undefined in case it doesn't know how to resolve the path to that module.
        // Or in the case the composed module doesn't contain a suitable component definition for react-docgen.
        if(!composedPath) {
          return allComposed;
        }

        const composedFile = files.find((file) => path.dirname(file) === composedPath);


        if(!composedFile || !loaded[composedFile]){
          throw new Error(`You didn't ignore a composed path for ${composedPath} or you didn't included it in the options.include`);
        }

        allComposed.push(loaded[composedFile]);

        // In case we're deeply composing
        if(loaded[composedFile].composes) {
          allComposed.push(...getComposes(composedFile).map((ast) => Object.assign({}, ast, {
            componentName: loaded[composedFile].componentName + '.' + ast.componentName
          })));
        }

        return allComposed;
      }, []);
    };

    const renderDocumentation = () => {
      Object.keys(loaded).forEach((file) => {
        // Get all the ASTs that this file composes (including deeply nested composed components)
        const composesASTs = !!loaded[file].composes ? getComposes(file) : [];

        self.options.renderers.forEach((renderer) => {

          const assetName = path.join(self.options.outputPath, loaded[file].componentName + renderer.extension);

          // Render the documentation for the current component
          const componentDocumentation = renderer.render(file, loaded[file], composesASTs);

          // Add the documentation file to the compilation assets
          compilation.assets[assetName] = getDocumentationAsset(componentDocumentation);
        });
      });
      done();
    };

    files.forEach((file) => {
      // Read the original asset to generate documentation for (it's probably cached)
      this.inputFileSystem.readFile(file, function (err, componentContent) {
        try {
          loaded[file] = reactDocgen.parse(componentContent);
          loaded[file].componentName = path.basename(file, path.extname(file));
        }
        catch(e){
          throw new Error(`
          An error has while generating documentation for ${file} in react-docgen.
          The internal error is
          ${e.message}`);
        }

        // Check if this is the last file that we've read, after it we can safely let webpack know that we're done
        remainingFiles--;
        if (remainingFiles === 0) {
          renderDocumentation();
        }
      });
    });
  });

  compiler.plugin('normal-module-factory', function (nmf) {
    nmf.plugin('after-resolve', function (data, next) {
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
