const File = require('./abstract/File');

class CASFile extends File {
    constructor() {
        super();
        this._legacyFiles = [];
    };

    get legacyFiles() {
        return this._legacyFiles;
    };

    addLegacyFile(legacyFile) {
        this._legacyFiles.push(legacyFile);
    };
};

module.exports = CASFile;