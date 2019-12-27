const MaddenFile = require('./abstract/MaddenFile');

class PNGFile extends MaddenFile {
    constructor(filePath, contents) {
        super(filePath, contents);
        this[Symbol.toStringTag] = 'PNGFile';
    };
}

module.exports = PNGFile;