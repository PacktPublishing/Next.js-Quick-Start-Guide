NextJS data flow
Intro
This is extremely important chapter which explains the purpose of all JS applications: talking to backend. We explain different approaches including vanilla Next JS flow, with no frameworks, which is useful to understand the essence of interaction. Then we dive deeper through more and more advanced solutions.

This chapter covers the following:

What's the difference between loading data on client and on server
Loading data using Vanilla JS
Redux
GraphQL and Relay
Apollo GraphQL
Nuances of fetching data on client and on server
Server and client has different libraries that allow you to load data, in the browser there are XMLHttpRequest and WhatWG Fetch API, on server side there are NodeJS's default http and https packages. In order to load data universally (e.g. in isomorphic manor, both on server and on the client using the same codebase) we need to install an additional network layer.

There are two options here.

First option is to simply polyfill the WhatWG Fetch API, since it's natively available on the client side in browsers. In order to do that we should install a package:

$ npm install isomorphic-fetch --save
And then require/import it anywhere before fetch() usages:

import 'isomorphic-fetch';

(async () => {
    const res = await fetch(...); // already polyfilled
})();
Another way is to use some universal library that will take care of network layer, for example, the most popular one, Axios:

$ npm install axios --save
Then we can use it right away after import:

import axios from 'axios';

(async () => {
    const res = await axios.get(...);
})();
This approach gives more control using Axios configuration.

Loading data from remote server using vanilla Next JS
Let's begin with a quick explanation, how the data is usually loaded in traditional React apps.

If you don't use any data management frameworks, then your best bet is to request data when component will mount like so:

class Foo extends React.Component {

  state = {data: null};

  loadData = async () => await (await fetch('...')).json();

  async componentWillMount(){
    const data = await this.loadData();
    this.setState({data});
  }

  render(){
    if (!this.state.data) return (<div>Loading...</div>);
    return (<pre>{JSON.stringify(this.state.data)}</pre>);
  }

}
This will initiate data loading process when component is about to be mounted, before data is available it will show a loading indicator.

Unfortunately, this will not work in server environment during server-side rendering because server will not know that it should wait for data to arrive, so it will always send "Loading" state to client, and obviously this ruins the whole idea of SSR.

NextJS, of course, comes with a VERY handy method for that, a static method getInitialProps():

class Foo extends React.Component {

  static loadData = async () => await (await fetch('...')).json();

  async static getInitialProps(){
    const data = await this.loadData();
    return {data};
  }


  render(){
    if (!this.props.data) return (<div>Loading...</div>);
    return (<pre>{JSON.stringify(this.props.data)}</pre>);
  }

}
But this is too simplistic. Most likely we will have to fetch based on certain conditions, like a given ID or something else.

This has been also taken care of by NextJS.

Assume that we have something like this in the server code:

server.get('/post/:id', (req, res) => {
    const actualPage = '/second';
    const queryParams = {id: req.params.id};
    app.render(req, res, actualPage, queryParams);
});
Let's modify the data-related code to handle those IDs.

class Foo extends React.Component {

  static loadData = async (id) => await (await fetch('...')).json();

  async static getInitialProps(context){
    const {id} = context.query;
    const data = await this.loadData(id);
    return {data};
  }


  render(){
    if (!this.props.data) return (<div>Loading...</div>);
    return (<pre>{JSON.stringify(this.props.data)}</pre>);
  }

}
Using Redux with NextJS
The vast majority of traditional UI apps use MVC pattern to organize the state management. But in real-time client side apps this also quickly becomes a pain because models need to be synchronized, state is scattered and there is no single source of truth. Different models can influence other models and situation quickly gets out of hands. Another issue is bidirectional data flow between view and model (through controller), e.g. view calls some controller method, which in turn calls a model method, which causes other models to update then updated state is passed back to view.

In order to overcome this the FLUX ideology was created. Within this ideology the direction of data/event propagation is constant, view does not talk with the model back and forth. Instead, view issues actions and dispatchers pick up those actions to update necessary stores, which returns the data back to views. This decouples views from the rest of data handling infrastructure.



Let us illustrate the a FLUX-inspired architecture based only on React:

class TopLevelStateContainer extends React.Component {
    state = {currentUser: null}; // let's pretend that this data is a curren
    loadUser = () => (...);
    render(){
        return (<IntermediateComponent {...this.state} loadUser={this.loadUser} />);
    }
}

// this could be a top menu bar
const IntermediateComponent = (props) => (
    <div>
         ...some additional markup and functionality
         <LoggedUserAvatar {...props}/>
    </div>
);

// this is the component that actually needs the data and a mutator/loader function
class LoggedUserAvatar extends React.Component {
    componentWillMount(){
        this.props.loadUser();
    }
    render(){
        return (
            <div>{this.props.currentUser}</div>
        );
    }
}
The necessity to pass the state and state mutators everywhere in the app including the components that should not even be aware of such things. As you see in this example, IntermediateComponent has to pass the data and loader to LoggedUserAvatar but it does not use it, so it is an unnecessary knowledge, which will further lead to more and more edits in case we need to update leaf component or top level component.

Also the state of the app cannot be snapshotted and persisted between app launches (e.g. when the page is reloaded). If there will be a ton of such leaf component that reuse same sections of top level state it will also bring a nightmare of synchronization of the access, interaction with such state and so on.

There are plenty of different state management tools available for React, but one of the most popular is Redux. Redux is a predictable state container for JavaScript apps, not limited to only React ones, but which perfectly plays along with FLUX's unidirectional data flow and React's functional nature.

Redux consists of store which has the main app state, a set of connected components that listen to changes in that state, a number of actions (objects that describe a change) and reducers (a functions that mutate the state according to an action).

Let's take a deeper look into all of this.

As usual, we start with installation:

npm install redux react-redux --save
As we just learned, when NextJS renders pages, it takes files located in ./pages directory, grabs default export and uses getInitialProps static method of exported component to inject some props to it. The method can also be asynchronous. Same method is called both on server side and on client side, so the behavior is mostly consistent, the difference is in the amount of arguments that it receives, for example, server has req (which is the NodeJS Request), client doesn’t have it. Both will receive normalized pathname and query.

Here is a minimalistic page component:

export default class Page extends Component {
  getInitialProps({pathname, query}) {        
    return {custom: 'custom'}; // pass some custom props to component
  }
  render() {
    return (
      <div>
        <div>Prop from getInitialProps {this.props.custom}</div>
      </div>
    )
  }
}

// OR in functional style

const Page = ({custom}) => (
  <div>
    <div>Prop from getInitialProps {this.props.custom}</div>
  </div>
);

Page.getInitialProps = ({pathname, query}) => ({        
  custom: 'custom' // pass some custom props to component
});

export default Page;
What we want to do on a server while rendering the React app which also has Redux inside? We’d like to dispatch some actions before we ship the resulting HTML to the client. For this case getInitialProps is the best bet. We can prepare our Redux Store’s state there so that when component will be rendered, the state will have all the right things, so the resulting HTML will have them too.

getInitialProps({store, pathname, query}) {
  // component will read it from store's state when rendered
  store.dispatch({type: 'FOO', payload: 'foo'});
  // pass some custom props to component
  return {custom: 'custom'}; 
}
But in order to do that we need to first prepare the Redux store, both on client and on server, while keeping in mind that on client the store must be a singleton, but on server store has to be created for each request. When store is created we’d like to inject it into getInitialProps along with the rest of Next.js things.

The same store must later be passed to React Redux Provider, so that all it’s children will have access to it.

For this purpose the Higher Order Components work the best. In a few words, it’s a function accepts a Component and returns a wrapped version of it, which is also a Component. Sometime a HOC can accept some arguments and return another function, which in turn will take Component as argument. This wrapper can be applied to all our pages.

Basically, this was the short explanation how next-redux-wrapper package works.

First, in has to be installed:

npm install next-redux-wrapper --save
Next, we need to set things up:

import React, {Component} from "react";
import {createStore} from "redux";

// create a simple reducer
const reducer = (state = {foo: ''}, action) => {
    switch (action.type) {
        case 'FOO':
            return {...state, foo: action.payload};
        default:
            return state
    }
};

// create a store creator
const makeStore = (initialState) => {
    return createStore(reducer, initialState);
};

export default makeStore;
Now we are ready to wrap everything with next-redux-wrapper:

import withRedux from "next-redux-wrapper";

const Page = ({foo, custom}) => (
  <div>
    <div>Prop from Redux {foo}</div>
    <div>Prop from getInitialProps {custom}</div>
  </div>
);

Page.getInitialProps = ({store, isServer, pathname, query}) => {
  // component will read from store's state when rendered
  store.dispatch({type: 'FOO', payload: 'foo'});
  // pass some custom props to component from here
  return {custom: 'custom'}; 
};

Page = withRedux(makeStore, (state) => ({foo: state.foo}))(Page);

export default Page;
Simple, yet, powerful.

You can see the full example in Next.js repo: https://github.com/zeit/next.js/blob/master/examples/with-redux/README.md or check out the main repo’s example: https://github.com/kirill-konshin/next-redux-wrapper/blob/master/pages/index.js.

Using GraphQL with NextJS to fetch data
In this chapter we will learn how to use basic GraphQL with Relay framework. But first, let's briefly talk about why GraphQL was introduced and what issues it solve.

When dealing with REST API it is quite common to make some subsequent requests, for example, get some entities and then for those entities get some more sub-entities. By definition REST endpoints should only provide one certain type of entities, any other things should be fetched from other endpoints either by following HATEOAS links or by manually created sub-requests. This increases the amount of network traffic, it forces all clients to reimplement the logic how and which sub-entities should be fetched and overall badly affects user interface. Of course we can break the rules and put nested entities right there inside the API endpoint, but what if we would have more than one level of nesting? Plus, what if we don't need some of the fields at all, why should server perform expensive data fetching and processing if client only needs a fraction of this data?

In order to overcome these REST drawbacks a new approach called GraphQL was created. It allows to statically describe all relationships between different entities and then describe a query, that could be used to download everything that client needs as one piece, no matter how deep is the nesting. It also allows to describe what particular fields the client requires.

The philosophy of GraphQL and React brings us to idea that components can express their data needs by using GraphQL queries that will be picked up by some framework and resulting data will be injected into components when it is available.

In this chapter we will try to stay as close as possible to the reference implementation by Facebook, in the next chapter we will also take a look at what other tools are available on the market.

First of all, we will have to install a few packages:

$ npm install --save-dev babel-plugin-relay graphql-cli relay-compiler
Then let's configure the GraphQL environment by putting the .graphqlconfig file in the project root:

{
  "schemaPath": "data/schema.graphql",
  "extensions": {
    "endpoints": {
      "dev": "https://swapi.graph.cool"
    }
  }
}
Now we can download the schema locally. This is needed in order to enable the ahead-of-time optimizations that can be done by Relay framework. In order to download the schema we will create a NPM script in package.json:

{
  "scripts": {
    "schema": "graphql get-schema"
  }
}
Now if we run

$ npm run schema
We will see that the schema has been downloaded into data/schema.grapql as stated in config.

Our codebase will query the GraphQL API endpoint using specially defined queries, in order to parse those queries ahead of time we will create another script:

{
  "scripts": {
    "relay": "relay-compiler --src ./pages/ --schema data/schema.graphql"
  },
}
So far there is nothing to parse yet, so let's create our first page. But before that we need to set up Relay's runtime environment:

// components/environment.js
import 'isomorphic-fetch';
import {Environment, Network, RecordSource, Store} from 'relay-runtime';
import config from 'json-loader!../.graphqlconfig';

const fetchQuery = async (operation, variables) => {

    const res = await fetch(config.extensions.endpoints.dev, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: operation.text,
            variables,
        }),
    });

    return await res.json();

};

let environment;

export const getEnviroment = (records) => {
    if (!environment || !process.browser) {
        environment = new Environment({
            network: Network.create(fetchQuery),
            store: new Store(new RecordSource(records)),
        });
    }
    return environment;
};

export default getEnviroment;
Here we via JSON loader used the same GraphQL config as in the download script. We have configured Fetch to load data from the same API endpoint where the schema is deployed.

Now we can import this environment and create our first GraphQL query:

import React from 'react';
import {graphql, QueryRenderer} from 'react-relay';
import getEnvironment from "../components/environment";

const query = graphql`
    query pagesFilmsQuery {
        allFilms {
            id,
            director,
            title,
            characters {
                name
            }
        }
    }
`;

const Films = ({error, allFilms = null}) => {

    if (error) return (
        <div>Error! {error.message}</div>
    );

    if (!allFilms) return (
        <div>Loading...</div>
    );

    return (
        <div>
            {allFilms.map(film => (
                <div key={film.id}>
                    <h1>{film.title}</h1>
                    <p>Director: {film.director}</p>
                    <p>Characters: {film.characters.map(c => c.name).join(', ')}</p>
                </div>
            ))}
        </div>
    );

};

const Index = ({props, records}) => (
    <div>
        <QueryRenderer
            environment={getEnvironment()}
            query={query}
            variables={{}}
            render={({error, props}) => (
                <Films error={error} allFilms={props && props.allFilms}/>
            )}
        />
    </div>
);

export default Index;
Here we have created a query that will fetch allFilms with certain nested fields like title, director and names of characters:

const query = graphql`
    query pagesFilmsQuery {
        allFilms {
            id,
            director,
            title,
            characters {
                name
            }
        }
    }
`;
Next let's configure Babel to understand queries by putting the following in a .babelrc:

{
  "passPerPreset": true,
  "presets": [
    "next/babel"
  ],
  "plugins": [
    "relay"
  ]
}
As you see, from client perspective it's just one request, server will take care of all the nested data relationships.

Now, if we run

$ npm run relay
We will compile this query into something runnable by Relay framework in runtime. After that we finally can launch NextJS and see the list loaded using GraphQL.

But if we change the query it will not be picked up by client so let's change the things a bit.

First, let's install a tool that allows to run two NPM scripts in parallel:

$ npm install npm-run-all --save-dev
And then let's create a slightly different set of scripts:

{
  "scripts": {
    "start:next": "next",
    "start:replay": "npm run relay -- --watch",
    "start": "npm run schema && npm-run-all -p start:*",
    "schema": "graphql get-schema",
    "relay": "relay-compiler --src ./pages/ --schema data/schema.graphql"
  }
}
Now if we run

$ npm start
It will first download a fresh schema (if there's any), then run schema compiler and NextJS in parallel which guarantees that all changes will be included in the resulting build.

Unfortunately, the QueryRenderer is not quite aware of NextJS and so it is rendered only on a client. If we'd like to use GraphQL on server too we need to alter the way our query is executed:

import React from 'react';
import {fetchQuery, graphql, QueryRenderer} from 'react-relay';
import getEnvironment from "../components/environment";

const query = graphql`
    query pagesFilmsQuery {
        allFilms {
            id,
            director,
            title,
            characters {
                name
            }
        }
    }
`;

const Films = ({error, allFilms = null}) => {

    if (error) return (
        <div>Error! {error.message}</div>
    );

    if (!allFilms) return (
        <div>Loading...</div>
    );

    return (
        <div>
            {allFilms.map(film => (
                <div key={film.id}>
                    <h1>{film.title}</h1>
                    <p>Director: {film.director}</p>
                    <p>Characters: {film.characters.map(c => c.name).join(', ')}</p>
                </div>
            ))}
        </div>
    );

};

class Index extends React.Component {

    constructor(props, context){
        super(props, context);
        this.environment = getEnvironment(props.records);
    }

    render() {
        const {props, records} = this.props;
        return (
            <div>
                <Films allFilms={props.allFilms}/>
            </div>
        );
    }

}

Index.getInitialProps = async () => {
    const environment = getEnvironment();
    const props = await fetchQuery(environment, query, {});
    const records = environment.getStore().getSource().toJSON();
    return {
        props, records
    };
};

export default Index;
Here we have used the Relay's function fetchQuery inside the getInitialProps static method, this will first load all the data and then render the page completely even on the server.

The code for getEnvironment and getInitialProps/constructor obviously could be extracted in a HOC/base class.

Using Apollo framework with NextJS to fetch data
Notice the bulkiness of the above example. Even if we not take into account the client/server code we still end up with an inconvenient build process. What if we could make an app that will not require any build steps, pre-compilations, Babel plugins and so on.

Recently the Apollo Framework has received a lot of traction, and of course it has an integration with Next.

All we need to do is to install a few packages:

$ npm i apollo-link-http next-apollo react-apollo graphql-tag --save
Then we need to create a pre-configured HOC that we will attach to our pages:

import {withData} from 'next-apollo'
import {HttpLink} from 'apollo-link-http'

const config = {
    link: new HttpLink({
        uri: 'https://swapi.graph.cool',
        opts: {
            credentials: 'same-origin'
        }
    })
};

export default withData(config);
And then we can use this HOC in pages:

import React from 'react';
import {graphql} from 'react-apollo';
import gql from 'graphql-tag';
import withData from "../components/withData";

const query = gql`
    query {
        allFilms {
            id,
            director,
            title,
            characters {
                name
            }
        }
    }
`;

let Index = ({data: {loading, allFilms, error}}) => {

    if (error) return (
        <div>Error! {error.message}</div>
    );

    if (loading) return (
        <div>Loading...</div>
    );

    return (
        <div>
            {allFilms.map(film => (
                <div key={film.id}>
                    <h1>{film.title}</h1>
                    <p>Director: {film.director}</p>
                    <p>Characters: {film.characters.map(c => c.name).join(', ')}</p>
                </div>
            ))}
        </div>
    );

};

Index = graphql(query)(Index);
Index = withData(Index);

export default Index;
Everything else is happening behind the scenes. HOC takes care of the NextJS data lifecycle, it finds all queries that has to be run, waits till they are complete and then releases the data.



Recap
Now, after reading this chapter, you should be capable for writing a fully functional application that can load data and manage it's state. In the next chapter we will cover more sophisticated topics about NextJS app patterns.