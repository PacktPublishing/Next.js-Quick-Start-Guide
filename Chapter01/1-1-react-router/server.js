import express from 'express';
import fetch from 'node-fetch';

import React from 'react';
import {renderToString} from 'react-dom/server';

import StaticRouter from 'react-router-dom/StaticRouter';
import {matchRoutes, renderRoutes} from 'react-router-config';

import routes from './src/routes';

global.fetch = fetch;

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', process.cwd() + '/public');

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

app.listen(port, listen);

function listen(err) {
   if (err) throw err;
   console.log('Listening %s', port);
}

