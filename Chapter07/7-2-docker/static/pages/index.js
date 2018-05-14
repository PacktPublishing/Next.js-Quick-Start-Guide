import 'isomorphic-unfetch';
import React from "react";

export default class Index extends React.Component {

    static async getInitialProps({err, req, res, pathname, query, asPath}) {
        const userinfo = await (await fetch('https://api.github.com/users/octocat')).json();
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