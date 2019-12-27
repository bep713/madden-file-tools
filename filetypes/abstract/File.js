const fs = require('fs');

class File {
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
        
    };

    save(filePathOverride) {
        return new Promise((resolve, reject) => {
            let pathToSave = filePathOverride ? filePathOverride : this.filePath;

            if (!pathToSave) {
                reject(new Error('No file path specified. Please call save() with a file path argument.'));
            }
            
            fs.writeFile(pathToSave, this.rawContents, function (err) {
                if (err) reject(err);
                
                resolve();
            });
        });
    };

    convert(convertTo) {
        return new Promise((resolve, reject) => {
            reject('Convert method not implemented.');
        });
    };
};

module.exports = File;