import 'isomorphic-unfetch';

export const sum = (a, b) => (a + b);

export const getOctocat = async () =>
    (await fetch('https://api.github.com/users/octocat')).json();