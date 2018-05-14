import React from "react";
import {connect} from "react-redux";

export default (checkCb) => (WrappedComponent) => {

    class WithRbac extends React.Component {

        static async getInitialProps(args) {

            const {user} = args.store.getState();

            // First time check
            const granted = checkCb(user);

            if (!granted && args.res) {
                args.res.statusCode = 401;
            }

            const additionalArgs = {...args, granted};

            return WrappedComponent.getInitialProps
                   ? await WrappedComponent.getInitialProps(additionalArgs)
                   : {};

        }

        render() {

            const granted = checkCb(this.props.user);

            // Runtime checks
            return (
                <WrappedComponent {...this.props} granted={granted}/>
            );

        }

    }

    WithRbac.displayName = `withRbac(${WrappedComponent.displayName 
                                       || WrappedComponent.name 
                                       || 'Component'})`;

    return connect(state => ({
        user: state.user
    }))(WithRbac);

}