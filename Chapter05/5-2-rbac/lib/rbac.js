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