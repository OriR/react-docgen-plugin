const path = require('path');
const process = require('process');
const reactDocgen = require('react-docgen');
const ReactDocGenMarkdownRenderer = require('react-docgen-markdown-renderer');

/**
 *
 * @constructor
 */
function ReactDocGenPlugin(options) {
  this.defaultIsComposingComponent = ({ composedFile, composedFilePath }) => composedFilePath.match(new RegExp(`[\\\\|\\/](${composedFile.displayName})\\.`));
  this.defaultResolveCompose = ({ composingFile, composedModule }) => path.resolve(path.dirname(composingFile), composedModule);
  this.options = {
    outputPath: '',
    addons: [],
    resolver: reactDocgen.resolver.findExportedComponentDefinition,
    isComposingComponent: this.defaultIsComposingComponent,
    renderers: [new ReactDocGenMarkdownRenderer(Object.assign({}, { componentsBasePath: process.cwd(), template: ReactDocGenMarkdownRenderer.defaultTemplate.setPlugins(options.addons || []) }))],
    resolveCompose: this.defaultResolveCompose,
    ...options
  };

  if (!this.options.include) {
    throw new Error('ReactDocGenPlugin must get an `include` property. See documentation for more details.');
  }

  this.handlers = reactDocgen.defaultHandlers.concat(this.options.addons.reduce((handlers, addon) => [...handlers, ...addon.reactDocgenCustomHandlers], []));
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

    const getComposes = (componentDefinition, file) => {
      const composes = componentDefinition.composes;

      return composes.reduce((allComposed, composedModule) => {
        const composedFile = self.options.resolveCompose({ composingFile: file, composedModule }, this.defaultResolveCompose);

        // A resolveCompose function should return null/undefined in case it doesn't know how to resolve the path to that module.
        // Or in the case the composed module doesn't contain a suitable component definition for react-docgen.
        if(!composedFile) {
          return allComposed;
        }

        /* $lab:coverage:off$ */
        if(!loaded[composedFile]){
          throw new Error(`You didn't ignore a composed path for ${composedFile} or you didn't included it in the options.include`);
        }
        /* $lab:coverage:on$ */

        const composingComponentDefinitions = loaded[composedFile].filter(composedFileComponentDefinition => self.options.isComposingComponent({ composingFile: componentDefinition, composedFile: composedFileComponentDefinition, composingFilePath: file, composedFilePath: composedFile }, self.defaultIsComposingComponent));

        composingComponentDefinitions.forEach(composingComponentDefinition => {
          allComposed.push(composingComponentDefinition);

          // In case we're deeply composing
          if(composingComponentDefinition.composes) {
            const compositions = getComposes(composingComponentDefinition, composedFile);

            const remainingCompositions = compositions.filter((ast, index) => {
              return compositions.findIndex((ast2, index2) => ast2.componentName === ast.componentName && index2 >= index) === index
            });

            allComposed.push(...remainingCompositions.map((ast) => Object.assign({}, ast, {
              componentName: composingComponentDefinition.displayName + '.' + ast.displayName
            })));
          }
        });

        return allComposed;
      }, []);
    };

    const renderDocumentation = () => {
      Object.keys(loaded).forEach((file) => {
        // Get all the ASTs that this file composes (including deeply nested composed components)
        const componentDefinitions = loaded[file];

        componentDefinitions.forEach((componentDefinition) => {

        const composesASTs = componentDefinition.composes ? getComposes(componentDefinition, file) : [];

        self.options.renderers.forEach((renderer) => {

          const assetName = path.join(self.options.outputPath, componentDefinition.displayName + renderer.extension);

          // Render the documentation for the current component
          const componentDocumentation = renderer.render(file, componentDefinition, composesASTs);

          // Add the documentation file to the compilation assets
          compilation.assets[assetName] = getDocumentationAsset(componentDocumentation);
        });
        });
      });
      done();
    };

    files.forEach((file) => {
      // Read the original asset to generate documentation for (it's probably cached)
      this.inputFileSystem.readFile(file, function (err, componentContent) {
        try {
          const componentDefinition = reactDocgen.parse(componentContent, self.options.resolver, self.handlers);
          // console.log({ componentDefinition });
          loaded[file] = Array.isArray(componentDefinition) ? componentDefinition : [componentDefinition];
          // loaded[file].componentName = path.basename(file, path.extname(file));
        }
        catch(e){
          throw new Error(`
          An error has while generating documentation for ${file} in react-docgen.
          The internal error is
          ${e.message}
          ${e.stack}`);
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