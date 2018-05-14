import React from "react";

export default class UnhandledErrorPage extends React.Component {

    static async getInitialProps() {
        throw new Error('Unhandled error from getInitialProps');
    }

    render() {
        return (
            <div>Whatever</div>
        );
    }
}