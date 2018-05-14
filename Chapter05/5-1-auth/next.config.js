module.exports = {
    webpack: (config, defaultConfig) => {
        config.resolve.symlinks = false;
        return config;
    }
};