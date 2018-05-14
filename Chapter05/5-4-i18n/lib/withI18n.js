import 'isomorphic-unfetch';
import React from "react";
import PropTypes from "prop-types";
import i18n from 'i18next';
import {I18nextProvider, translate} from 'react-i18next'
import moment from 'moment';
import formatMessage from 'format-message';

const fallbackLng = 'en';
const defaultNS = 'common';

const baseUrl = 'http://localhost:3000/static/locales';
const getLangUrl = (lang, ns) => `${baseUrl}/${lang}/${ns}.json`;
let translation = null;

export const getTranslation = async (lang, namespaces) => {

    translation = translation || {}; //TODO Invalidate in dev mode

    for (let ns of namespaces) {

        if (!translation[lang] || !translation[lang][ns]) {

            let response = await fetch(getLangUrl(lang, ns));

            if (!response.ok) {
                response = await fetch(getLangUrl(fallbackLng, ns));
            }

            translation[lang] = translation[lang] || {};
            translation[lang][ns] = await response.json();
        }

    }

    return translation;

};

const getLang = (cookie) => cookie.match(/lang=([a-z]+)/)[1];

export default (namespaces = []) => (WrappedComponent) => (

    class WithI18n extends React.Component {

        static displayName = `withI18n(${WrappedComponent.displayName
                                         || WrappedComponent.name
                                         || 'Component'})`;

        static async getInitialProps(args) {

            const req = args.req;

            const lng = (req && req.headers.cookie && getLang(req.headers.cookie))
                        || (document && getLang(document.cookie))
                        || fallbackLng;

            const resources = await getTranslation(
                lng,
                [defaultNS, ...namespaces] // list other namespaces here when needed
            );

            const props = WrappedComponent.getInitialProps
                          ? await WrappedComponent.getInitialProps(args)
                          : {};

            return {
                ...props,
                resources,
                lng
            };

        }

        constructor(props, context) {

            super(props, context);

            const {lng, resources} = props;

            translation = translation || resources; // recover client side cache of translations

            this.i18n = i18n.init({
                fallbackLng,
                lng,
                resources,
                defaultNS,
                ns: [defaultNS],
                debug: false
            });

            // this allows to use translation in pages
            this.Wrapper = translate(namespaces)(WrappedComponent);

            this.moment = moment().locale(lng);

        }

        render() {

            const {Wrapper, moment, props: {resources, ...props}} = this;

            return (
                <I18nextProvider i18n={this.i18n}>
                    <Wrapper {...props} moment={moment} msg={formatMessage}/>
                </I18nextProvider>
            );

        }

    }

);