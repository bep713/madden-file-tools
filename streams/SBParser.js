const leb = require('leb');
// const debug = require('debug')('mft');
const stream = require('stream');
const Parser = require('stream-parser');

const SBFile = require('../filetypes/SBFile');

class SBParser extends stream.Writable {
    constructor() {
        super();
        Parser(this);

        this._file = new SBFile();
        this._currentBufferIndex = 0;
        this._bytes(4, this._onMagic);
    };
};

module.exports = SBParser;