In this chapter we explain how to prepare the app for automatic deployment, why unit and end to end tests are an important prerequisite. You will learn how to write tests and use online CI tools with NextJS.

What is automated deployment
So far the majority of time we were only dealing with development mode of NextJS. But in real life projects we have to deploy them on production servers at some point of time. And of course no sane person wants to deploy a product that has issues that will affect customers, after all, the main purpose of a product is to make customers happier. In order to make sure the quality of the product meets certain requirements the bare minimum is manual testing. It is when you or your QA colleague simply use the product and try to find all possible issues. Unfortunately, this is very time consuming and very ineffective when the project grows big. Moreover, it is absolutely not guaranteed that any change of the system will not affect other parts of the system, so the only way to ensure quality is to test the entire system on every single change, which is completely impractical.

The problem becomes even bigger if the team grows too. The product becomes very unstable and very unpredictable even if each developer is very careful and tries to minimize the impact of each change, make it super focused. Unfortunately, sometimes we have to refactor large pieces and we definitely need some way to make sure we don't break anything.

Another factor is the turnaround speed, imagine QA has found a bug on production, the bug was reported to you, developer, you have fixed it locally, then you have to verify on your machine, then you need to put the build on staging server (if there is any), verify there, then QA verifies, then you push the build to production and verify once again. Imagine how much time and manual labor it takes. And now imagine that the fix was incorrect and on production environment it still does not work. Now you have to go through the same route again without any confidence that your next fix will actually fix the problem.

In order to gain confidence that product works well and not to waste QA resources on endless re-testing the industry has come up with a number of best practices. So far we have identified a few bottlenecks:

Manual testing takes time
Manual deployment takes time
Uncertainty about the status of system
Uncertainty that local fix works on production, e.g. dev and pro environments are different
Manual testing can be partially replaced with unit and integration (end-to-end) tests, basically we will automate what QA engineers do and do it thousand times quicker and much more reliable. Manual deployment can be automated by using deployment tools, that will auto-package and auto-upload where needed. Uncertainty of status can be mitigated by using code coverage and other kinds of reports, when tests are automated it opens a way to gather statistics. The difference in environments can be fixed by using containers, a special way to reproduce 100% same environments on different host machines.

All of above gives us the ability to automatically run unit and end to end tests on dev machine in environment that matches production, quickly fix issues locally, if there are any, then push changes to source control, where it will be picked up by continuous integration server, which will re-run all tests to make sure everything works, and then push the verified build to staging, where it can be quickly verified by manual QA and if it passes, the same build can be deployed to production, where, with reasonable doubt, it will most likely work as expected (sarcasm). This whole process is called continuous integration with automatic deployment.

Let's now review all of these methods.

Writing unit tests for NextJS apps
Unit test is a software testing method when modules and other granular parts of source code are tested independently in order to determine the correctness of implementation. The key point of unit tests is that they should be small, cheap and isolated. And there could be a ton of them to provide good coverage.

Writing unit tests for JavaScript nowadays is finally easy as never before. With modern tools the setup takes a few minutes and you can start getting benefits right away. This includes coverage out of the box.

For this example we will be using Jest and Enzyme — one of the most wide spread frameworks for testing React apps.

Let's install everything:

$ npm install react react-dom isomorphic-unfetch --save
$ npm install jest enzyme enzyme-adapter-react-16 next react-test-renderer
Now we will configure Babel (which comes with both Next and Jest) to properly use NextJS preset:

// .babelrc
{
  "env": {
    "test": {
      "presets": [
        [
          "env",
          {
            "modules": "commonjs"
          }
        ],
        "next/babel"
      ]
    },
    "development": {
      "presets": [
        "next/babel"
      ]
    }
  }
}
Here we set Env preset to use commonjs module notation and add NextJS preset to both default and test environments.

Now let's add scripts section of package.json:

// package.json
{
  "scripts": {
    "start": "next",
    "test": "NODE_ENV=test jest"
  }
}
Next step will be to configure Jest:

// jest.config.js
module.exports = {
    setupFiles: [
        "./jest.setup.js"
    ],
    testPathIgnorePatterns: [
        "./.idea",
        "./.next",
        "./node_modules"
    ]
};
Here we have configured the setup files which will be used to properly set up the test runtime and all the path patterns. It is important to exclude unnecessary directories from scans for test files and from coverage, this makes sure test runs quickly and coverage is not bloated with extra files which we don't care about.

Next step would be to configure Enzyme, it is a framework that helps to test and verify React components:

// jest.setup.js
import {configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({adapter: new Adapter()});
Now let's write tests! But... before we need some components, since we are not doing Test Driven Development at the moment.

// lib/index.js
import 'isomorphic-unfetch';

export const sum = (a, b) => (a + b);

export const getOctocat = async () => 
    (await fetch('https://api.github.com/users/octocat')).json();
OK, now is the time to write the first test:

// lib/index.test.js
import {getOctocat, sum} from "./index";

describe('sum', () => {

    it('sums two values', () => {
        expect(sum(2, 2)).toEqual(4);
    });

});

describe('getOctocat', () => {

    it('fetches octocat userinfo from GitHub', async () => {
        const userinfo = await getOctocat();
        expect(userinfo.login).toEqual('octocat');
    });

});
Note the name of the file. There are many approaches to naming the tests, I prefer to put them next to the module with a ".test" suffix in filename. Some people like to create "__tests__" directory and put test files there. To me the adjacent approach is more convenient when you scan through your repository, but that's just personal preference, Jest does not care, it will find tests anyway if files are named correctly.

The way tests work is very simple. We describe groups of tests defined in it functions (BDD style), inside those definitions we make certain assertions by using expect functions. We can return a Promise if we want to do an async test, async/await is also supported.

Now, let's create a sample page:

// pages/index.js
import React from "react";
import {getOctocat} from "../lib";

export default class Index extends React.Component {

    static async getInitialProps({err, req, res, pathname, query, asPath}) {
        const userinfo = await getOctocat();
        return {
            userinfo: userinfo
        };
    }

    render() {
        return (
            <div>Hello, {this.props.userinfo.login}!</div>
        );
    }

}
And a test for it:

// pages/index.test.js
import {shallow} from 'enzyme';
import React from 'react';
import renderer from 'react-test-renderer';
import Index from './index.js'

describe('Enzyme', () => {

    it('Renders "Hello octocat!" for given props', () => {
        const app = shallow(<Index userinfo={{login: 'octocat'}}/>);
        expect(app.find('div').text()).toEqual('Hello, octocat!');
    });

});

describe('Snapshot Testing', () => {

    it('Renders "Hello octocat!" for given props', () => {
        const component = renderer.create(<Index userinfo={{login: 'octocat'}}/>);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('Renders "Hello octocat!" for emulated NextJS lifecycle', async () => {
        const userinfo = Index.getInitialProps({});
        const component = renderer.create(<Index userinfo={userinfo}/>);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

});
Here we have introduced two different approaches to testing of React components. First approach is classical assertion-based approach just like in previous library module, we create a rendered version of component, grab its' parts and make assertions.

This approach is useful if we heavily work on the appearance of the component, rearrange things, alter the markup, etc. Selectors should be concrete enough to find proper nodes but at the same time relaxed enough to less likely break during the refactoring of component. Ideal balance is attaching data attributes to leaf nodes like so:

<div className="wrapper">
    <div className="subwrapper">
        <h1 data-test-id="title">Foo</h1>
    </div>
</div>
In this case selector like div.wrapper > div.subwrapper > h1 is way too strict and will break on every change. On the other hand h1 is too broad and if we will have more than one h1 in the component the test will also become too fragile. Data attribute is an ideal balance between reachability and fragility of selector: *[data-test-id=title].

The second approach is called snapshot testing. Instead of having to precisely take things from render and make verbose assertions we can render a snapshot and compare against it. First time this kind of test will surely pass, because there is nothing to compare with, so it's an instant success. Then we can analyze the snapshot if it's actually OK, we do it manually. The good snapshot can now be committed to the repository. Then, if anything changes in component code we will get an error that snapshot does not match the current outcome. At this time we will have some options: if the mismatch is intended and after analysis we confirm that everything is right, we can update the snapshot and commit it. Or, if we determined that something is wrong and the resulted HTML does not satisfy the requirement, we can fix this.

This approach is suitable for things that rarely change their appearance but underlying code is being refactored.

Also we have tested emulated NextJS behavior by manually calling getInitialProps and injecting the result into component.

After we run the test using 

$ npm test
If you need to update test snapshots you may call do it like so:

$ npm test -- --updateSnapshot                         # this updates all
$ npm test -- --updateSnapshot --testNamePattern foo   # this updates specific test
Writing end to end tests for NextJS apps
The emulated test that we have made in previous chapter is OK but what if we would like to make a full fledged test to verify that everything is good from end-user perspective. Such kind of tests is called integration testing or end-to-end (e2e) testing.

Unlike unit tests, where we test everything in maximum isolation, module by module, with stubs for external services and so on, this kind of test covers at once as many modules as possible to make sure all of them work together properly, including integration with third parties. Basically such test emulates the regular user behavior, the main aim is to make sure that user scenarios work well and all the involved business logic is correct.

This is a very expensive kind of tests, different companies have different policies regarding the coverage of unit vs e2e tests, normally unit test coverage should be above 90%, and e2e should be around at least 20-30%, but the quality of this coverage has to be very high, e.g. it should test the scenarios with the highest business value, like a signup or purchase of something.

The purpose of test suggests that we should use a real browser to run the test, this way we can emulate a user as closely to reality as possible, meaning that it would be real clicks and real inputs.

We will use the simple solution with a headless Chromium browser, however, when your project will grow enough you may use something much more complicated like a Selenium grid and so on. We will use Jest Puppeteer, a package that provides a glue layer between these two frameworks.

Let's install packages:

$ npm install react react-dom isomorphic-unfetch --save
$ npm install jest jest-puppeteer puppeteer next --save-dev
As usual we should put the start and test scripts in package.json:

// package.json
{
  "scripts": {
    "start": "next",
    "test": "NODE_ENV=test jest"
  }
}
Now let's configure Jest and Jest Puppeteer.

// jest.config.js
module.exports = {
    preset: 'jest-puppeteer',
    testPathIgnorePatterns: [
        './.idea',
        './.next',
        './node_modules'
    ]
};
We're using a special preset that takes care of the Puppeteer setup for Jest.

// jest-puppeteer.js
module.exports = {
    server: {
        command: 'npm start',
        port: 3000
    }
};
We have instructed the glue layer to launch our development server before we run the tests.

Now let's create a page:

// pages/index.js
import 'isomorphic-unfetch';
import React from "react";

export default class Index extends React.Component {

    static async getInitialProps({err, req, res, pathname, query, asPath}) {
        const userinfo = await (await fetch('https://api.github.com/users/octocat')).json();
        return {
            userinfo: userinfo
        };
    }

    state = {
        clicked: false
    };

    handleClick = (e) => {
        this.setState({clicked: true});
    };

    render() {
        return (
            <div>
                <div>Hello, {this.props.userinfo.login}!</div>
                <div>
                    <button onClick={this.handleClick}>Click</button>
                </div>
                {this.state.clicked && (<div>Clicked</div>)}
            </div>
        );
    }

}
We have created a simple page that loads a user from GitHub and displays it, also it shows a clickable button, when clicked, a text appears next to the button.

Finally, let's write a test:

const config = require('../jest-puppeteer.config');

const openPage = (url = '/') => page.goto(`http://localhost:${config.server.port}${url}`);

describe('Basic integration', () => {

    it('shows the page', async () => {
        await openPage();
        await expect(page).toMatch('Hello, octocat!Click');
    });

    it('clicks the button', async () => {
        await openPage();
        await expect(page).toClick('button', {text: 'Click'});
        await expect(page).toMatch('Hello, octocat!ClickClicked');
    });

});
Here we have two tests, one simply checks that the page exists and shows correct text, second one tests that button is clickable and reaction on click is right. We use additional API of expect-puppeteer to conveniently write assertions.

You can read more about this integration and API here: https://github.com/smooth-code/jest-puppeteer#writing-tests-using-puppeteer.

Setting up CI for NextJS: Travis, Gitlab, etc.
Running tests on local dev machine is fun but things happen, you may forget to run a test before commit (in the next chapters you will learn how to prevent this), or any of team members can accidentally break something. In order to make sure everything works you need some centralized source of truth. This source of truth could be a TravisCI server, which is free for open source projects. For private projects there is another free solution which we will cover too.

First, register or login to http://travis-ci.org:


You will have to enter your GitHub credentials in order to proceed, then once you have logged in go to your profile page and flick the switch next to your repository.


If there are no repositories just click "Sync" to reload them. 

You may want to set up some environment variables for the build, it is a good practice to securely store all credentials there.

The most minimalistic setup for TravisCI will be the following (in .travis.yml file):

language: node_js
node_js:
- stable
TravisCI knows that you're using NodeJS setup so it will automatically do npm install and then npm test for you. If you need to perform anything additional you may add more scripts before or after the test run, we will show an example later.

You can now either push a commit to GitHub which will trigger TravisCI build and test run, or, you can go to your GitHub repository -> Settings -> Integrations & Services -> find Travis CI and click "Edit" -> Click "Test Service" at the top of the main panel.

As a result of the build you will see the following in console (assuming you've run the example from previous chapter):


Now let's take a look at another CI solution: GitLab.

Once you've registered, created a repository and uploaded your code there create a file called .gitlab-ci.yml:

image: node:latest

cache:
  paths:
  - node_modules/

test:
  script:
  - apt-get update
  - apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
  - npm install
  - npm test
This super long list of dependencies are requirements of Puppeteer to launch Chrome in Docker.

Then after commit you may go to CI/CD -> Pipelines and click on the pipeline to see the following console output:



Keep in mind that it is better to keep your E2E test files separate from the codebase so that you won't accidentally import anything from there. Do not mix the contexts.

Setting up cloud coverage statistics
It is very useful to track coverage status changes after commits, this reveals risky changes early and gives a clear warning to go ahead and fix it before it gets out of hand. 

For this example we will take a free service called Coveralls.

$ npm install react react-dom --save
$ npm install coveralls jest next react-test-renderer --save-dev
Same as before we need to configure Babel too:

// .babelrc
{
  "env": {
    "test": {
      "presets": [
        [
          "env",
          {
            "modules": "commonjs"
          }
        ],
        "next/babel"
      ]
    },
    "development": {
      "presets": [
        "next/babel"
      ]
    }
  }
}
Let's configure Jest to collect coverage for us.

// jest.config.js
module.exports = {
    testPathIgnorePatterns: [
        './.idea',
        './.next',
        './node_modules'
    ],
    collectCoverage: true,
    coverageDirectory: './coverage',
    coveragePathIgnorePatterns: [
        "./node_modules"
        // also exclude your setup files here if you have any
    ]
};
We will get coverage report both in console and in the coverage folder.

Now let's add a script to package.json:

// package.json
{
  "scripts": {
    "test": "NODE_ENV=test jest",
    "coveralls": "cat ./coverage/lcov.info | coveralls",
  }
}
This will pipe the output from Jest coverage reporter to coveralls executable, which will upload it to the cloud.

In order to call this script we should update the .travis.yml file (or any other CI config that you have chosen):

language: node_js
node_js:
- stable
after_success:
- npm run coveralls
Or if you use GitLab update the .gitlab-ci.yml:

image: node:latest

cache:
  paths:
  - node_modules/

test:
  script:
  - apt-get update
  - apt-get install -yq that-long-list-of-packages
  - npm install
  - npm test
  - npm run coveralls
And this is it, commit, push and see how coverage is being uploaded and stored by Coveralls.

Commit hooks
The most common reason for failed tests on CI is when developer forgets to run the tests locally. Code in repository can contain bugs, that's given, but at least it should never have bugs that could be found by tests, so running tests before commit is a mandatory practice in lots of companies.

Let's follow this best practice. We will use a library Husky which can wire to Git hooks to run desired scripts.

We start with packages as always:

$ npm install react react-dom --save
$ npm install husky jest next react-test-renderer --save-dev
Next we need to set scripts in package.json:

// package.json
{
  "scripts": {
    "test": "NODE_ENV=test jest",
    "precommit": "npm test"
  }
}
And this is it, from now on before any commit Husky will run your tests. So there will be less surprises after push.