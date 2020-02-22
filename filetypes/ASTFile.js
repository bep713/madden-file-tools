const Archive = require('./abstract/Archive');

class ASTFile extends Archive {
    
    constructor() {
        super();
        this[Symbol.toStringTag] = 'ASTFile';

        this._toc = [];
    };

    get toc() {
        return this._tocs;
    };

    set toc(tocs) {
        this._tocs = tocs;
    };
};

module.exports = ASTFile;