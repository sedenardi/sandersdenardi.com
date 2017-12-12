---
title: Universal Multi-Page React App
date: 2017-11-21T20:35:12-05:00
author: Sanders
url: /universal-multi-page-react/
tags:
  - javascript
  - nodejs
  -
  - koa
  - react
---
If you're using one of the modern client-side javascript frameworks, I'm sure you've heard of server-side rendering. That is, sending the initial markup fully-rendered on the initial page load. This lets the browser start rendering the HTML as the client javascript is being downloaded and executed. It also lets search engines crawl your site easier.

Apps that use this technique often use the React framework and are served using a Nodejs server, and are referred to as "universal" (or "isomorphic", though I think that term has fallen out of fashion). Universal as in the same React view components are rendered in javascript on both the client and the server.

There are many different ways to go about building a universal React app, with many example projects easily searchable on GitHub and elsewhere. While most of these projects result in single-page applications, I'm going to show you how to build a multi-page universal app using a modern (at time of publication) web server (<a href="http://koajs.com/" target="_blank">koa 2</a>), build tooling (<a href="https://gulpjs.com/" target="_blank">gulp 4</a>, <a href="https://webpack.js.org/" target="_blank">webpack 3</a>, <a href="https://babeljs.io/" target="_blank">babel 6</a>), and build features (incremental builds, production-ready builds, etc.).

## Why Multi-Page
Before we get started, while I don't want to turn this blog into an all-out defense of multi-page web applications, I do want to explain a couple benefits:

- **Easy route to page mapping** - no complicated routing markup is required, you traverse to different pages using regular `<a>` anchor links `</a>`
- **Fast page loads** - you're only loading the page you're navigating to, so the page's code should be tiny, and your large vendor library bundle should be cached

Single-page applications have made great strides over the past years to improve performance using code-splitting and whatnot, so it's really a personal choice.

## Universal Basics
I'm not meaning for this to be a detailed explainer of how universal apps work in general. If you're unfamiliar with the details of how they work, there are several <a href="https://hackernoon.com/isomorphic-universal-boilerplate-react-redux-server-rendering-tutorial-example-webpack-compenent-6e22106ae285" target="_blank">detailed</a> <a href="https://codeburst.io/react-isomorphic-universal-app-w-nodejs-redux-react-router-v4-be80aa57dcaf" target="_blank">guides</a> on the subject, with the caveat that they're usually fully-featured from the get-go (with Redux and React-Router) and, thus, complex. As a basic recap, here's the basic operation:

#### Build
- Create the client bootstrap javascript that attaches React to the markup
{{< highlight javascript >}}
import React from 'react';
import { hydrate } from 'react-dom';
import Component from './path/to/view.jsx';

const container = document.getElementById('page');
const props = JSON.parse(document.getElementById('props').innerHTML);
const element = React.createElement(Component, props);
hydrate(element, container);
{{< /highlight >}}
- Build the file using Webpack or similar to transpile the JSX & ES6 code
- Optionally create a vendor file for libraries that won't change every build

#### Server
- Receives request in router
- Declares the view element (this can be done outside of router)
- Render the view to HTML using <a href="https://reactjs.org/docs/react-dom-server.html#rendertostring" target="_blank">ReactDOMServer</a> (with your props)
{{< highlight javascript >}}
const React = require('react');
const ReactDOM = require('react-dom');
const Component = require('./path/to/view.jsx');
const templatePath = path.join(config.app.root, 'build/pageTemplate.html');
const template = _.template(fs.readFileSync(templatePath));

router.get('/', async (ctx) => {
  const element = React.createElement(Component, props);
  const rendered = ReactDOMServer.renderToString(element);
  ctx.body = template({ body: rendered });
});
{{< /highlight >}}
- Inject that rendered HTML and serialized props into a template that loads the prebuilt page component
- Send the complete page to the client

#### Client
- Render initial HTML to the client (the page is visible)
- Deserialize the props
- <a href="https://reactjs.org/docs/react-dom.html#hydrate" target="_blank">Attach React event listeners</a> to the page

## Multi-Page Modifications
Our multi-page app follows the same structure, but generalizes each step by parameterizing the view aspect, and creating a route helper to prevent code duplication. For our example app, we'll assume each view ending with `*Page.jsx` is one of the pages we'll want to use.

#### Build
- Instead of building one single bootstrap file, we create one for each page (here I'm using <a href="https://lodash.com/docs/4.17.4#template" target="_blank">lodash template</a> to inject the page information)
{{< highlight javascript >}}
import React from 'react';
import { hydrate } from 'react-dom';
import <%= moduleName %> from '<%= modulePath %>';

const container = document.getElementById('page');
const props = JSON.parse(document.getElementById('props').innerHTML);
const element = React.createElement(<%= moduleName %>, props);
hydrate(element, container);
{{< /highlight >}}
- Create a Webpack file with <a href="https://webpack.js.org/concepts/entry-points/#multi-page-application" target="_blank">multiple entry points</a> so that multiple files are generated
- For production environments, add a separate `vendor` entry and uglify the output javascript files

#### Server
- Search project for `*Page.jsx` files and declare them by key
{{< highlight javascript >}}
const globPattern = path.join(viewsDir, '/**/*Page.jsx');
const pageFiles = glob.sync(globPattern);
const pages = _.reduce(pageFiles, (result, fileName) => {
  const key = path.basename(fileName).replace('.jsx', '');
  result[key] = require(fileName).default;
  return result;
}, {});
{{< /highlight >}}
- In the route handler, declare the route you want to use and eventually render
{{< highlight javascript >}}
router.get('/', async (ctx) => {
  ctx.state.view = 'IndexPage';
  ctx.state.props = props;
});
{{< /highlight >}}
- Render markup & props in a downstream middleware handler
{{< highlight javascript >}}
if (pages[ctx.state.view]) {
  const element = React.createElement(pages[ctx.state.view], ctx.state.props);
  const rendered = ReactDOMServer.renderToString(element);
  ctx.body = template({
    body: rendered,
    script: `${ctx.state.view}.js`
  });
} else {
  throw new Error(`Missing view: ${ctx.state.view}`);
}
{{< /highlight >}}

While this example uses `koa` as the http framework, most frameworks allow you to run such code in the route processing chain (middleware), so this can be easily ported to `express` or `hapi`.

## Incremental Build

As your application grows and matures, you may end up with several dozen pages composed of many more small components. When a component changes, we don't necessarily need to rebuild every page, and incur the build time penalty that comes with that. The included `gulp` build tooling includes a mechanism to only rebuild the pages that include a view that has changed. It does this by:

- Build view dependency graph - a list of views and the view components they depend on
- Gets views that have changed since last build
- Walk up the dependency graph from the changed views to find the pages affected
- Create a new Webpack file with *just* those pages as entries

## Going Further

While most boilerplate projects are more fully-realized, this is purposefully devoid of:

- Database access
- User authentication
- Styles
- State management
- Hot reloading
- Tests

These features, while essential for building a functional, production-ready application, can be implemented several different ways, and outside styles, don't touch this project's files.

All code can be found on <a href="https://github.com/sedenardi/koa-react-universal-multi-page" target="_blank">GitHub</a>. Feel free to as me any questions there, file any issues if something isn't clear, or submit a pull request.
