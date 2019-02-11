const path = require('path');
const process = require('process');
const reactDocgen = require('react-docgen');
const ReactDocGenMarkdownRenderer = require('react-docgen-markdown-renderer');

/**
 *
 * @constructor
 */
function ReactDocGenPlugin(options) {
  this.defaultIsComposingComponent = ({ composedFile, composedFilePath }) =>
    composedFilePath.match(new RegExp(`[\\\\|\\/](${composedFile.displayName})\\.`));
  this.defaultResolveCompose = ({ composingFile, composedModule }) =>
    path.resolve(path.dirname(composingFile), composedModule);
  this.options = {
    outputPath: '',
    addons: [],
    resolver: reactDocgen.resolver.findExportedComponentDefinition,
    isComposingComponent: this.defaultIsComposingComponent,
    renderers: [
      new ReactDocGenMarkdownRenderer(
        Object.assign(
          {},
          {
            componentsBasePath: process.cwd(),
            template: ReactDocGenMarkdownRenderer.defaultTemplate.setPlugins(options.addons || []),
          },
        ),
      ),
    ],
    resolveCompose: this.defaultResolveCompose,
    ...options,
  };

  if (!this.options.include) {
    throw new Error(
      'ReactDocGenPlugin must get an `include` property. See documentation for more details.',
    );
  }

  this.handlers = reactDocgen.defaultHandlers.concat(
    this.options.addons.reduce(
      (handlers, addon) => [...handlers, ...addon.reactDocgenCustomHandlers],
      [],
    ),
  );
}

ReactDocGenPlugin.prototype.apply = function(compiler) {
  compiler.hooks.emit.tapPromise('ReactDocgenPlugin', compilation => {
    return new Promise((resolve, reject) => {
      const getComposes = (ASTsByFile, componentDefinition, file) => {
        debugger;
        return componentDefinition.composes.reduce((allComposed, composedModule) => {
          const composedFile = this.options.resolveCompose(
            { composingFile: file, composedModule },
            this.defaultResolveCompose,
          );

          // A resolveCompose function should return null/undefined in case it doesn't know how to resolve the path to that module.
          // Or in the case the composed module doesn't contain a suitable component definition for react-docgen.
          if (!composedFile) {
            return allComposed;
          }

          /* $lab:coverage:off$ */
          if (!ASTsByFile[composedFile]) {
            throw new Error(
              `You didn't ignore a composed path for ${composedFile} in ${file} or you didn't included it in the options.include`,
            );
          }
          /* $lab:coverage:on$ */

          const composingComponentDefinitions = ASTsByFile[composedFile].filter(
            composedFileComponentDefinition =>
              this.options.isComposingComponent(
                {
                  composingFile: componentDefinition,
                  composedFile: composedFileComponentDefinition,
                  composingFilePath: file,
                  composedFilePath: composedFile,
                },
                this.defaultIsComposingComponent,
              ),
          );

          composingComponentDefinitions.forEach(composingComponentDefinition => {
            allComposed.push(composingComponentDefinition);

            // In case we're deeply composing
            if (composingComponentDefinition.composes) {
              const compositions = getComposes(
                ASTsByFile,
                composingComponentDefinition,
                composedFile,
              );

              const remainingCompositions = compositions.filter((ast, index) => {
                return (
                  compositions.findIndex(
                    (ast2, index2) => ast2.componentName === ast.componentName && index2 >= index,
                  ) === index
                );
              });

              allComposed.push(
                ...remainingCompositions.map(ast =>
                  Object.assign({}, ast, {
                    componentName: composingComponentDefinition.displayName + '.' + ast.displayName,
                  }),
                ),
              );
            }
          });

          return allComposed;
        }, []);
      };

      const componentsToGenerateDoc = compilation.modules
        .filter(moduleObject => {
          return typeof this.options.include === 'function'
            ? this.options.include(moduleObject.resource)
            : this.options.include.test(moduleObject.resource);
        })
        .map(module => module.resource);

      Promise.all(
        componentsToGenerateDoc.map(
          file =>
            new Promise((resolve, reject) => {
              // Read the original asset to generate documentation for (it's probably cached)
              compilation.inputFileSystem.readFile(file, function(err, componentContent) {
                if (err) {
                  reject(err);
                } else {
                  resolve({ componentContent, file });
                }
              });
            }),
        ),
      )
        .then(componentsContent => {
          return componentsContent.reduce((ASTsByFile, { componentContent, file }) => {
            try {
              const componentDefinition = reactDocgen.parse(
                componentContent.toString(),
                this.options.resolver,
                this.handlers,
              );

              ASTsByFile[file] = Array.isArray(componentDefinition)
                ? componentDefinition
                : [componentDefinition];

              return ASTsByFile;
            } catch (e) {
              throw new Error(`
            An error has while generating documentation for ${file} in react-docgen.
            The internal error is
            ${e.message}
            ${e.stack}`);
            }
          }, {});
        })
        .then(ASTsByFile => {
          Object.keys(ASTsByFile).forEach(file => {
            // Get all the ASTs that this file composes (including deeply nested composed components)
            const componentDefinitions = ASTsByFile[file];

            componentDefinitions.forEach(componentDefinition => {
              const composesASTs = componentDefinition.composes
                ? getComposes(ASTsByFile, componentDefinition, file)
                : [];

              this.options.renderers.forEach(renderer => {
                const assetName =
                  typeof this.options.outputPath === 'function'
                    ? this.options.outputPath({ file, componentDefinition })
                    : path.join(
                        this.options.outputPath,
                        componentDefinition.displayName + renderer.extension,
                      );

                // Render the documentation for the current component
                const componentDocumentation = renderer.render(
                  file,
                  componentDefinition,
                  composesASTs,
                );

                // Add the documentation file to the compilation assets
                compilation.assets[assetName] = {
                  size() {
                    return componentDocumentation.length;
                  },
                  source() {
                    return componentDocumentation;
                  },
                };
              });
            });
          });
        })
        .then(resolve)
        .catch(reject);
    });
  });
};

module.exports = ReactDocGenPlugin;
