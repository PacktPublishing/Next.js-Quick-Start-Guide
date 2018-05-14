import React from 'react';
import PropTypes from 'prop-types';
import {PersistGate} from 'redux-persist/integration/react';

export default (gateProps = {}) => (WrappedComponent) => (

    class WithPersistGate extends React.Component {

        static displayName = `withPersistGate(${WrappedComponent.displayName
                                                || WrappedComponent.name
                                                || 'Component'})`;
        static contextTypes = {
            store: PropTypes.object.isRequired
        };

        constructor(props, context) {
            super(props, context);
            this.store = context.store;
        }

        render() {
            return (
                <PersistGate {...gateProps} persistor={this.store.__persistor}>
                    <WrappedComponent {...this.props} />
                </PersistGate>
            );
        }

    }

);
