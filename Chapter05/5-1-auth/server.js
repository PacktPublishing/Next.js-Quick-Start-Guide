const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const users = require('./users');
const conf = require('./next.config');

const port = 3000;
const cookieName = 'token';
const dev = process.env.NODE_ENV !== 'production'; // use default NodeJS environment variable to figure out dev mode
const app = next({dev, conf});
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
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
            httpOnly: true
        });
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

exports.server = server;
exports.authMiddleware = authMiddleware;