In this chapter we will learn very basics of NextJS, like installation, development and production usage, how to create simple pages and add components to them, how to apply styles and add media.

Installation
Developer mode
Pages
Production mode
Routing
Dynamic routing
SEO-friendly routing
Styles
Media
Graphs
Installation of NextJS 
First, create an empty project folder and initialize NPM in it:
$ mkdir next-js-condensed
$ cd next-js-condensed
$ npm init
After that let’s install the NextJS package:
$ npm install nextjs@latest --save-dev
$ npm install react@latest react-dom@latest --save
The reason why we save NextJS to dev dependencies is to clearly separate deps for client and for server. Server-side deps will be in dev, client will be in regular.

If you're using Git or any other source control it makes sense to add an ignore file that will remove build artifacts folder from the source control. We will show an example .gitignore file here:

Running Next JS in developer mode
In order to start the server by convention we need to define a start script in package.json so we will add the following there:

{
  "scripts": {
    "start": "next"
  }
}
Now you can start the server by typing this in console:

$ npm start
Now if you visit http://localhost:3000 in your browser you will see the running server.

Creating your first Next JS page
Now let's create the first page and place it in pages folder:

// pages/index.js
import React from "react";
export default () => (<div>Hello, World!</div>);
Now, if you run the dev server (npm start) and visit http://localhost:3000 you will see the page.


Now let's see how NextJS handle errors in your files:

// pages/index.js
import React from "react";
export default () => (<div><p>Hello, World!</div>);
//                          ^ here we purposely not closing this tag
then reload the page and see this:


Running Next JS production build
Next JS supports two kinds of production usage: static and dynamic, the main difference is that static build can be served by any static HTTP server as a static web site, whereas dynamic usage means that there will be a NextJS server that executes production build.

Static mode is best suitable for simple websites with no dynamic content. We need to add a script to package.json:

{
  "scripts": {
    "static": "next export"
  }
}
Now if we run

$ npm run static
It will create a static build that we can deploy somewhere. We will cover this in later chapters.

In order to build & run the site for dynamic production mode we will add more scripts to package.json:

{
  "scripts": {
    "build": "next build",
    "server": "next start"
  }
}
Then in console run

$ npm run build
$ npm run server
This will make the build and run the production server using that build.

Making Next JS Routing
Let's make another page:

// pages/second.js
import React from "react";
export default () => (<div>Second</div>);
This new page is accessible via http://localhost:3000/second.

Now let's add a link to that second page to the index page. If we use simple <a> tag for this it will work, of course, but it will perform a regular server request instead of client-side navigation, so performance of such nav will be much worse, client will reload all the initialization payloads and will be forced to re-initialize the entire app.

In order to do a proper client-side navigation we need to import a link component from NextJS:

// pages/index.js
import React from "react";
import Link from "next/link";
export default () => (<div><Link href="/second"><a>Second</a></Link></div>);
Here we added a new link to page content, notice that we have added an empty <a> tag: 

<Link href="/second"><a>Second</a></Link>
<Link> is a wrapper on top of any component that can accept onClick prop, we will talk about that a bit later.

Now open http://localhost:3000, click the link and verify that page is not reloading by looking in the network tab of developer tools.

So what if we'd like to apply styles to the link? We should apply them not on <Link> but on <a> component, separation of concerns at it's finest. <Link> accepts all nav-related props whereas <a> (or any other component) is used for presentation (styles, look and feel).

<Link href="/second"><button style={{fontWeight: 'bold'}}>Second</button></Link>
This code still works as expected.

Link is also capable of one interesting thing, by default it use lazy loading of underlying nav page, but for maximum performance you may use <Link prefetch>, which will allow instant transition.

Now let's code a more complicated case for custom button-like component. In order to pass a href prop to underlying component (in case top level component will not be recognized as link/button) we need to add a passHref prop.

We also can import withRouter HOC from next/router to allow resolution of URLs in order to highlight if the desired route is already selected:

// components/Btn.js
import React from 'react';
import {withRouter} from 'next/router';

const Btn = ({href, onClick, children, router}) => (
    <span>
        <button onClick={onClick} style={{fontWeight : router.pathname === href ? 'bold' : ''}}>
            {children}
        </button>
    </span>
);

export default withRouter(Btn);
Now let's create a top nav component for all pages:

// components/Nav.js
import React from "react";
import Link from 'next/link';
import Btn from "./Btn";

export default () => (
    <div>
        <Link href="/" passHref><Btn>Index</Btn></Link>
        <Link href="/second" passHref><Btn>Second</Btn></Link>
    </div>
);
And now let's use it in pages:

// pages/index.js
import React from 'react';
import Nav from "../components/Nav";

export default () => (
    <div>
        <Nav/>
        <hr/>
        Index
    </div>
);

// pages/second.js
import React from 'react';
import Nav from "../components/Nav";

export default () => (
    <div>
        <Nav/>
        <hr/>
        Second
    </div>
);
Dynamic Routing
Of course no real app can live with only static URLs based on just pages, so let's add a bit of dynamic routing to our app.

Let's start with a small data source stub:

// data/posts.js
export default [
    {title: 'Foo'},
    {title: 'Bar'},
    {title: 'Baz'},
    {title: 'Qux'}
];
Now let's connect it to our index page:

// pages/index.js
import React from 'react';
import Link from "next/link";
import Nav from "../components/Nav";
import posts from "../data/posts";

export default () => (
    <div>

        <Nav/>

        <hr/>

        <ul>
            {posts.map((post, index) => (
                <li key={index}>
                    <Link href={{pathname: '/second', query: {id: index}}}>
                        <a>{post.title}</a>
                    </Link>
                </li>
            ))}
        </ul>

    </div>
);
Here we imported the data source and iterated over it to produce some simple nav links, as you see, for convenience we may also use href as URL object, NextJS will serialize it into a standard string.

Now, let's update the second page:

// pages/second.js
import React from 'react';
import Nav from "../components/Nav";
import posts from "../data/posts";

export default ({url: {query: {id}}}) => (
    <div>
        <Nav/>
        <hr/>
        <h1>{posts[id].title}</h1>
    </div>
);
Now if we visit http://localhost:3000 we will see a clickable list of posts, each of them leads to a dedicated dynamic page.

Unfortunately, now if we visit second page directly from our Nav component (by clicking a top menu button) we will get a nasty error. Let's make it prettier. We should import a special NextJS Error component and return it in case of any errors:

// pages/second.js
import React from 'react';
import Error from 'next/error';
import Nav from "../components/Nav";
import posts from "../data/posts";

export default ({url: {query: {id}}}) => (
    (posts[id]) ? (
        <div>
            <Nav/>
            <hr/>
            <h1>{posts[id].title}</h1>
        </div>
    ) : (
        <Error statusCode={404}/>
    )
);
We have added an import:

import Error from 'next/error';
And wrapped the component in a ternary operator:

export default ({url: {query: {id}}}) => (
    (posts[id]) ? (...) : (<Error statusCode={404}/>)
);
This will return a NextJS nice 404 Page not found error page.

Making Next JS Routing masks: SEO-friendly URLs
If you look at the location bar of the browser when you visit the second page, you'll see something like http://localhost:3000/second?id=0, which is kinda fine, but not pretty enough. We can add some niceness to the URL schema that we use. This is optional, but it's always good to have SEO-friendly URLs instead of Query-String based stuff.

In order to do that we should use a special as prop of Link component:

<Link as={`/post/${index}`} href={{pathname: '/second', query: {id: index}}}>
    <a>{post.title}</a>
</Link>
But if you visit such link and reload the page you will see 404. Why is that? It's because URL masking (a technology we just used) works on client side in runtime, and when we reload the page we need to teach server to work with such URLs.

In order to do that we will have to make a custom server. Luckily, NextJS offers useful tools to simplify it.

Let's start with installing Express:

$ npm install --save-dev express
The server code should look like this:

// /server.js
const express = require('express');
const next = require('next');

const port = 3000;
// use default NodeJS environment variable to figure out dev mode
const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();
const server = express();

server.get('/post/:id', (req, res) => {
    const actualPage = '/second';
    const queryParams = {id: req.params.id};
    app.render(req, res, actualPage, queryParams);
});

server.get('*', (req, res) => { // pass through everything to NextJS
    return handle(req, res)
});

app.prepare().then(() => {

    server.listen(port, (err) => {
        if (err) throw err
        console.log('NextJS is ready on http://localhost:' + port);
    });

}).catch(e => {

    console.error(e.stack);
    process.exit(1);

});
The main thing in this code is the following code block:

server.get('/post/:id', (req, res) => {
    const actualPage = '/second';
    const queryParams = {id: req.params.id};
    app.render(req, res, actualPage, queryParams);
});
It uses URL parser to figure out URL param and provide it to actual page as a query string param, that is understandable by NextJS server side renderer.

In order to launch this as usual we need to alter package.json's scripts section:

{
  "scripts": {
    "start": "node server.js"
  }
}
Now if we run

$ npm start
As we did before and directly open a post: http://localhost:3000/post/0 it will work as expected.

Adding styles to application, what is CSS in JS
There are many ways how NextJS app can be styled.

Simplest way is to use inline styles. Obviously this is the worst possible way, but we'll start small.

const selectedStyles = {
    fontWeight: 'bold'
};

const regularStyles = {
    fontWeight: 'normal'
};

const Btn = ({href, onClick, children, pathname}) => (
    <button style={pathname === href ? selectedStyles : regularStyles}}>
        {children}
    </button>
);
Obviously this does not scale at all. Luckily, NextJS offers a technique called JSS aka CSS in JS.

// components/button.js
import React from 'react';
import {withRouter} from 'next/router';

export default withRouter(({href, onClick, children, router}) => (
    <span>
        <button onClick={onClick} 
                className={router.pathname === href ? 'current' : ''}>       
            {children}
        </button>
        <style jsx>{`
          button {
            color: blue;
            border: 1px solid;
            cursor: pointer;
          }

          button:hover {
            color: red;
          }

          button.current {
            font-weight: bold;
          }
        `}</style>
    </span>
)); 
This will create a scoped stylesheet. If you want a global one you should use <style jsx global>.

There is another new technique for NextJS 5+, which allows to extend configuration with Webpack loader plugins. Fine-tuned configuration will be covered in next chapter so here we will briefly show the simple CSS example:

First, we need to install the plugin:

npm i @zeit/next-css --save-dev
Then we should create a file next.config.js and add following in there:

// /next.config.js
const withCss = require('@zeit/next-css');
module.exports = withCss({});
In order to properly place styles on a page we should add a custom document (will be covered in next chapter too):

// /pages/_document.js
import Document, {Head, Main, NextScript} from 'next/document';

export default class MyDocument extends Document {
    render() {
        return (
            <html>
            <Head>
                <link rel="stylesheet" href="/_next/static/style.css"/>
                <title>NextJS Condensed</title>
            </Head>
            <body>
            <Main/>
            <NextScript/>
            </body>
            </html>
        )
    }
}
Now we can import css files just like any other import in JS:

// /pages/nav.js
import React from "react";
import Btn from "./Btn";
import Link from 'next/link';
import './Nav.css'; // the styles import

export default () => (
    <nav>
        <Link href="/" passHref><Btn>Index</Btn></Link>
        <Link href="/second" passHref><Btn>Second</Btn></Link>
    </nav>
);
The stylesheet itself is a regular CSS file:

nav {
    background: #f6f6f6;
}
Now when we reload the server we will see the following on the page:


As you see, the buttons are blue on a gray background. Looks ugly but this is just for demonstration.

Adding media content: images, video, audio
Generally speaking it's better to refer to images from CSS so that the entire presentational layer is configured in one place. It's usually a red flag when you want to insert an image in JS component. We're not talking about image URLs coming from API responses, those are always inserted dynamically.

In this case you should just refer to an image as you normally do, NextJS and Webpack will take care of this and if the image is small enough will even Base64 encode it and put inline in CSS.

As a quick reference, let's add an icon to a Nav component:

// components/Nav.css
.logo-css {
    background: url(/static/js.jpg) no-repeat center center;
    background-size: cover;
}
.logo {
    background: url(/static/js.jpg) no-repeat center center;
    background-size: cover;
}
We must place the image to static folder, otherwise it will not work via regular CSS.

Now let's add a span to the Nav:

// components/Nav.js
export default () => (
    <nav>
        <span className="logo logo-css"/>
        ...
    </nav>
);
Here is how it will look like in browser:


But for those rare cases when we have to insert an image or any other media NextJS provides a very easy and convenient way as well via static folder, just add an image as you normally do in your HTML:

// components/Nav.js
export default () => (
    <nav>
        <span className="logo logo-css"/>
        <img src='/static/js.png' className="logo" alt="Logo"/>
        ...
    </nav>
);
But with NextJS 5 there is a more modern way to do so.

We have to first install the plugin:

$ npm install --save-dev next-images
Next, add the usage of plugin to next.config.js:

const withCss = require('@zeit/next-css');
const withImages = require('next-images');
module.exports = withImages(withCss({}));
And now we can import an image like we import JS files, in this case instead of real importing only the pre-built URL will be imported:

// components/Nav.js
... previous imports
import PNG from '../static/js.png';

export default () => (
    <nav>
        <span className="logo logo-css"/>
        <img src='/static/js.png' className="logo" alt="Logo"/>
        <img src={PNG} className="logo" alt="Logo"/>
        ...
    </nav>
);
We can import any other media type exactly the same way, but for videos static way is more preferred.

Adding interactive graphs and charts
There are many graph/chart libraries available on the market, but for sake of example we will take the one that is truly React based and can deliver high performance.

First step, as usual, is installation:
$ npm i react-vis --save
Next, let's create a simple graph on index page.
We need to add library styles (this assumes that you have added withCss plugin on previous step):

import "react-vis/dist/style.css";
Next let's implement a simple graph, we should import the required parts:
import {HorizontalGridLines, LineSeries, XAxis, XYPlot, YAxis} from 'react-vis';
Then we can add a graph implementation, so the resulting page will look like this:
// pages/index.js
... other imports
import {HorizontalGridLines, LineSeries, XAxis, XYPlot, YAxis} from 'react-vis';
import "react-vis/dist/style.css";

export default () => (
    <div>

        ... other stuff that we had here

        <XYPlot
            width={300}
            height={300}>
            <HorizontalGridLines/>
            <LineSeries
                data={[
                    {x: 1, y: 10},
                    {x: 2, y: 5},
                    {x: 3, y: 15}
                ]}/>
            <XAxis/>
            <YAxis/>
        </XYPlot>

    </div>
);
This results in a nice graph in the browser:


This graph is an SVG controlled by React and no other libraries like jQuery are used.

Summary
In this chapter we have learned how to create pages, add components on them, make styles and insert different kinds of media. In the next chapters we will address more advanced topics like configuration.