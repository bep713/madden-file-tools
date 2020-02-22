const File = require('./abstract/File');

class DDSFile extends File {
    constructor() {
        super();
        this[Symbol.toStringTag] = 'DDSFile';
    };
};

module.exports = DDSFile;