import React from "react";
import Router from 'next/router';
import ReactGA from 'react-ga';

const GA_TRACKING_ID = '5594409';
const WINDOWPROP = '__NEXT_GA_INITIALIZED__';
const debug = process.env.NODE_ENV !== 'production';

export default (WrappedComponent) => (class WithGA extends React.Component {

    lastPath = null;

    componentDidMount() {
        this.initGa();
        this.trackPageview();
        Router.router.events.on('routeChangeComplete', this.trackPageview);
    }

    componentWillUnmount() {
        Router.router.events.off('routeChangeComplete', this.trackPageview);
    }

    trackPageview = (path = document.location.pathname) => {
        if (path === this.lastPath) return;
        ReactGA.pageview(path);
        this.lastPath = path;
    };

    initGa = () => {
        if (WINDOWPROP in window) return;
        ReactGA.initialize(GA_TRACKING_ID, {debug});
        window[WINDOWPROP] = true;
    };

    render() {
        return (
            <WrappedComponent {...this.props} />
        );
    }

});