const withSass = require('@zeit/next-sass');
const withTypescript = require('@zeit/next-typescript');

const {PHASE_DEVELOPMENT_SERVER} = require('next/constants');

const addPlugins = (config) => withTypescript(withSass(config));

const additionalConfig = {
    serverRuntimeConfig: {
        serverOnly: 'secret'
    },
    publicRuntimeConfig: {
        serverAndClient: 'public'
    },
    // Uncomment if you don't use withTypescript plugin, but this is a bad choice :)
    // pageExtensions: ['jsx', 'js', 'tsx', 'ts'],
    // webpack(config, {dir, defaultLoaders}) {
    //     config.resolve.extensions.push('.ts', '.tsx');
    //     config.module.rules.push({
    //         test: /\.+(ts|tsx)$/,
    //         include: [dir],
    //         exclude: /node_modules/,
    //         use: [
    //             defaultLoaders.babel,
    //             {
    //                 loader: 'ts-loader',
    //                 options: {
    //                     transpileOnly: true
    //                 }
    //             }
    //         ]
    //     });
    //     return config;
    // }
};

module.exports = (phase, {defaultConfig}) => {

    if (phase === PHASE_DEVELOPMENT_SERVER) {
        return addPlugins(Object.assign({}, defaultConfig, additionalConfig));
    }

    return addPlugins(Object.assign({}, defaultConfig, additionalConfig, {
        distDir: 'build-custom'
    }));

};