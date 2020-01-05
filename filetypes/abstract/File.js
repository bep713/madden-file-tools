const fs = require('fs');
const EventEmitter = require('events').EventEmitter;

class File extends EventEmitter {
    constructor () {
        super();
        // this._filePath = filePath;
        // this._stream = stream;
        this._header = {};
        // this._readStream = fs.createReadStream(this._filePath);
        this[Symbol.toStringTag] = 'MaddenFile';
    };

    // get filePath () {
    //     return this._filePath;
    // };

    get header () {
        return this._header;
    };

    set header (header) {
        this._header = header;
    }

    // get size () {
    //     return this._rawContents.length;
    // };

    get stream () {
        return this._stream;
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