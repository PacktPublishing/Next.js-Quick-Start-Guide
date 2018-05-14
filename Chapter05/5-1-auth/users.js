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