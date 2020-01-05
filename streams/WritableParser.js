const Parser = require('stream-parser');
const stream = require('stream');

class WritableParser extends stream.Writable {
    constructor() {
        super();
        Parser(this);

        this._file = null;
        this._currentBufferIndex = 0;
    };

    get file () {
        return this._file;
    };
};

module.exports = WritableParser;