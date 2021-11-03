const path = require('path');
const { PluginManager } = require('plugnplay');

class GameFileManager {
    constructor() {
        this._isInitialized = false;
        this._plugins = ['madden22'];
        this._initializedPlugins = [];

        this._manager = new PluginManager({
            discovery: {
                rootPath: [path.join(__dirname, '../plugins').replace(new RegExp('\\\\', 'g'), '/')]
            }
        });
    };

    addPluginFolder(folderPath) {
        this._manager.config.discovery.rootPath.push(folderPath);
    };

    async addPlugin(pluginId, pluginFolderPath) {
        this._plugins.push(pluginId);
        this.addPluginFolder(pluginFolderPath);

        if (this._isInitialized) {
            this._manager.registeredDescriptors = new Set();
            this._manager.discovered = false;
            const plugin = await this._manager.instantiate(pluginId);
            return plugin;
        }
    };

    async initialize() {
        if (!this._isInitialized) {
            const pluginInstantiatePromises = this._plugins.map((pluginId) => {
                return this._manager.instantiate(pluginId);
            });
    
            this._initializedPlugins = await Promise.all(pluginInstantiatePromises);
            this._isInitialized = true;
        }
    };

    getPlugin(pluginId) {
        return this._initializedPlugins.find((plugin) => { return plugin.descriptor.id === pluginId; });
    };
};

module.exports = GameFileManager;