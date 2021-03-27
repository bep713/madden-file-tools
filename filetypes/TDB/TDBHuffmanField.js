const TDBField = require("./TDBField");
const huffmanTreeParser = require('../../services/huffmanTreeParser');

class TDBHuffmanField extends TDBField {
    constructor() {
        super();
        this._huffmanTreeRoot = null;
        this._huffmanEncodedBuffer = null;
        this._huffmanValueLength = 0;
        this._offsetLength = 0;
    };

    get value() {
        return huffmanTreeParser.decodeBufferFromRoot(this._huffmanTreeRoot, this._huffmanEncodedBuffer.slice(this._offsetLength), this._huffmanValueLength);  
    };

    set value(value) {
        const offsetBuffer = Buffer.alloc(this._offsetLength);
        offsetBuffer.writeIntBE(value.length, 0, this._offsetLength);

        this._huffmanEncodedBuffer = Buffer.concat([offsetBuffer, huffmanTreeParser.encodeStringFromRoot(this._huffmanTreeRoot, value)]);
        this._huffmanValueLength = value.length;
        this._isChanged = true;
    };

    get offset() {
        return super.value;
    };

    set offset(offset) {
        super.value = offset;
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

    get offsetLength() {
        return this._offsetLength;
    };

    set offsetLength(offsetLength) {
        this._offsetLength = offsetLength;
    };
};

module.exports = TDBHuffmanField;