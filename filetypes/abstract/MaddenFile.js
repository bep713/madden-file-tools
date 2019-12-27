const fs = require('fs');

class MaddenFile {
    constructor (filePath, rawContents) {
        this._filePath = filePath;
        this._rawContents = rawContents;
        this._header = {};
        this[Symbol.toStringTag] = 'MaddenFile';
    };

    get filePath () {
        return this._filePath;
    };

    get rawContents () {
        return this._rawContents;
    };

    get header () {
        return this._header;
    };

    get size () {
        return this._rawContents.length;
    };

    parse() {
        throw new Error('Method not implemented.');
    };

    save(filePathOverride) {
        let pathToSave = filePathOverride ? filePathOverride : this.filePath;

        if (!pathToSave) {
            throw new Error('No file path specified. Please call save() with a file path argument.');
        }
        
        fs.writeFileSync(pathToSave, this.rawContents);
    };

    convert(convertTo) {
        return new Promise((resolve, reject) => {
            reject('Convert method not implemented.');
        });
    };
};

module.exports = MaddenFile;