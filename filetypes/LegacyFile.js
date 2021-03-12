const File = require('../abstract/File');

class LegacyFile extends File {
    constructor() {
        super();
        this[Symbol.toStringTag] = 'LegacyFile';
    };
};

module.exports = LegacyFile;