Intro
This chapter is not that much about Next JS but it covers the most important and frequently asked questions about React-based app architecture and patterns. We explain how to design and implement the core modules like authentication, caching, internationalization and then more complex solutions like role-based access control and business rules management. We explain these concepts and how to implement them in NextJS world.

Authentication
Almost any application requires at least very basic distinction between known users and guests, for example, to allow
known users to store some of the information (like their settings) in a persistent storage on API side. It is quite
obvious that users want to access their data from anywhere, so we must fulfil this need.

Since the purpose of this book is a deep dive in NextJS we will show how React authentication best practices could
be integrated with specifically NextJS.

But before we get started with the code let's analyze the nature of authentication process. It consists of several
important things:

Persistent storage of user credentials
A method to send credentials to server from client side
A check that find user and verifies the entered credentials
Mechanism that signs all user requests so that server can identify who is requesting
A mechanism that allows to sign out the user
For this example we will take the static config of users, but API-wise we are going to build a system that should not
care about the source of such data. For client-server interaction we will use Redux and fetch as before. Check will be
a simple function that verifies login and password. We will use Cookies to sign requests as it's the simplest way to
add something to all requests that go to the server.

Since we will be using custom server side endpoints for login/logout we will take the server example from earlier
chapter.

Let's start with users server side API. We will need a few packages:

$ npm install uuid lodash --save-dev
The idea of login process will be quite straightforwad: for each successful login attempt we will create a UUID
and attach it to user so if this UUID will be used to sign a request we will be able to recover user info from it.

Now let's make the API:

// users.js
const uuid = require('uuid/v4');
const find = require('lodash/find');

const users = [
    {username: 'admin', password: 'foo', group: 'admin'},
    {username: 'user', password: 'foo', group: 'user'},
];

const tokens = {};

const findUserByUsername = (username) => find(users, {username});

const findUserByToken = (token) => {
    if (!(token in tokens)) throw new Error('Token does not exist');
    return users[tokens[token]];
};
Here we have created a static "DB" of our users (with the only user "admin") and tokens. We have added two functions
that allow to find users by username and by token.

Now let's use those function to perform login procedure:

// users.js
const login = (username, password) => {

    const user = findUserByUsername(username);

    if (!user) throw new Error('Cannot find user');

    if (user.password !== password) throw new Error('Wrong password');

    const token = uuid();

    tokens[token] = users.indexOf(user);

    return {
        token,
        user
    };

};
We attempt to find a user by username and if it's successful, we compare stored password and provided one, and if
this check is also successful, then we create a new token (e.g. UUID) and establish a relationship between token
and user by creating an enty in tokens storage. After that we cut out sensitive user information and return the
result.

Let's add the logout procedure:

// users.js
const logout = (token) => {
    delete tokens[token];
};
This simple function deletes the token from storage, this makes sure that token is useless and no users will be
located based on it.

Here is the final API file:

// users.js
const uuid = require('uuid/v4');
const find = require('lodash/find');

const users = [
    {username: 'admin', password: 'foo', group: 'admin'},
    {username: 'user', password: 'foo', group: 'user'},
];

const tokens = {};

const findUserByUsername = (username) => find(users, {username});

const findUserByToken = (token) => {
    if (!(token in tokens)) throw new Error('Token does not exist');
    return users[tokens[token]];
};

const login = (username, password) => {

    const user = findUserByUsername(username);

    if (!user) throw new Error('Cannot find user');

    if (user.password !== password) throw new Error('Wrong password');

    const token = uuid();

    tokens[token] = users.indexOf(user);

    return {
        token,
        user
    };

};

const logout = (token) => {
    delete tokens[token];
};

exports.findUserByUsername = findUserByUsername;
exports.findUserByToken = findUserByToken;
exports.login = login;
exports.logout = logout;
We have to install a few packages to enable request parsing functionality of Express:

$ npm install express body-parser cookie-parser --save-dev
Now we can make the server:



// server.js
const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const port = 3000;
const cookieName = 'token';
const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();
const server = express();

server.use(cookieParser());

server.use(bodyParser.json());

server.get('*', (req, res) => {
    return handle(req, res);
});

app.prepare().then(() => {

    server.listen(port, (err) => {
        if (err) throw err;
        console.log('NextJS is ready on http://localhost:' + port);
    });

}).catch(e => {

    console.error(e.stack);
    process.exit(1);

});
Now let's add an endpoint which wiil use API method to login user and if it's successful, it will set a cookie with the newly created token.

// server.js
const cleanupUser = (user) => {
    const newUser = Object.assign({}, user);
    delete newUser.password;
    return newUser;
};

server.post('/api/login', (req, res) => {

    try {

        console.log('Attempting to login', req.body);

        const authInfo = users.login(req.body.username, req.body.password);
        authInfo.user = cleanupUser(authInfo.user);

        res.cookie(cookieName, authInfo.token, {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24), 
            httpOnly: true
        });
        res.send(authInfo);

    } catch (e) {

        console.log('Login error', e.stack);

        res.status(400).send({message: 'Wrong username and/or password'});

    }
});
Now let's add a middleware that will help to figure out if user is authenticated and pull the user from DB:

const authMiddleware = (dieOnError) => (req, res, next) => {
    req.user = null;
    req.token = null;
    try {
        req.token = req.cookies[cookieName];
        req.user = cleanupUser(users.findUserByToken(req.token));
        next();
    } catch (e) {
        if (dieOnError) {
            res.status(401).send({message: 'Not Authorized'});
        } else {
            next();
        }
    }
};
Next we add a logout endpoint:

// server.js
server.post('/api/logout', authMiddleware(false), (req, res) => {

    try {
        if (req.token) users.logout(req.token);
    } catch (e) {} // ignore errors

    res.clearCookie('token');
    res.send({});

});
Here we simply call API method to logout and clear the cookie because it's now useless.

Now the most intriguing part, how will we let client know if user is authenticated or not? If it would be a pure client
side app we would have to call an API endpoint or access cookies on client side (which is not secure, that's why we use
HTTP-only cookies that are visible only to the server. But since we are using NextJS and server side rendering, we can
pre-populate user info right when the initial page is requested from server.

To do that we will add a few things to our NextJS endpoint:

// server.js
server.get('*', authMiddleware(false), (req, res) => {
    // pass through everything to NextJS
    return handle(req, res);
});
Here we try to use token from cookies to locate the user, if it's successful - it means user is authenticated, because
otherwise the token would be wiped from storage as it was said before. Now since we have located the user we can put
this info somewhere so that it will be accessible from NextJS. The perfect place for that is Request object.

Here is the full server:

const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const users = require('./users');

const port = 3000;
const cookieName = 'token';
const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();
const server = express();

const cleanupUser = (user) => {
    const newUser = Object.assign({}, user);
    delete newUser.password;
    return newUser;
};

server.use(cookieParser());

server.use(bodyParser.json());

server.post('/api/login', (req, res) => {

    try {

        console.log('Attempting to login', req.body);

        const authInfo = users.login(req.body.username, req.body.password);
        authInfo.user = cleanupUser(authInfo.user);

        res.cookie(cookieName, authInfo.token, {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24)}); //, httpOnly: true
        res.send(authInfo);

    } catch (e) {

        console.log('Login error', e.stack);

        res.status(400).send({message: 'Wrong username and/or password'});

    }
});

const authMiddleware = (dieOnError) => (req, res, next) => {
    req.user = null;
    req.token = null;
    try {
        req.token = req.cookies[cookieName];
        req.user = cleanupUser(users.findUserByToken(req.token));
        next();
    } catch (e) {
        if (dieOnError) {
            res.status(401).send({message: 'Not Authorized'});
        } else {
            next();
        }
    }
};

server.post('/api/logout', authMiddleware(false), (req, res) => {

    try {
        if (req.token) users.logout(req.token);
    } catch (e) {} // ignore errors

    res.clearCookie('token');
    res.send({});

});

server.get('/api/me', authMiddleware(true), (req, res) => {
    res.send(req.user);
});

server.get('*', authMiddleware(false), (req, res) => {
    // pass through everything to NextJS
    return handle(req, res);
});

app.prepare().then(() => {

    server.listen(port, (err) => {
        if (err) throw err;
        console.log('NextJS is ready on http://localhost:' + port);
    });

}).catch(e => {

    console.error(e.stack);
    process.exit(1);

});
In order to access the user info we will enhance the Redux integration:

// lib/redux.js
import {applyMiddleware, createStore} from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';

export const makeStore = (initialState, {isServer, req, debug, storeKey}) => {
    if (isServer) {
        // only do it now bc on client it should be undefined by default
        initialState = initialState || {};
        // server has put things in req
        initialState.user = req.user;
        initialState.token = req.token;
        initialState.error = null;
    }
    return createStore(reducer, initialState, applyMiddleware(thunk, logger));
};


When it is a server-side execution we will take the info from request and use it to pre-populate the initialState. After
that the info will be immediately available in all `getInitialProps` methods and in `connect`-ed components.

Now let's add required client-side methods to allow users to sign in a and out. This is the reducer:

// lib/redux.js
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGIN_ERROR = 'LOGIN_ERROR';
const LOGOUT = 'LOGOUT';
const DEFAULT_STATE = {
    user: null,
    token: null,
    error: null
};

export const reducer = (state = DEFAULT_STATE, {type, payload}) => {
    switch (type) {
        case LOGIN_SUCCESS:
            return {
                ...state,
                ...DEFAULT_STATE,
                user: payload.user,
                token: payload.token
            };
        case LOGOUT:
            return {
                ...state,
                ...DEFAULT_STATE
            };
        case LOGIN_ERROR:
            return {
                ...state,
                ...DEFAULT_STATE,
                error: payload
            };
        default:
            return state
    }
};
Now let's create actions that will call server API endpoints:

// lib/redux.js
const SERVER = 'http://localhost:3000';

const apiRequest = ({url, body = undefined, method = 'GET'}) => fetch(SERVER + url, {
    method,
    body: typeof body === 'undefined' ? body : JSON.stringify(body),
    headers: {'content-type': 'application/json'},
    credentials: 'include'
});

export const login = (username, password) => async (dispatch) => {
    try {
        const res = await apiRequest({
            url: '/api/login',
            body: {username, password},
            method: 'POST'
        });
        const json = await res.json();
        if (!res.ok) {
            dispatch({type: LOGIN_ERROR, payload: json.message});
            return;
        }
        dispatch({type: LOGIN_SUCCESS, payload: json});
    } catch (e) {
        dispatch({type: LOGIN_ERROR, payload: e.message});
    }
};

export const logout = () => async (dispatch) => {
    try {
        await apiRequest({
            url: '/api/logout',
            method: 'POST'
        });
    } catch (e) {}
    dispatch({type: LOGOUT});
};



Here we use the apiRequest method to call backed with parameter credentials=include which add cookies to request.

And now the final step, bring it all together in the page that will render appropriate content based on user status:

import React from "react";
import {login, logout, me, makeStore} from "../lib/redux";
import withRedux from "next-redux-wrapper";

const Index = ({login, logout, me, user, error}) => (
    <div>
        {error && (<div>Login error: {error}</div>)}
        {(!!user ? (
            <div>
                <h1>Logged in as {user.username}</h1>
                <button onClick={() => me()}>Alert my info</button>
                <button onClick={() => logout()}>Logout</button>
            </div>
        ) : (
              <div>
                  <h1>Not logged in</h1>
                  <button onClick={() => login('admin', 'foo')}>Login</button>
              </div>
          ))}
    </div>
);

export default withRedux(
    makeStore,
    (state) => ({user: state.user, error: state.error}),
    {login, logout, me}
)(Index);


We have connected a page to Redux using the wrapper and then in render() method of functional compoent we access
user and error properties of state to understand the user status.

Now if user clicks Login button Redux will dispatch an action, which will send a request to server, which will respond
either with an error or with a user information, that will be available in store's state. If user reloads the page same
info will be injected by server based on cookie.

As a further activity we now may add more server-side API methods and protect them the same way as logout endpoint:

// server.js
server.post('/api/me', authMiddleware(true), (req, res) => {
 res.send(req.user);
});
The redux action for that will be as follows:

export const me = () => async (dispatch) => {
    // We don't dispatch anything for demo purposes only
    try {
        const res = await (await apiRequest({url: '/api/me'})).json();
        alert(JSON.stringify(res));
    } catch (e) {
        console.error(e.stack);
    }
};
Access Control List, Roles & Permissions
In large apps simple authentication with logged in and logged out checks is often not enough. Users may have different access levels, for example, admins and regular users, moderators and super admins. In addition to that users may have different permissions on individual resources, for instance, user can delete or edit own blog post, but cannot do anything with someone else's post. Such complex permission and role based systems can are usually called Role Based Access Control (RBAC).

There are many open source implementations but for our case we need a special one, it must be isomorphic because permissions check will be performed both on client and on server side.

We will start with defining the RBAC, for this purpose we will take the library called accesscontrol because it works
both on client and on server.

$ npm install accesscontrol --save
The library allows to define roles, inherit roles, define resources, actions over them and even access for properties
of those resources.

We will not go super far in definition, you can later update it up to your app reqirements, we will focus more on the
mechanics and layer between RBAC and NextJS.

First, let's define the grants:

// lib/rbac.js
const accesscontrol = require('accesscontrol');

const ac = new accesscontrol.AccessControl({
    admin: {
        page: {
            'create:any': ['*'],
            'read:any': ['*'],
            'update:any': ['*'],
            'delete:any': ['*']
        }
    },
    user: {
        page: {
            'create:own': ['*'],
            'read:any': ['*'],
            'update:own': ['*'],
            'delete:own': ['*']
        }
    }
});

const checkGrant = (user, action, resource) => user ? ac.can(user.group)[action](resource).granted : false;

exports.checkGrant = checkGrant;


We have to stick to CommonJS module notation since we will use this file as is on NodeJS server as well. Be careful
with this approach and always pay attention to not drag unnecessary things in server context.

Here we have imported the main class from accesscontrol package and configured all grants in a bulk mode. This could
also be done in a similar way if you store the config in DB or elsewhere. Again, for simplicity and focus of example
we will not go that far, simple static config should be OK.

The config allows admins to do whatever they want with all posts whereas users can only do actions with the posts
that they have created.

Also we have created a function that will check users's permissions to access a certain given resource.

Now, we need to make NextJS to become aware of those grants and the very presence of access control. We will update the
Redux Auth that we had befor for that purpose.

Let's create a component.

This HOC assumes that it is used AFTER withRedux because it is using Redux store to get the user info.

// lib/withRedux.js
import React from "react";
import {connect} from "react-redux";

export default (checkCb) => (WrappedComponent) => {

    class WithRbac extends React.Component {

        static async getInitialProps(args) {

            const {user} = args.store.getState();

            // First time check
            const granted = checkCb(user);

            if (!granted && args.res) {
                args.res.statusCode = 401;
            }

            const additionalArgs = {...args, granted};

            return WrappedComponent.getInitialProps 
                   ? await WrappedComponent.getInitialProps(additionalArgs) 
                   : {};

        }

        render() {

            const granted = checkCb(this.props.user);

            // Runtime checks
            return (
                <WrappedComponent {...this.props} granted={granted}/>
            );

        }

    }

    WithRbac.displayName = `withRbac(${WrappedComponent.displayName 
                                       || WrappedComponent.name 
                                       || 'Component'})`;

    return connect(state => ({
        user: state.user
    }))(WithRbac);

}
This HOC works in two ways: on initial page render and in runtime. When the wrapped page will be rendered for the
first time HOC will take user info from Redux store and use this info to check the grant. After that it will call
the page's getInitialProps method with additional grant info.

The runtime mode is required to properly handle status changes when user signs in and out as part of SPA activity.

In case check was unsuccessful HOC will return a correct HTTP status.

Note that HOC does not depend on RBAC module directly, it relies on whatever is passed to it as check function, this
is a good practice to untie modules and make them self-contained also it will be needed later.

Now let's create some dummy data to be used in demo page:

// lib/pages.js
export default [
    {
        user: 'admin',
        title: 'Page by Admin'
    },
    {
        user: 'user',
        title: 'Page by User'
    }
];
We have defined a few dummy posts and assigned a user for each post.

Now let's use this data and HOC in the NextJS page:

// pages/index.js
import React from "react";
import {login, logout, makeStore} from "../lib/redux.js";
import withRedux from "next-redux-wrapper";
import withRbac from "../lib/withRbac";
import {checkGrant} from "../lib/rbac";
import pages from "../lib/pages";

let Index = ({login, logout, user, error, granted}) => (
    <div>
        {error && (<div>Login error: {error}</div>)}
        {(granted ? (
            <div>
                <h1>Logged in as {user.username}</h1>
                {pages.map((page, index) => (
                    <div key={index}>
                        {page.title}
                        {
                            checkGrant(
                                user,
                                (user.username === page.user ? 'updateOwn' : 'updateAny'), 'page'
                            )
                            ? 'Can Write'
                            : 'Can Read'
                        }
                    </div>
                ))}
                <button onClick={() => logout()}>Logout</button>
            </div>
        ) : (
              <div>
                  <h1>Not logged in</h1>
                  <button onClick={() => login('admin', 'foo')}>Login Admin</button>
                  <button onClick={() => login('user', 'foo')}>Login User</button>
              </div>
          ))}
    </div>
);

Index = withRbac(user => checkGrant(user, 'readAny', 'page'))(Index);
Index = withRedux(
    makeStore,
    (state) => ({
        user: state.user,
        error: state.error
    }),
    {login, logout}
)(Index);

export default Index;


Unlike in simple auth example, we no longer rely on presence of user info to determine the page availability. Now
we can use the grant info in granted variable to display appropriate content, more over, we can use the checkGrant method to dynamically check any permissions in runtime.

Now since we have everything in place we can also add a check to server API:

// server.js
const rbac = require('./lib/rbac');

const rbacMiddleware = (action, resource) => (req, res, next) => {
    if (rbac.checkGrant(req.user, action, resource)) {
        next();
    } else {
        res.status(403).send({message: 'Not enough permissions'});
    }
};

authServer.server.post('/api/rbac', authServer.authMiddleware(true), rbacMiddleware('readAny', 'page'), (req, res) => {
    res.send({foo: 'bar'});
});



Business Rules Engine
Business Rules Engine is a technology (or pattern) for resolving user/system/permission/language-related specific conditions. It provides a convenient way to understand feature availability for the brand, account or particular user without knowing which actual conditions are involved in the check.

Why such API is needed?

In order to better understand the approach take a look on this JSX example:

<div>
    {(user.isAdmin && account.balance > 0) && (
        <button>Add users</button>
    )}
</div>
Obviously, these UI conditions are trying to figure out some specifics of current state of the account and understand
whether action is permitted or not. Imagine now that under some other system conditions (account is trial for example) there is no such case as balance, this system state has something a bit different instead of balance.

<div>
    {(user.isAdmin && (account.balance > 0 || account.isTrial)) && (
        <button>Add users</button>
    )}
</div>
As you see, conditional statement begins to grow and is bloated with logic and magic numbers.

Obvious solution is to introduce a certain level of abstraction, at least for balance part. Business rules engine approach takes this
approach even further:

<div>
    {(userBL.isAddUsersPermitted(user, account)) && (
        <button>Add users</button>
    )}
</div>
The whole complexity of condition is hidden behind an abstract method that gives an answer on certain question.

Inside of API anything may happen, new conditions may be added, removed, reassembled in different ways, but UI will not
know about it unless the interface will be changed.

We can call this API as Business Layer for simplicity and for naming purposes. I strongly suggest to have all such business-logic related things grouped together under one folder.

Key principles:

API consists of pure functions: Based on single responsibility principle the API methods should not have side effects (e.g. should not load data, store intermediate state, cache anything, they should only depend on arguments. You can create an extra layer on top of this one which will be capable of loading data and caching.
API is Business feature-oriented: Ability to add users is a feature, so there has to be a method for that called isAddUserAvailable(), naming like showAddButton() is forbidden because it brings UI context into Business context.
Usages of API methods must not be combined in UI: brand.isA() && brand.isB() is forbidden, usage may be only a direct function call, if this situation occurs, it is a sign, that BL must be updated because it is another business case/feature
API provides granular and complex methods: Internally API methods must reuse other more granular methods in order to be always clean, self-explanatory and understandable, appropriate methods must be used according to the context of usage
Initial configuration can be DI'ed into constructor: The only thing that could be injected and stored inside BL is the initial account/system configuration, and only if it is static and never changes between full page reloads, or if your system can reload it on demand.
Real time data must not be a part of initial configuration: all data should be provided, BL cannot load any data by itself
Let's code now. We will reuse the previous chapter code and enhance it.

Let's create a module for business rules:

import {checkGrant} from "./rbac";

export const canWritePost = (user, post) => 
    checkGrant(user, (user.username == post.user ? 'updateOwn' : 'updateAny'), 'page');

export const canReadPages = (user) => 
    checkGrant(user, 'readAny', 'page');
We have reused the checkGrant function from RBAC module, so now we can clean up a page code to make it more self-documenting and obvious:



import React from "react";
import {login, logout, makeStore} from "../lib/redux";
import withRedux from "next-redux-wrapper";
import withRbac from "../lib/withRbac";
import pages from "../lib/pages";
import {canReadPages, canWritePost} from "../lib/bl";

let Index = ({login, logout, user, error, granted}) => (
    <div>
        {error && (<div>Login error: {error}</div>)}
        {(granted ? (
            <div>
                <h1>Logged in as {user.username}</h1>
                {pages.map((page, index) => (
                    <div key={index}>
                        {page.title} - {canWritePost(user, page) ? 'Can Write' : 'Can Read'}
                    </div>
                ))}
                <button onClick={() => logout()}>Logout</button>
            </div>
        ) : (
              <div>
                  <h1>Not logged in</h1>
                  <button onClick={() => login('admin', 'foo')}>Login Admin</button>
                  <button onClick={() => login('user', 'foo')}>Login User</button>
              </div>
          ))}
    </div>
);

Index = withRbac(user => canReadPages(user))(Index);
Index = withRedux(
    makeStore,
    (state) => ({
        user: state.user,
        error: state.error
    }),
    {login, logout}
)(Index);

export default Index;
As you see, now page does not even know what is the logic behind the scenes, it just calls methods and provide data
needed to make decision. It does not even depend on RBAC module anymore, only on HOCs and BL, which means we can change
implementation and complexity of business rules at any time, page code will still use same functions.

For pushing things further we can load the permission data from server before calling the BL methods.

Internationalization & Localization
Any big app inevitably will have to be localized in order to broaden the audience that can use the app. Besides using localized strings in the app also need to present dates & time in local format and also we might want to use pluralization for more human readable messages. For the date and time the champion is MomentJS and for pluralization the ICU format is the most advanced one so we picked Format Message as the library for that. 

Here we will show only one of potential ways to localize the application. NextJS again brings some nuances because of its universal nature so the way we have chosen fits perfectly for both client and server counterparts, so for this example we will use I18Next library.

Let's install a few packages as usual, isomorphic-unfetch is needed since we will make fetch requests from server too:

$ npm install i18next react-i18next isomorphic-unfetch moment format-message --save
Then we create the language files using the following directory structure:

/static
  /locales
    /en
      namespace.json
    /es
      namespace.json
We are using static directory because these files will be loaded in runtime as simple JSON.

Let's put the translations in place:

// static/locales/en/common.json
{
  "HELLO": "Hello!",
  "BACK": "Back",
  "OTHER_PAGE": "Other page",
  "MESSAGES": "{count, plural, =0 {No unread messages} one {# unread message} other {# unread messages}}"
}

// static/locales/en/custom.json
{
  "GOOD_MORNING": "Good Morning!"
}

// static/locales/es/common.json
{
  "HELLO": "Hola!",
  "BACK": "Atrás",
  "OTHER_PAGE": "Otra página",
  "MESSAGES": "{count, plural, =0 {Sin mensajes no leídos} one {# mensaje no leído} other {# mensajes no leídos}}"
}

// static/locales/es/custom.json
{
  "GOOD_MORNING": "Buenos días!"
}
Now let's create a HOC for top level pages. We begin with a function that will allow to load & store the translations:

// lib/withI18n.js
const baseUrl = 'http://localhost:3000/static/locales';
const getLangUrl = (lang, ns) => `${baseUrl}/${lang}/${ns}.json`;
let translation = null;

export const getTranslation = async (lang, namespaces) => {

    translation = translation || {}; //TODO Invalidate in dev mode

    for (let ns of namespaces) {

        if (!translation[lang] || !translation[lang][ns]) {

            let response = await fetch(getLangUrl(lang, ns));

            if (!response.ok) {
                response = await fetch(getLangUrl(fallbackLng, ns));
            }

            translation[lang] = translation[lang] || {};
            translation[lang][ns] = await response.json();
        }

    }

    return translation;

};
Here we will be storing all namespaces of all locales in a module variable, this will prevent the script to load them again and again (we assume that locales don't change often, in reality there also should be a method to invalidate at least in a dev mode).

Now let's create a HOC itself:



// lib/withI18n.js
import React from "react";
import i18n from 'i18next';
import {I18nextProvider, translate} from 'react-i18next'
import moment from 'moment';
import formatMessage from 'format-message';

const getLang = (cookie) => cookie.match(/lang=([a-z]+)/)[1];

export default (namespaces = []) => (WrappedComponent) => (

    class WithI18n extends React.Component {

        static displayName = `withI18n(${WrappedComponent.displayName
                                         || WrappedComponent.name
                                         || 'Component'})`;

        static async getInitialProps(args) {

            const req = args.req;

            const lng = (req && req.headers.cookie && getLang(req.headers.cookie))
                        || (document && getLang(document.cookie))
                        || fallbackLng;

            const resources = await getTranslation(
                lng,
                [defaultNS, ...namespaces] // list other namespaces here when needed
            );

            const props = WrappedComponent.getInitialProps
                          ? await WrappedComponent.getInitialProps(args)
                          : {};

            return {
                ...props,
                resources,
                lng
            };

        }

        constructor(props, context) {

            super(props, context);

            const {lng, resources} = props;

            translation = translation || resources; // recover client side cache of translations

            this.i18n = i18n.init({
                fallbackLng,
                lng,
                resources,
                defaultNS,
                ns: [defaultNS],
                debug: false
            });

            // this allows to use translation in pages
            this.Wrapper = translate(namespaces)(WrappedComponent);

            this.moment = moment().locale(lng);

        }

        render() {

            const {Wrapper, moment, props: {resources, ...props}} = this;

            return (
                <I18nextProvider i18n={this.i18n}>
                    <Wrapper {...props} moment={moment} msg={formatMessage}/>
                </I18nextProvider>
            );

        }

    }

);
Let's take a closer look on what is happening here. We begin with NextJS getInitialProps as always, there we attempt to get current locale from cookies (by using different approaches for server & client with a fallback if we cannot determine). Once locale has been figured out we load appropriate namespaces and return props. After that in component constructor (which is called for each page) we initialize an instance of I18Next library with the resources received from getInitialProps. Then we create a translated (wrapped) version of WrappedComponent so that translation will be available on page level too. Along with it we also configure a moment instance too. Then in render we wrap the wrapper (sic!) in a I18Next provider that will allow to use translation in JSX and supply moment and formatMessage instances.

Let's create two components, one for each namespace for illustration purposes:

// components/Common.js
import React from "react";
import {translate} from 'react-i18next'

const Common = ({t}) => (
    <div>Component common: {t('HELLO')}</div>
);

export default translate()(Common);
This component is using the default namespace (common) and is very straightforward.

// components/other.js
import React from 'react'
import {translate} from 'react-i18next'

const Other = ({t}) => (
    <div>
        Component custom: {t('other:GOOD_MORNING')}
    </div>
);

export default translate(['other'])(Other);
This component is using other namespace, there is one very important remark about using custom namespaces in components, we will talk about it further.

Now let's create a page:

// pages/index.js
import React from 'react';
import Link from 'next/link';
import Common from '../components/Common';
import Other from '../components/Other';
import withI18n from '../lib/withI18n';

const setLocale = (lang) => {
    document.cookie = 'lang=' + lang + '; path=/';
    window.location.reload();
};

const getStyle = (current, lang) => ({fontWeight: current === lang ? 'bold' : 'normal'});

const Index = ({t, lng, moment, msg}) => (
    <div>
        <div>Page-level common: {t('common:HELLO')}</div>
        <Common/>
        <Other/>
        <div>{moment.format('LLLL')}</div>
        <div>{msg(t('common:MESSAGES'), {count: 0})}</div>
        <div>{msg(t('common:MESSAGES'), {count: 1})}</div>
        <div>{msg(t('common:MESSAGES'), {count: 2})}</div>
        <Link href='/other'>
            <button>{t('common:OTHER_PAGE')}</button>
        </Link>
        <hr/>
        <button onClick={() => setLocale('en')} style={getStyle(lng, 'en')}>EN</button>
        <button onClick={() => setLocale('es')} style={getStyle(lng, 'es')}>ES</button>
        <button onClick={() => setLocale('de')} style={getStyle(lng, 'de')}>DE</button>
    </div>
);

export default withI18n()(Index);
In this page we use the HOC that we just created with default namespace (nothing is set). Per HOC interface we receive t, lng, moment and msg as props. In order to change the locale we set the cookie and reload the page.

Also let's create a page for other namespace:

// pages/other.js
import React from 'react';
import Link from 'next/link';
import Common from '../components/Common';
import Other from '../components/Other';
import withI18n from '../lib/withI18n';

const OtherPage = ({t}) => (
    <div>
        <div>Page-level custom: {t('other:GOOD_MORNING')}</div>
        <Common/>
        <Other/>
        <Link href='/'>
            <button>{t('common:BACK')}</button>
        </Link>
    </div>

);

export default withI18n(['other'])(OtherPage);
Notice that we supply other namespace to the HOC. Other than that it works exactly the same.

Now about the important remark. If you open the Index page directly you will notice that Other component was not translated, it happened because Index page does not explicitly request the other namespace. But if you visit Other page everything will work as expected, translations will be loaded and all components will be shown the way they should. But there's more. If you first open Other page and then click "Back" button to return to "Index" page, you will see that Other component is now translated. It happens because other namespace was cached after Other page visit. It means that you should explicitly request all necessary namespaces for both the page and all underlying components, which can be tricky sometimes. Our recommendation is to use some intermediate HOC for components to preload translations and then pass through, but keep in mind that server will wait only for fetches inside getInitialProps of pages, so consider this as a limitation of server side rendering.

Error handling
Any application is prone to runtime errors. It could be various kinds of errors: caused by bugs, unexpected input, validation errors, poor network connectivity or server errors. Lots of them. Well-designed app must not silently stop working or display an ugly error message with tons of irrelevant technical information. Instead, it must always display
some meaningful error information, short and simple, and provide tips how to solve the problem.

There are various approaches to error handling in React apps, let’s review them. As an example we will look at failed network request.

First, and simplest, is to store error in the state of component. Whenever we make a server request we can surround it in a try-catch block and store the error in state or in initial props:

// pages/index.js
import React from "react";

const faultyPromise = (client) => new Promise((resolve, reject) => {
    setTimeout(() => {
        reject(new Error('Faulty ' + (client ? 'client' : 'server')));
    }, 500);
});

export default class Page extends React.Component {

    state = {
        loading: false,
        error: null,
        result: null
    };

    static async loadPosts(client) {
        return await faultyPromise(client);
    }

    static async getInitialProps() {
        try {
            return {result: await Page.loadPosts(false)};
        } catch (e) {
            return {error: e.message};
        }
    }

    retry = async () => {
        this.setState({result: null, error: null, loading: true});
        try {
            this.setState({loading: false, result: await Page.loadPosts(true)});
        } catch (e) {
            this.setState({loading: false, error: e.message});
        }
    };

    getError() {
        return (this.state.error || this.props.error);
    }

    getResult() {
        return (this.state.result || this.props.result);
    }

    isLoading() {
        return this.state.loading;
    }

    render() {
        if (this.state.loading) return (<div>Loading...</div>);

        const error = this.getError();
        if (error) return (
            <div>
                Cannot load posts: "{error}"
                <br/>
                <button onClick={this.retry}>Retry</button>
            </div>
        );

        return (
            <pre>{JSON.stringify(this.getResult())}</pre>
        );
    }
}
Here we reuse the static method loadPosts both in initial load and for retries. The captured errors are stored and
displayed to users.

But what if we forgot to capture the error somewhere or, more likely, the error happened somewhere down the component
tree and we have no explicit way to try-catch it?

Luckily, React apps have native ability to set error boundaries:

// pages/boundary.js
import React from "react";

class FaultyComponent extends React.Component {
    componentWillMount() {
        // only synchronous errors will be captured
        throw new Error('FaultyComponent threw an error');
    }

    render() {
        return null;
    }
}

export default class Page extends React.Component {

    state = {error: null, mount: false};

    componentDidCatch(e, info) {
        console.error(e, info);
        this.setState({error: e.message});
    }

    mount() {
        this.setState({mount: true});
    }

    render() {

        const {error, mount} = this.state;

        if (error) return (
            <div>Boundary captured an error: {error}</div>
        );

        return (
            <div>
                <button onClick={() => this.mount()}>Mount a component that will error</button>
                {mount ? <FaultyComponent/> : null}
            </div>
        );
    }
}
Here if user clicks to mount the component the error caused by componentWillMount will be captured by page component and rendered. Keep in mind that errors cannot be captured on server, you will see the NextJS error page. On the client only synchronous errors will be captured, async ones will result in an unhandled rejection.

But what if we forgot the error boundary or if something extremely horrible has happened, or user has hit 404?

Let's emulate something like this:

// pages/unhandledError.js
import React from "react";

export default class UnhandledErrorPage extends React.Component {

    static async getInitialProps() {
        throw new Error('Unhandled error');
    }

    render() {
        return (
            <div>Whatever</div>
        );
    }
}
In this case user will see the NextJS error page:



For 404s in NextJS we can set up a special page:

// pages/_error.js
import React from 'react';
import Error from 'next/error';

export default class ErrorPage extends React.Component {

    componentWillMount() {
        // here we can log an error for further analysis
        console.log('NextJS Error Page', this.props.url.pathname);
    }

    render() {
        return (
            <Error statusCode={this.props.statusCode}/>
        );
    }
}
If user visits http://localhost:3000/thispageismissing the one will see



And in console there will be a message:

Client pings, but there's no entry for page: /thispageismissing
Unhandled error /thispageismissing
Caching
Caching could significantly improve the performance of server because it will not try to request data from slow remote servers but instead will access fast local cache that can respond immediately.

We suggest to use Redux at client side because this will allow to use it's Store as a runtime cache while the app is running. This approach also allows to pre-populate some keys on server when pages are loaded.

We recommend to use client-side persistent storages for Redux extremely carefully, because improper usage may lead to state inconsistency between server and client: server has sent some initial state, client then applies extra initial state from localStorage (for example) and renders more than server did, so you will get an error.

Client either has to be smart enough to show partial state from server and then apply the delta coming from persistor without blocking the entire UI (like PersistGate approach from redux-persist) because this ruins the overall idea of server side rendering and pre-population of state.

After all it is up to you to decide which way to go so we will show both examples when client waits for state to be rehydrated and when it does not.

Let's install all packages as always:

$ npm install next --save-dev
$ npm install react react-dom redux redux-logger react-redux next-redux-wrapper redux-persist prop-types --save
Now let's create the Redux setup:

// lib/redux.js
import logger from 'redux-logger';
import {applyMiddleware, createStore} from 'redux';

const SET_CLIENT_STATE = 'SET_CLIENT_STATE';

export const reducer = (state, {type, payload}) => {
    if (type == SET_CLIENT_STATE) {
        return {
            ...state,
            fromClient: payload
        };
    }
    return state;
};

const makeConfiguredStore = (reducer, initialState) =>
    createStore(reducer, initialState, applyMiddleware(logger));

export const makeStore = (initialState, {isServer, req, debug, storeKey}) => {

    if (isServer) {

        // only do it now bc on client it should be undefined by default
        // server will put things in req
        initialState = initialState || {fromServer: 'foo'}; //req.initialState;

        return makeConfiguredStore(reducer, initialState);

    } else {

        const {persistStore, persistReducer} = require('redux-persist');
        const storage = require('redux-persist/lib/storage').default;

        const persistConfig = {
            key: 'nextjs',
            whitelist: ['fromClient'], // make sure it does not clash with server keys
            storage
        };

        const persistedReducer = persistReducer(persistConfig, reducer);
        const store = makeConfiguredStore(persistedReducer, initialState);

        store.__persistor = persistStore(store); // Nasty hack

        return store;
    }
};

export const setClientState = (clientState) => ({
    type: SET_CLIENT_STATE,
    payload: clientState
});
Here we exploit a possibility to inject a persistor right in the store object, so that we can later use it for PersistGate.

And now we create the HOC to block the UI:

// lib/withPersistGate.js
import React from 'react';
import PropTypes from 'prop-types';
import {PersistGate} from 'redux-persist/integration/react';

export default (gateProps = {}) => (WrappedComponent) => (

    class WithPersistGate extends React.Component {

        static displayName = `withPersistGate(${WrappedComponent.displayName
                                                || WrappedComponent.name
                                                || 'Component'})`;
        static contextTypes = {
            store: PropTypes.object.isRequired
        };

        constructor(props, context) {
            super(props, context);
            this.store = context.store;
        }

        render() {
            return (
                <PersistGate {...gateProps} persistor={this.store.__persistor}>
                    <WrappedComponent {...this.props} />
                </PersistGate>
            );
        }

    }

);
Now we can use it on the page:

// pages/index.js
import React from "react";
import Link from "next/link";
import withRedux from "next-redux-wrapper";
import {makeStore, setClientState} from "../lib/redux";
import withPersistGate from "../lib/withPersistGate";

const Index = ({fromServer, fromClient, setClientState}) => (
    <div>
        <div>fromServer: {fromServer}</div>
        <div>fromClient: {fromClient}</div>
        <div>
            <button onClick={e => setClientState('bar')}>Set Client State</button>
        </div>
    </div>
);

export default withRedux(
    makeStore,
    (state) => state,
    {setClientState}
)(withPersistGate({
    loading: (<div>Loading</div>)
})(Index));
If you remove the withPersistGate the page will load part by part. Like it was said before, it's better to progressively render when the data comes instead of blocking.

Analytics
No big project can live without gathering of analytical information about their users, their habits and sources, etc. A world leader in this field is Google Analytics, so let's create a simple integration between NextJS and this cool product.

First, you need to create a project in Google Analytics and copy the ID:



We start with packages:

$ npm install next --save-dev
$ npm install react react-dom react-ga --save
Next let's create a HOC for pages which require analytics:

import React from "react";
import Router from 'next/router';
import ReactGA from 'react-ga';

const GA_TRACKING_ID = '...'; // paste your ID here
const WINDOWPROP = '__NEXT_GA_INITIALIZED__';
const debug = process.env.NODE_ENV !== 'production';

export default (WrappedComponent) => (class WithGA extends React.Component {

    lastPath = null;

    componentDidMount() {
        this.initGa();
        this.trackPageview();
        Router.router.events.on('routeChangeComplete', this.trackPageview);
    }

    componentWillUnmount() {
        Router.router.events.off('routeChangeComplete', this.trackPageview);
    }

    trackPageview = (path = document.location.pathname) => {
        if (path === this.lastPath) return;
        ReactGA.pageview(path);
        this.lastPath = path;
    };

    initGa = () => {
        if (WINDOWPROP in window) return;
        ReactGA.initialize(GA_TRACKING_ID, {debug});
        window[WINDOWPROP] = true;
    };

    render() {
        return (
            <WrappedComponent {...this.props} />
        );
    }

});
Here we use some undocumented abilities of NextJS Router to capture location change events. It is not guaranteed that this API will be available in future, it just demonstrates the possibilities. Credits to https://github.com/osartun.

Now let's wrap the page with the HOC:

import React from "react";
import withGA from "../lib/withGA";

const Index = () => (
    <div>Analyze this!</div>
);

export default withGA()(Index);
And this is it, all page views will be carefully logged.

Summary
In this chapter we have learned some advanced patterns. TBD. I hate these summaries, they all look like a copy-paste of intros!