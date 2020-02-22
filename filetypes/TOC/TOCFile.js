const File = require('../abstract/File');

class TOCFile extends File {
    constructor() {
        super();
        this._entries = [];
        this[Symbol.toStringTag] = 'TOCFile';
    };

    addEntry (entry) {
        this._entries.push(entry);
    };

    get root () {
        return this._entries[0];
    };
}

module.exports = TOCFile;