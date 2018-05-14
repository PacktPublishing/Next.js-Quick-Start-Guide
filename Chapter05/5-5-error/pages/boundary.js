import React from "react";

class FaultyComponent extends React.Component {
    componentWillMount() {
        // only synchronous errors will be captured
        throw new Error('FaultyComponent threw an error');
    }

    render() {
        return null;
    }
}

export default class Page extends React.Component {

    state = {error: null, mount: false};

    componentDidCatch(e, info) {
        console.error(e, info);
        this.setState({error: e.message});
    }

    mount() {
        this.setState({mount: true});
    }

    render() {

        const {error, mount} = this.state;

        if (error) return (
            <div>Boundary captured an error: {error}</div>
        );

        return (
            <div>
                <button onClick={() => this.mount()}>Mount a component that will error</button>
                {mount ? <FaultyComponent/> : null}
            </div>
        );
    }
}