import React from "react";
import {getOctocat} from "../lib";

export default class Index extends React.Component {

    static async getInitialProps({err, req, res, pathname, query, asPath}) {
        const userinfo = await getOctocat();
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