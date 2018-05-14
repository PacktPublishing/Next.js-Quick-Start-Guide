import React from "react";

const faultyPromise = (client) => new Promise((resolve, reject) => {
    setTimeout(() => {
        reject(new Error('Faulty ' + (client ? 'client' : 'server')));
    }, 500);
});

export default class Page extends React.Component {

    state = {
        loading: false,
        error: null,
        result: null
    };

    static async loadPosts(client) {
        return await faultyPromise(client);
    }

    static async getInitialProps() {
        try {
            return {result: await Page.loadPosts(false)};
        } catch (e) {
            return {error: e.message};
        }
    }

    retry = async () => {
        this.setState({result: null, error: null, loading: true});
        try {
            this.setState({loading: false, result: await Page.loadPosts(true)});
        } catch (e) {
            this.setState({loading: false, error: e.message});
        }
    };

    getError() {
        return (this.state.error || this.props.error);
    }

    getResult() {
        return (this.state.result || this.props.result);
    }

    isLoading() {
        return this.state.loading;
    }

    render() {
        if (this.state.loading) return (<div>Loading...</div>);

        const error = this.getError();
        if (error) return (
            <div>
                Cannot load posts: "{error}"
                <br/>
                <button onClick={this.retry}>Retry</button>
            </div>
        );

        return (
            <pre>{JSON.stringify(this.getResult())}</pre>
        );
    }
}