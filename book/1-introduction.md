For quite some time the client-server architecture was one of the most wide spread patterns in large scale software development. Even systems that run purely on one computer often are designed this way. This allows to clearly separate concerns: server takes care of heavy business logic, persistent storage, accessing data from third party services and so on and client is responsible solely for presentation to end users.

This architecture also allows to have multiple clients connected to one backend: mobile apps, IoT devices, third party REST API consumers (e.g. external developers) and web, for example.

In early days of web development it was not that way though. Server was responsible for everything. Usually it was a combination of DB, app itself, template engine, bunch of static assets (images, CSS and so on) all baked together into a monolithic app. Later on it became obvious that this kind of architecture does not scale well.

Nowadays modern web is moving back to client-server architecture with clean separation of concerns and concrete responsibilities of each component. Server side apps deal with data and client side apps deal with presentation of that data.

We will cover following topics in this chapter:

What is a single page app
Introduction to React
Single page apps performance issues
Server side rendering with React
What is a single page app 
Single page app implements such architecture for the web clients: the JavaScript app launches from a web page and then runs entirely on a client, all visual changes on website happen as a reaction on user actions and the data, that is fetched from the remote API server.

It is called single page because server does not render pages for client, it always delivers same minimalistic markup required to bootstrap the JS app. All page rendering and navigation is happening purely on client using JavaScript which utilizes History APIs to dynamically swap page contents and URL in location bar.

The advantages that this approach gives are: client can run something in background between page transitions, client does not have to re-download and re-draw the entire page in order to swap only the main content. Unfortunately, it also brings drawbacks, because now client is responsible for all state changes, synchronization of such changes across the entire interface, it must know when to load the data and what particular data. In other words, server generated app conceptually is a way simpler thing thanks to REST service + JS client.

Creating JS Modules, code sharing, code splitting, bundling 
Separation of concerns is one of the key principles in software design, and since each entity in the code has to be isolated from others it makes sense to put them into separate files to simplify the navigation and ensure isolation.
Modern JS applications consist of modules which can have exports and imports. JS modules export some entities and may consume exported entities from other modules.

In this book we will use latest JS syntax with classes, arrow functions, spread operators and so on. If you are not familiar with this syntax you can always refer to it here: http://exploringjs.com.

The simplest JS module looks like this:

// A.js:
export const noop = () => {};
This file now has a named export noop which is a an arrow function that does nothing.

Now in B.js we can import a function from file A.js:

//B.js:
import {noop} from "./A.js";
noop();
In real world, dependencies are much more complex and modules can export dozens of entities and import dozens of other modules, including those from NPM. Module system in JS allows to statically trace all dependencies and figure out ways to optimize them.

If the client will download all JS in a straightforward way (download initial one JS file, parse it’s dependencies, and recursively download them and their deps) then load time will be dramatic. First of all because network interaction takes time, second, because parsing also takes time. Simultaneous connections are often limited by browser and HTTP 2.0
(which allows to transfer many files through one connection) is not yet available everywhere, so it makes sense to bundle all assets into one big bundle and deliver all at once.

In order to do this, we can use a bundler like Weback or Rollup. These bundlers are capable of tracing all dependencies starting from initial module and up to leaf ones and packing those modules together in a single bundle. Also if, configured they allow to minify the bundle using UglifyJS or any other compressor.

Bud bundle approach also have caveats. Bundle may contain things that are not required to render particular requested page. Basically, client can download a huge initial bundle but in fact need only 30-40% of it.

Modern bundlers allow to split the app into smaller chunks and progressively load them on demand when needed. In order to create a code split point we can use the dynamic import syntax:

//B.js:
import('./A.js').then(({noop}) => {
 noop();
});
Now the build tool can see that certain modules should not be included in initial chunk and can be loaded on demand. But on the other hand, if those chunks will be too granular we will return to the starting point with tons of small files.

Unfortunately, if chunks will be less granular then, most likely they will have some modules included in more than one chunk. Those common modules (primarily the ones installed from NPM) could be moved to so-called common chunk. The goal is to find optimal proportion between initial bundle size, commons chunk size and size of code-splitted chunks.

Introduction to React 
For this section we will create a simple React based project and learn how this library works and what are the core concepts.

Let’s create an empty project folder and initialize NPM:

$ mkdir learn-react
$ cd learn-react
$ npm init
$ npm install react react-dom --save
The quickest way to get started with React is to use package react-scripts.

$ npm install react-scripts --save-dev
Now let’s add a start script to package.json:

{
  "scripts": {
    "start": "react-scripts start"
  }
}
NPM auto-binds CLI scripts installed to node_modules/.bin directory along with the packages, so we can use scripts directly.

The smallest possible setup for React app is the following, we need a landing HTML page and one script with the app.

Let’s start with bedrock HTML:

<!--public/index.html-->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Learn React</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
And the main JS file:

//src/index.js:
import React from "react";
import {render} from "react-dom";
render(
  <h1>It works!</h1>,
  document.getElementById('app')
);
This is it. Now we can run the command to start development server:

$ npm start
It will open http://localhost:3000 and display It works! text.

To learn more about React JSX, I encourage you to take a look at official documentation:
https://reactjs.org/docs/introducing-jsx.html. This chapter will only briefly cover the main aspects that are essential for NextJS apps.
The simplest React component is just a function that takes props as argument and returns JSX:

const Cmp = (props) => (<div>{props.children}</div>);
A more complicated components may have state:

class Cmp extends React.Component {
  state = {value: 'init'};
  onClick = (event) => { this.setState({value: 'clicked'}); };
  render() {
    return (
      <button onClick={this.onClick}>{this.state.value}</button>
     );
  }
}
Components may have static properties:

class Cmp extends React.Component {
  static foo = 'foo';
}
or

Cmp.foo = 'foo';
These static properties are often used to describe some meta information about the components:

import PropTypes from "prop-types";
Cmp.propTypes = {
  propName: PropTypes.string
};
Next JS is actively using them and we will later show you how.

The simplest way to achieve code splitting in React application is to store the entire progressively loaded component in state:

class Cmp extends React.Component {
  state = {Sub: null};
  onClick = async (event) => {
    const Sub = (await import('./path/to/Sub.js')).default;
    this.setState({Sub});
  };
  render() {
    const {Sub} = this.state;
    return (
      <div>
        <button onClick={this.onClick}>Load</button>
        <Sub/>
      </div>
    );
  }
}
Another way to achieve the code splitting is to use the React Router.

All React components have lifecycle hooks that can be utilized, for example, to load the data from remote server:

class Cmp extends React.Component {
  state = {data: null};
  async componentWillMount() {
    const data = await (await fetch('https://example.com')).json();
    this.setState({data});
  }
  render() {
    const {data} = this.state;
    return (
      <pre>
        {JSON.stringify(data)}
      </pre>
    );
  }
 }
React API has way more stuff, but these things are absolutely essential for Next JS.

Why single page apps suffer performance issues? 
In order to start SPA has to download lots of assets to the client: JS files with the app itself, CSS files with styles, images, media and so on. It is impossible to develop a large scale JS app without any kind of modularization, so most JS apps consist of numerous small JS files (the above mentioned modules). CSS files also usually are separated by some criteria: per component, per page, etc.

The nature of SPAs forces them to have heavy API traffic, basically, any user action that has to be persisted requires an API call. Pulling data from persistent storage also requires API calls.

Both of these two aspects bring us to the most terrible SPA performance issue: the initial load time could be quite long. There were studies that clearly shown the correlation between the load time and page views, conversion and other vital metrics. On average customers leave the page if it fails to load within 2-3 seconds.

Another big issue is SEO. Search engines tend to give higher rank to pages that load quicker. Plus, only recently crawlers learned how to parse and crawl SPAs properly.

How to deal with it?

Assume we have found a good balance between initial chunk and on demand chunks. We have applied compression and good cache strategies, but still, there is API layer that also has to be optimized for initial load.

Potentially, we can combine all API requests in one huge request and load it. But different pages need different data, so we can’t create a request that will fit all, at least not within REST principles. Also, some of the data requires client side processing before we can make a subsequent request for more data. Modern API techniques like GraphQL allows
to solve it more or less, and we will talk about it later in the book, but this still does not address the issue with not-so-smart search engine crawlers.

Sad? Yes. But there is a solution for that. It is called server side rendering.

Server side rendering 
Back in the days web servers used templates to deliver initial HTML to the client. Languages like Java, PHP, Python and Ruby were quite suitable for such kind of tasks. Those pages were called server-generated. Basically, all navigation and interaction was based on those dynamically generated pages.

Those server generated pages were very simple in terms of user interaction, some hover effects and simple scripts. Some time after a more complicated scenarios were introduced and the bias moved towards client side. Servers began to generate not just full templates but also replaceable fragments to reflect more in-place changes. Later on because of the shift to REST APIs, a cleaner separation of concerns brought industry away from server-generated approaches to fully JS driven apps.

But in order to more efficiently load the initial data for JS app, we can utilize this approach a little bit. We can render the initial markup on the server and then let JS app take over. The main assumption here is the fact that server side renderer is usually much closer to API server, ideally in same collocation, so it has much better connection and way more bandwidth than remote clients. It also can utilize all benefits of HTTP2 or any other protocols to maintain fast data exchange. The server side renderer is capable of doing all those chained requests much faster than clients, and all codebase can be pre-loaded and pre-parsed. Also it can use more aggressive data caching strategies because invalidation
also could be centrally maintained.

To decrease code duplication we would like to use same technology and same templates both on client and on the server.
Such kind of apps is called universal or isomorphic.

The general approach is as follows: we take NodeJS server, install a web framework and start listening to incoming requests. On every request that matches certain URL we take the client scripts and use them to bootstrap the initial state of the app for given page. Then we serialize the resulting HTML and data, bake it together and send to client.

Client immediately shows the markup and then bootstraps the app on the client, applying initial data and state and hence taking control.
Next page transition will happen purely on the client, it will load data from regular API endpoints just like before. One of the trickiest parts of this approach is to make sure that same page with same HTML will be rendered both on client and on the server, which means we need to make sure the client app will be bootstrapped in a certain state, that will result in same HTML.

This brings us to framework choice. Not all client-side frameworks are capable of server-side rendering, for example it would be quite challenging to write a jQuery app that will pick up state and render itself correctly and on top of existing HTML.

How to do server side rendering with React 
Luckily React is built with 2 main concepts in mind: it’s state driven and it is capable of rendering to plain HTML. React is often used with React Router, so let’s take this and explain how to render your React app on a server.

React-based server side rendering frameworks, why Next JS 
Nowadays there are few competitors in React-based server side rendering market. We can divide them into the following categories:

Drop in dynamic solution (NextJS, Electrode)
Drop in static solution (Gatsby, React Static)
Custom solutions
The main difference between first two approaches is the way it builds and serves the app from server.

Static solution makes a static HTML build (with all possible router pages) and then this build can be served by static server like Nginx, or any other. All HTML is pre-bakes, as well as initial state. This is very suitable for websites with incremental content updates that happen infrequently, for example, a blog.

Dynamic solution generates HTML on the fly every time when client requests it. This means we can put any dynamic logic, any dynamic HTML blocks like per-request ads and so on. But the drawback is that it requires a long running server.
This server has to be monitored and ideally should become a cluster of servers for redundancy to make sure of its’ high availability.

We will put main focus of this book on dynamic solutions as they are more flexible and more complex and so require deeper understanding.

For better understanding lets dive deeper in custom solution using only React and React Router.

Let's install the router and special package to configure routes statically (it's impossible to generate purely dynamic routes on server):

npm i --save react-router-dom react-router-config
Now let's configure the routes:

const routes = [
  {
    path: '/',
    exact: true,
    component: Index
  },
  {
    path: '/list',
    component: List
  }
];
export default routes;
The main app entry point should then look like this:

// index.js
import React from 'react';
import {render} from 'react-dom';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import { renderRoutes } from 'react-router-config';
import routes from './routes';

const Router = () => {
  return (
    <BrowserRouter>
      {renderRoutes(routes)}
    </BrowserRouter>
  )
};

render(<Router />, document.getElementById('app'));
On server it will be the following:

import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import StaticRouter from 'react-router-dom/StaticRouter';
import { renderRoutes } from 'react-router-config';
import routes from './src/routes';

const app = express();

app.get('*', (req, res) => {
  let context = {}; // pre-fill somehow
  const content = renderToString(
    <StaticRouter location={req.url} context={context}>
      {renderRoutes(routes)}
    </StaticRouter>
  );
  res.render('index', {title: 'SSR', content });
}); 
But this will simply render the page with no data. In order to pre-populate data into the page we need to do the following, both in component and in server:

Each data-enabled component must expose a method that the server should call during route resolution
Server iterates over all matched components and utilizes exposed methods
Server collects the data and puts in some storage
Server renders the HTML using routes and data from storage
Server sends to the client the resulting HTML along with data
Client initializes using HTML and pre-populates state using data
We purposely won't show steps 3 and more because there is no generic way for pure React and React Router. For storage most solutions will use Redux and this is a whole another topic. So here we just show the basic principle.

// list.js
import React from "react";

const getText = async () => (await (await fetch('https://api.github.com/users/octocat')).text());

export default class List extends React.Component {

  state = {text: ''};

  static async getInitialProps(context) {
    context.text = await getText();
  }

  async componentWillMount() {
    const text = await getText();
    this.setState({text})
  }
  
  render() {
    const {staticContext} = this.props;
    let {text} = this.state;
    if (staticContext && !text) text = staticContext.text;
    return (
      <pre>Text: {text}</pre>
    );
  }

}
// server.js
// all from above
app.get('*', (req, res) => {
  const {url} = req;
  const matches = matchRoutes(routes, url);
  const context = {};
  const promises = matches.map(({route}) => {
    const getInitialProps = route.component.getInitialProps;
    return getInitialProps ? getInitialProps(context) : Promise.resolve(null)
  });
  return Promise.all(promises).then(() => {
    console.log('Context', context);
    const content = renderToString(
      <StaticRouter location={url} context={context}>
        {renderRoutes(routes)}
      </StaticRouter>
    );
    res.render('index', {title: 'SSR', content});
  });
});
The reason why we are not covering those aspects is because even after tons of research it becomes obvious that custom solution will always have quirks and glitches primarily because React Router was not meant to be used on a server, so
every custom solution is basically a bunch of hacks. It would be much better to take a stable solution which was built with Server Side Rendering in mind from day one.

Among other competitors NextJS stands out as one of the pioneers of the approach, this framework is so far the most popular these days. Primarily because it offers a very convenient API, easy installation, zero config and huge community. Unlike Electrode which is extremely painful to configure.

Full comparison is available in my article https://medium.com/disdj/solutions-for-react-app-development-f9fcaeba504.

Summary
In this chapter we have learned how web apps evolved over time from simple server generated pages to single page apps and then back to server generated pages with SPAs on top. We learned what is React JS and how to server-render the React application.

In the next chapter we will use this knowledge to build a more advanced application that still follows these core principles.