const TDBField = require("./TDBField");
const huffmanTreeParser = require('../../services/huffmanTreeParser');

class TDBHuffmanField extends TDBField {
    constructor() {
        super();
        this._offset = null;
        this._huffmanTreeRoot = null;
        this._huffmanEncodedBuffer = null;
    };

    get value() {
        return huffmanTreeParser.decodeBufferFromRoot(this._huffmanEncodedBuffer, this._huffmanTreeRoot);  
    };

    get offset() {
        return super.value;
    };

    get huffmanTreeRoot() {
        return this._huffmanTreeRoot;
    };

    set huffmanTreeRoot(root) {
        this._huffmanTreeRoot = root;
    };

    get huffmanEncodedBuffer() {
        return this._huffmanEncodedBuffer;
    };

    set huffmanEncodedBuffer(buf) {
        this._huffmanEncodedBuffer = buf;
    };
};

module.exports = TDBHuffmanField;