const { PluginLoaderBase } = require('plugnplay');

module.exports = class Madden22Loader extends PluginLoaderBase {
    export() {
        return Promise.resolve({
            parse: () => {
                console.log('Parsing M23');    
            },

            getResource: (name) => {
                console.log('M23: Fetching resource', name);
            }
        })
    }
};