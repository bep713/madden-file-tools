const Archive = require('./abstract/Archive');

class ASTFile extends Archive {
    constructor() {
        super();
        this[Symbol.toStringTag] = 'ASTFile';

        this._toc = [];
    };

    get tocs() {
        return this._tocs;
    };

    set tocs(tocs) {
        this._tocs = tocs;
    };
};

module.exports = ASTFile;