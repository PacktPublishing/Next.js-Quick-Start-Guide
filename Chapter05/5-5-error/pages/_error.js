import React from 'react';
import Error from 'next/error';

export default class ErrorPage extends React.Component {

    componentWillMount() {
        // here we can log an error for further analysis
        console.log('Unhandled error', this.props.url.pathname);
    }

    render() {
        return (
            <Error statusCode={this.props.statusCode}/>
        );
    }
}