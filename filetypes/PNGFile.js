const File = require('./abstract/File');

class PNGFile extends File {
    constructor(filePath, contents) {
        super(filePath, contents);
        this[Symbol.toStringTag] = 'PNGFile';
    };
}

module.exports = PNGFile;