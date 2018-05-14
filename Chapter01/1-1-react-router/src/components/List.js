import React from "react";

const getText = async () => (await (await fetch('https://api.github.com/users/octocat')).text());

export default class List extends React.Component {

    state = {text: ''};

    static async getInitialProps(context) {
        context.text = await getText();
    }

    async componentWillMount() {
        const text = await getText();
        this.setState({text})
    }

    render() {

        const {staticContext} = this.props;
        let {text} = this.state;

        if (staticContext && !text) text = staticContext.text;

        return (
            <pre>Text: {text}</pre>
        );

    }

}