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
      })],
      
      // Optional (file, composedModule) => String
      resolveCompose(file, composedModule) {
        return '';
      },
      
      // Optional String
      outputPath: '',

      // Optional Array<Addon>
      addons: []
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

##### resolveCompose `(file, composedModule) => String`
This property is optional.</br>
In case you're composing components but have aliases or using third party components.</br>
This returns the absolute path to the composed module or `undefined` if this module can't be composed for some reason.</br>

##### outputPath `String`
This property is optional.</br>
In case you want to output the documentation to a location other than the config.output.path directory.</br>

##### addons `Array<Addon>`
This property is optional.</br>
In case there's a custom logic you want to add both to the renderers you're using **and** `react-docgen` you're probably gonna use this.
Addons are a powerful way to enhance the basic functionality of this plugin.
This package comes with an advanced composition plugin, appropriately called, `AdvancedComposeAddon`.
It allows for more advanced composition detection like `prop: PropTypes.shape(MyComponent.propTypes)` and more.
To use it simply add the following:
```js
const AdvancedComposeAddon = require('react-docgen-plugin/addons/AdvancedComposeAddon');
...
new ReactDocGenPlugin({
  addons: [new AdvancedComposeAddon()],
  ...
})
```
And now it can detect many types of compositions in your prop types!
The reason it's not configured by default is it that adds a lot of overhead during the documentation parsing stage.

### FAQ
#### I want an HTML documentation
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

#### I want a [insert format here] renderer
Well, in that case you have to implement your own renderer.</br>
You can look at [react-docgen-markdown-renderer](https://github.com/OriR/react-docgen-markdown-renderer) for more details on how to do just that.

#### I want to create an addon
Nice!
Addons are really powerful and allow you to customize everything with relative ease.
An addon has a `getHandlebarsPlugin` method and a `reactDocgenCustomHandlers` property.
Let's start with `reactDocgenCustomHandlers`.
This property will be passed to [`react-docgen`](https://github.com/reactjs/react-docgen#parsesource--resolver--handlers) as custom handlers.
You can write your own or import an existing handler, it doesn't matter, as long as it does the job.
You can look at the source of [`advancedComposesHandler.js`](./addons/AdvancedComposeAddon/advancedComposesHandler.js) to get a sense of how it should look.

Next up is `getHandlebarsPlugin`.
Since we're gonna have custom handlers for `react-docgen` we might need a way to represent them in the templating engine.
When writing custom renderers, this assumes that you'll always use `handlebars`(hence the name `getHandlebarsPlugin`) to render the output string.
Though a bit limiting, `handlebars` is extremely versatile, that's why it was chosen as the templating engine.
So `getHandlebarsPlugin` takes in an extension of a renderer and returns a handlebars plugin function.
That function takes in a `handlebars` instance and returns it. This allows you to configure it in anyway you want!
You can look at the source of [`AdvancedComposeAddon.js`](./addons/AdvancedComposeAddon/AdvancedComposeAddon.js) for reference.


It's recommended to extend `Addon` from `react-docgen/addons/Addon` but it's not mandatory,
you can just implement `getHandlebarsPlugin` and `reactDocgenCustomHandlers` and you're good to go!