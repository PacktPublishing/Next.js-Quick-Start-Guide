const authServer = require('../5-1-auth/server');
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

