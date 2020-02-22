const stream = require('stream').Readable;

class MaddenParser extends stream.Readable {
    constructor(installPath) {
        super();
        this._installPath = installPath;
    };

    _read() {

    };
};

module.exports = MaddenParser;