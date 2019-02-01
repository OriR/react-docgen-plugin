const path = require('path');
const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const webpack = require('webpack');
const ReactDocgenWebpackPlugin = require('../../lib');
const AdvancedComposeAddon = require('../../lib/addons/AdvancedComposeAddon');
const reactDocgen = require('react-docgen');
const RemoveAssetsWebpackPlugin = require('remove-assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const rimraf = require('rimraf');

const testFolder = './test/temp';
const docsFolder = './test/temp/docs';

lab.experiment('generate docs', () => {
  lab.beforeEach(({ context }) => {
    context.getConfig = ({ entry, ...rest }) => {
      return {
        entry,
        output: {
          path: path.resolve(testFolder),
          filename: 'temp.js'
        },
        module: {
          rules: [
            {
              test: /.*\.jsx$/,
              include: /fixtures/,
              exclude: /node_modules/,
              loader: 'babel-loader'
            }
          ]
        },
        plugins: [
          new CleanWebpackPlugin([testFolder, docsFolder]),
          new ReactDocgenWebpackPlugin({
            ...rest,
            outputPath: path.relative(testFolder, docsFolder)
          }),
          new RemoveAssetsWebpackPlugin(/.*\.js$/)
        ]
      };
    }
  });

  lab.test('with composition', ({ context }) => {
    return new Promise((resolve, reject) => {
      webpack(context.getConfig({
        entry: './test/simple-components-tests/fixtures/composition/index.jsx',
        include: (resource) => resource.includes('/fixtures/composition/') && !resource.endsWith('index.jsx')
      }), (err, stats) => {
        Object.entries(stats.compilation.assets).forEach(([key, value]) => {
          if (key.includes('A.md')) {
            expect(value.source()).to.equal("## A\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**boolProp** | `Boolean` | `true` | :x: | Description for boolProp\n**objectOfProp** | `Object[#]<Union<Object\\|Enum(\'String\', \'Number\')\\|Function>>` |  | :x: | Description for objectOfProp\n**objectOfProp[#]<1>** | `Object` |  | :x: | \n**objectOfProp[#]<2>** | `Enum(\'String\', \'Number\')` |  | :x: | \n**objectOfProp[#]<3>** | `Function` |  | :x: | \n\n\nA gets more `propTypes` from these composed components\n#### B\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**arrayOfProp** | `Array[]<Shape>` |  | :x: | Description for arrayOfProp\n**arrayOfProp[].index** | `Number` |  | :white_check_mark: | Description for required index in shape\n**stringProp** | `String` |  | :x: | Description for stringProp\n");
          } else if (key.includes('B.md')) {
            expect(value.source()).to.equal("## B\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**arrayOfProp** | `Array[]<Shape>` |  | :x: | Description for arrayOfProp\n**arrayOfProp[].index** | `Number` |  | :white_check_mark: | Description for required index in shape\n**stringProp** | `String` |  | :x: | Description for stringProp\n\n");
          } else if (key.includes('C.md')) {
            expect(value.source()).to.equal("## C\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**anyProp** | `*` |  | :x: | \n**nodeProp** | `ReactNode` |  | :x: | Only one description\n\n\nC gets more `propTypes` from these composed components\n#### A\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**boolProp** | `Boolean` | `true` | :x: | Description for boolProp\n**objectOfProp** | `Object[#]<Union<Object\\|Enum(\'String\', \'Number\')\\|Function>>` |  | :x: | Description for objectOfProp\n**objectOfProp[#]<1>** | `Object` |  | :x: | \n**objectOfProp[#]<2>** | `Enum(\'String\', \'Number\')` |  | :x: | \n**objectOfProp[#]<3>** | `Function` |  | :x: | \n\n#### A.B\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**arrayOfProp** | `Array[]<Shape>` |  | :x: | Description for arrayOfProp\n**arrayOfProp[].index** | `Number` |  | :white_check_mark: | Description for required index in shape\n**stringProp** | `String` |  | :x: | Description for stringProp\n");
          } else if (key.includes('D.md')) {
            expect(value.source()).to.equal("## D\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**someProp** | `Union<Shape\\|Function>` |  | :x: | Some prop\n**someProp<1>** | `Shape` |  | :x: | \n**someProp<1>.array** | `Array[]<Object[#]<Number>>` |  | :x: | Some shapre array\n**someProp<1>.index** | `Number` |  | :white_check_mark: | Some shape index\n**someProp<2>** | `Function` |  | :x: | \n\n\nD gets more `propTypes` from these composed components\n#### B\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**arrayOfProp** | `Array[]<Shape>` |  | :x: | Description for arrayOfProp\n**arrayOfProp[].index** | `Number` |  | :white_check_mark: | Description for required index in shape\n**stringProp** | `String` |  | :x: | Description for stringProp\n\n#### E\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**index** | `Number` |  | :white_check_mark: | Some index prop\n");
          } else if (key.includes('E.md')) {
            expect(value.source()).to.equal("## E\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**index** | `Number` |  | :white_check_mark: | Some index prop\n\n");
          }
        });
        resolve();
      });
    });
  });

  lab.test('flat', ({ context }) => {
    return new Promise((resolve, reject) => {
      webpack(context.getConfig({
        entry: './test/simple-components-tests/fixtures/flat/index.jsx',
        include: (resource) => resource.includes('/fixtures/flat/') && !resource.endsWith('index.jsx')
      }), (err, stats) => {
        Object.entries(stats.compilation.assets).forEach(([key, value]) => {
          if (key.includes('A.md')) {
            expect(value.source()).to.equal("## A\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**boolProp** | `Boolean` | `true` | :x: | Description for boolProp\n**objectOfProp** | `Object[#]<Union<Object\\|Enum('String', 'Number')\\|Function>>` |  | :x: | Description for objectOfProp\n**objectOfProp[#]<1>** | `Object` |  | :x: | \n**objectOfProp[#]<2>** | `Enum('String', 'Number')` |  | :x: | \n**objectOfProp[#]<3>** | `Function` |  | :x: | \n\n");
          } else if (key.includes('B.md')) {
            expect(value.source()).to.equal("## B\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**arrayOfProp** | `Array[]<Shape>` |  | :x: | Description for arrayOfProp\n**arrayOfProp[].index** | `Number` |  | :white_check_mark: | Description for required index in shape\n**stringProp** | `String` |  | :x: | Description for stringProp\n\n");
          }
        });
        resolve();
      });
    });
  });

  lab.test('with custom renderers', ({ context }) => {
    return new Promise((resolve, reject) => {
      webpack(context.getConfig({
        entry: './test/simple-components-tests/fixtures/renderers/index.jsx',
        renderers: [{
          extension: '.html',
          compile() {},
          render(file, docs, composes) {
            return `
<div>
  <h1>${docs.displayName}</h1>
  <div>
    ${Object.keys(docs.props)}
  </div>
</div>`;
          }
        }],
        include: (resource) => resource.includes('/fixtures/renderers/') && !resource.endsWith('index.jsx')
      }), (err, stats) => {
        Object.entries(stats.compilation.assets).forEach(([key, value]) => {
          if (key.includes('A.md')) {
            expect(value.source()).to.equal(`
<div>
  <h1>A</h1>
  <div>
    boolProp, objectOfProp
  </div>
</div>`);
          } else if (key.includes('B.md')) {
            expect(value.source()).to.equal(`
<div>
  <h1>B</h1>
  <div>
    stringProp, arrayOfProp
  </div>
</div>`);
          }
        });
        resolve();
      });
    });
  });

  lab.test('must include', ({ context }) => {
    expect(() => {
      webpack(context.getConfig({
        entry: './test/simple-components-tests/fixtures/renderers/index.jsx'
      }), () => {});
    })
    .to.throw(Error, 'ReactDocGenPlugin must get an `include` property. See documentation for more details.');
  });

  lab.test('with custom resolver', ({ context }) => {
    return new Promise((resolve, reject) => {
      webpack(context.getConfig({
        entry: './test/simple-components-tests/fixtures/resolver/index.jsx',
        resolver: reactDocgen.resolver.findAllExportedComponentDefinitions,
        isComposingComponent: (options, defaultIsComposingComponent) => {
          const { displayName, composingFile } = options;
          if (composingFile.endsWith('E.jsx') && (displayName === 'A' || displayName === 'B')) {
            return true;
          } else {
            return defaultIsComposingComponent(options);
          }
        },
        include: (resource) => resource.includes('/fixtures/resolver/') & !resource.endsWith('index.jsx')
      }), (err, stats) => {
        Object.entries(stats.compilation.assets).forEach(([key, value]) => {
          if (key.includes('A.md')) {
            expect(value.source()).to.equal("## A\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**boolProp** | `Boolean` | `true` | :x: | Description for boolProp\n**objectOfProp** | `Object[#]<Union<Object\\|Enum(\'String\', \'Number\')\\|Function>>` |  | :x: | Description for objectOfProp\n**objectOfProp[#]<1>** | `Object` |  | :x: | \n**objectOfProp[#]<2>** | `Enum(\'String\', \'Number\')` |  | :x: | \n**objectOfProp[#]<3>** | `Function` |  | :x: | \n\n");
          } else if (key.includes('B.md')) {
            expect(value.source()).to.equal("## B\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**anyProp** | `*` | `{}` | :x: | Description for anyProp\n**numberProp** | `Number` |  | :x: | Description for numberProp\n\n");
          } else if (key.includes('C.md')) {
            expect(value.source()).to.equal("## C\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**boolProp** | `Boolean` | `true` | :x: | Description for boolProp\n**objectOfProp** | `Object[#]<Union<Object\\|Enum(\'String\', \'Number\')\\|Function>>` |  | :x: | Description for objectOfProp\n**objectOfProp[#]<1>** | `Object` |  | :x: | \n**objectOfProp[#]<2>** | `Enum(\'String\', \'Number\')` |  | :x: | \n**objectOfProp[#]<3>** | `Function` |  | :x: | \n\n");
          } else if (key.includes('D.md')) {
            expect(value.source()).to.equal("## D\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**anyProp** | `*` | `{}` | :x: | Description for anyProp\n**numberProp** | `Number` |  | :x: | Description for numberProp\n\n");
          } else if (key.includes('E.md')) {
            expect(value.source()).to.equal("## E\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**anyProp** | `*` | `{}` | :x: | Description for anyProp\n**numberProp** | `Number` |  | :x: | Description for numberProp\n\n\nE gets more `propTypes` from these composed components\n#### A\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**boolProp** | `Boolean` | `true` | :x: | Description for boolProp\n**objectOfProp** | `Object[#]<Union<Object\\|Enum(\'String\', \'Number\')\\|Function>>` |  | :x: | Description for objectOfProp\n**objectOfProp[#]<1>** | `Object` |  | :x: | \n**objectOfProp[#]<2>** | `Enum(\'String\', \'Number\')` |  | :x: | \n**objectOfProp[#]<3>** | `Function` |  | :x: | \n\n#### B\n\nprop | type | default | required | description\n---- | :----: | :-------: | :--------: | -----------\n**anyProp** | `*` | `{}` | :x: | Description for anyProp\n**numberProp** | `Number` |  | :x: | Description for numberProp\n");
          }
        });
        resolve();
      });
    });
  });

  lab.test('with addons', ({ context }) => {
    return new Promise((resolve, reject) => {
      debugger;
      webpack(context.getConfig({
        entry: './test/simple-components-tests/fixtures/addons/index.jsx',
        addons: [new AdvancedComposeAddon()],
        include: (resource) => resource.includes('/fixtures/addons/') & !resource.endsWith('index.jsx')
      }), (err, stats) => {
        Object.entries(stats.compilation.assets).forEach(([key, value]) => {
          console.log(value.source());
        });
        resolve();
      });
    });
  });

  lab.afterEach(() => {
    rimraf.sync(testFolder);
  });
});