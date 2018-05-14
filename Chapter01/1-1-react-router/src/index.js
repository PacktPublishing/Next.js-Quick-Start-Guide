import React from 'react';
import {render} from 'react-dom';

import BrowserRouter from 'react-router-dom/BrowserRouter';
import {renderRoutes} from 'react-router-config';

import routes from './routes';

const Router = () => {
    return (
        <BrowserRouter>
            {renderRoutes(routes)}
        </BrowserRouter>
    )
};

render(<Router/>, document.getElementById('app'));