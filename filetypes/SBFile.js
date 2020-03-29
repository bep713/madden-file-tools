const File = require('../abstract/File');

class SBFile extends File {
    constructor() {
        super();
        this._bundles = [];
        this._chunks = [];
        this[Symbol.toStringTag] = 'SBFile';
    };

    addBundle(bundle) {
        this._bundles.push(bundle);
    };

    addChunk(chunk) {
        this._chunks.push(chunk);
    };
}

module.exports = SBFile;