const { expect } = require('chai');
const path = require('path');
const GameFileManager = require('../../../readers/GameFileManager');

let originalPluginCount = 0;

describe('Game file manager unit tests', () => {
    it('expected result', async () => {
        const manager = new GameFileManager();
        await manager.initialize();
        originalPluginCount = manager._plugins.length;
        expect(manager._plugins.length).to.be.greaterThan(0);
    });

    it('expected result - add external plugins', async () => {
        const manager = new GameFileManager();
        manager.addPlugin('Madden23', path.join(__dirname, '../../data/plugins'));
        await manager.initialize();

        expect(manager._plugins.length).to.equal(originalPluginCount + 1);
    });

    it('expected result - can add a plugin after initialization', async () => {
        const manager = new GameFileManager();
        await manager.initialize();
        const m22Plugin = manager.getPlugin('madden22');
        expect(m22Plugin).to.not.be.undefined;

        const plugin = await manager.addPlugin('Madden23', path.join(__dirname, '../../data/plugins'));

        expect(plugin).to.not.be.undefined;
        expect(m22Plugin).to.not.be.undefined;
    });

    it('can execute plugin functions', async () => {
        const manager = new GameFileManager();
        await manager.initialize();

        const m22Plugin = await manager.getPlugin('madden22');
        m22Plugin.exports.parse();
    });
});