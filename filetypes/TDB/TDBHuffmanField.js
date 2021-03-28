const huffmanTreeParser = require('../../services/huffmanTreeParser');
const TDBExtraDataField = require("./TDBExtraDataField");

class TDBHuffmanField extends TDBExtraDataField {
    constructor() {
        super();
        this._huffmanTreeRoot = null;
        this._huffmanValueLength = 0;
        this._offsetLength = 0;
    };

    get value() {
        if (this.extraDataBuffer) {
            return huffmanTreeParser.decodeBufferFromRoot(this._huffmanTreeRoot, this.extraDataBuffer.slice(this.offsetLength), this.extraDataOffset);  
        }
        else {
            return '';
        }
    };

    set value(value) {
        const offsetBuffer = Buffer.alloc(this.offsetLength);
        offsetBuffer.writeIntBE(value.length, 0, this.offsetLength);

        this.extraDataBuffer = Buffer.concat([offsetBuffer, huffmanTreeParser.encodeStringFromRoot(this._huffmanTreeRoot, value)]);
        this.extraDataOffset = value.length;
        this._isChanged = true;
    };

    get huffmanTreeRoot() {
        return this._huffmanTreeRoot;
    };

    set huffmanTreeRoot(root) {
        this._huffmanTreeRoot = root;
    };
};

module.exports = TDBHuffmanField;