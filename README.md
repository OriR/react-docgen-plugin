## react-docgen-plugin

Webpack plugin to generate React component documentation.</br>
Unlike most other loaders/plugins this plugin also renders the documentation to a human readable format.</br>
All documentation is emitted to the output path defined by webpack.

### Install
```
npm install --save-dev react-docgen-plugin
```

### Usage
Once installed, can be used in your webpack configuration file
```javascript
const ReactDocGenPlugin = require('react-docgen-plugin');
const ReactDocGenMarkdownRenderer = require('react-docgen-markdown-renderer');

module.exports = {
  ...
  plugins: [
    ...
    new ReactDocGenPlugin({
      // (resource) => Boolean | RegExp
      include: () => true,
      
      // Optional Array<Renderer>
      renderers: [new ReactDocGenMarkdownRenderer({
        componentsBasePath: process.cwd()
      })]
    })
  ]
};
```

By default `react-docgen-plugin` will use `react-docgen-markdown-renderer` with the above configuration.</br>

#### options
##### include `(resource) => Boolean | RegExp`
This property is mandatory.</br>
Either a predicate or a RegExp to match every resource with. Documentation will only be generated to resources that have been matched. 

##### renderers `Array<Renderer>`
This property is optional.</br>
An array of `Renderer` objects. A `Renderer` is an object that consists of an `extension` property and a `render(file, content) => String` function.</br>
The `extension` represents the file extension that this renderer emits.</br>
The `render(file, content) => String` function is in charge of rendering the documentation according to the given component file path and content.</br>
The default value for `renderers` is `[new ReactDocGenMarkdownRenderer({ componentsBasePath: process.cwd() })]` which emits a markdown documentation.


### FAQ
##### I want an HTML documentation
You can implement your own renderer, but you can use this neat trick instead:
```javascript
var MDToHTMLConverter  = require('showdown').Converter;

class MyHTMLRenderer {
  constructor(mdRenderer){
    this.mdRenderer = mdRenderer;
    this.extension = '.html';
  }
  
  render(file, content) {
    return new MDToHTMLConverter().makeHTML(this.mdRenderer(file, content));
  }
}

module.exports = {
  ...
  plugins: [
    ...
    new ReactDocGenPlugin({
      renderers: [new MyHTMLRenderer(new ReactDocGenMarkdownRenderer({
        componentsBasePath: process.cwd()
      }))]
    })
  ]
};
```
And Voila! you've just created an HTML renderer :)</br>
This approach can be used for every format that has a converter from markdown.

##### I want a [insert esoteric format here] renderer
Well, in that case you have to implement your own renderer.</br>
You can look at [react-docgen-markdown-renderer](../../../../OriR/react-docgen-markdown-renderer) for more details on how to do just that.
