const TDBField = require("./TDBField");
const huffmanTreeParser = require('../../services/huffmanTreeParser');

class TDBHuffmanField extends TDBField {
    constructor() {
        super();
        this._offset = null;
        this._huffmanTreeRoot = null;
        this._huffmanEncodedBuffer = null;
        this._huffmanValueLength = 0;
    };

    get value() {
        return huffmanTreeParser.decodeBufferFromRoot(this._huffmanTreeRoot, this._huffmanEncodedBuffer, this._huffmanValueLength);  
    };

    set value(value) {
        this._huffmanEncodedBuffer = huffmanTreeParser.encodeStringFromRoot(this._huffmanTreeRoot, value);
        this._huffmanValueLength = value.length;
        this._isChanged = true;
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

    get huffmanValueLength() {
        return this._huffmanValueLength;
    };

    set huffmanValueLength(length) {
        this._huffmanValueLength = length;
    };
};

module.exports = TDBHuffmanField;