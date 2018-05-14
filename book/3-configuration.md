We have already touched this topic slightly in previous chapter, but this time let's dive a bit deeper into this.

Although NextJS provides lots and lots of perks out of the box, sometimes it is required to add some extra stuff, just like before, for CSS and Images support.

Next JS, especially the latest version, offers a good amount of tools to customize the build and add lots of uncommon things.

In this chapter we will learn:

How to make custom configuation
How to customize Webpack, for example, how to add TypeScript support
How to configure Babel
How to make custom configuration
In a nutshell all NextJS configuration is done via next.config.js. With NextJS 5 it became even easier.

Let's create an empty project for experiments

$ npm init
$ npm install react react-dom
Let's add SASS support for example:

$ npm install next node-sass @zeit/next-sass --save-dev
Enhance scripts section of package.json:

// package.json
{
    "scripts": {
        "start": "next"
    }
}
Next, we again have to create a custom document (same as before):

// pages/_document.js
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
Now let's create a stylesheet using SASS:

// pages/index.sass
body
  font-family: Arial, sans-serif
  font-size: 12px
And an index page:

// pages/index.js
import React from 'react';
import "./index.sass";

export default () => (
    <div>
        Styled text
    </div>
);
Now let's run dev server:

$ npm start
If you open http://localhost:3000 in the browser you will see a styled text as expected:


Other useful thing is configuration of build/dev phases via custom config.

To do that you can use the following template:

// next.config.js
const withSass = require('@zeit/next-sass');

const {PHASE_DEVELOPMENT_SERVER} = require('next/constants');

module.exports = (phase, {defaultConfig}) => {

    if(phase === PHASE_DEVELOPMENT_SERVER) {
        return withSass(defaultConfig);
    }

    return withSass(Object.assign({}, defaultConfig, {
        distDir: 'build-custom'
    }));

};
Config also allows to expose variables to your pages in runtime:

// next.config.js
module.exports = {
  serverRuntimeConfig: {
    serverOnly: 'secret'
  },
  publicRuntimeConfig: {
    serverAndClient: 'public'
  }
};
You may use them as follows:

// pages/index.js
import React from 'react';
import getConfig from 'next/config'
import "./index.sass";

const {serverRuntimeConfig, publicRuntimeConfig} = getConfig();

console.log({serverRuntimeConfig, publicRuntimeConfig});

export default () => (
    <div>
        Styled text
        <pre>{JSON.stringify(serverRuntimeConfig, null, 2)}</pre>
        <pre>{JSON.stringify(publicRuntimeConfig, null, 2)}</pre>
    </div>
);
Now restart dev server and open browser and console and load http://localhost:3000, you will see the following:




Configuring Webpack
Webpack is the bundler used to produce NextJS dev server and builds. It can be configured to bundle more things than by default. As an example, let's add TypeScript.

Create tsconfig.json:

{
  "compileOnSave": false,
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "jsx": "preserve",
    "allowJs": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "typeRoots": [
      "./node_modules/@types"
    ],
    "lib": [
      "dom",
      "es2015",
      "es2016"
    ]
  }
}
We need to install needed packages (loader, compiler and typings):

$ npm install ts-loader@3 typescript @types/react @types/next --save-dev
Attention, as of Next 5.0.1 TS Loader should be from 3.x branch, because Next works on Webpack 3.

Next, modify the config:

module.exports = {
  webpack(config, {dir, defaultLoaders}) {
    config.module.rules.push({
      test: /\.+(ts|tsx)$/,
      use: [
        defaultLoaders.babel,
        {
          loader: 'ts-loader',
          options: {transpileOnly: true}
        }
      ],
      include: [dir],
      exclude: /node_modules/
    });
    config.resolve.extensions.push('.ts', '.tsx');
    return config;
  }
};
Rename your pages/index.js to pages/index.tsx, leave the contents as is, JS is a valid TS as well.

You can also save some time and install a plugin:

$ npm install @zeit/next-typescript @types/react @types/next --save-dev
Then your next.config.js will look lot simpler:

const withTypescript = require('@zeit/next-typescript');
module.exports = withTypescript({});
Configuring Babel
This is actually really simple. NextJS comes with pre-baked preset for Babel, so you can simply create .babelrc and put the following:

{
  "presets": ["next/babel"],
  "plugins": []
}
This may be useful for example for tests, keep this config if you'd like to use Jest, for example:

{
  "presets": [
    "next/babel",
    "env"
  ],
  "env": {
    "test": {
      "presets": [
        "next/babel",
        ["env", {"modules": "commonjs"}]
      ]
    }
  }
}
Here we are using Babel's ability to have different set of plugins and presets based on environment.

You will also need to install babel-preset-env:

$ npm install babel-preset-env --save-dev
We will talk more about tests in next chapters.

Conclusion
In this chapter we have learned more advanced configuration of NextJS. Using this knowledge we now can add more sophisticated build scenarios and extend default functionality like additional Webpack loaders and features as well as custom Babel plugins and presets.