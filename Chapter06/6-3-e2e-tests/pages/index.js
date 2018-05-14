import 'isomorphic-unfetch';
import React from "react";

export default class Index extends React.Component {

    static async getInitialProps({err, req, res, pathname, query, asPath}) {
        const userinfo = await (await fetch('https://api.github.com/users/octocat')).json();
        return {
            userinfo: userinfo
        };
    }

    state = {
        clicked: false
    };

    handleClick = (e) => {
        this.setState({clicked: true});
    };

    render() {
        return (
            <div>
                <div>Hello, {this.props.userinfo.login}!</div>
                <div>
                    <button onClick={this.handleClick}>Click</button>
                </div>
                {this.state.clicked && (<div>Clicked</div>)}
            </div>
        );
    }

}