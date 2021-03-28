const TDBField = require("./TDBField");

class TDBExtraDataField extends TDBField {
    constructor() {
        super();
        this._extraDataBuffer = null;
        this._offsetLength = 0;
        this._extraDataOffset = 0;
    };

    get offset() {
        return super.value;
    };

    set offset(offset) {
        super.value = offset;
    };

    get extraDataBuffer() {
        return this._extraDataBuffer;
    };

    set extraDataBuffer(buf) {
        this._extraDataBuffer = buf;
    };

    get offsetLength() {
        return this._offsetLength;
    };

    set offsetLength(offsetLength) {
        this._offsetLength = offsetLength;
    };

    get extraDataOffset() {
        return this._extraDataOffset;
    };

    set extraDataOffset(offset) {
        this._extraDataOffset = offset;
    };
};

module.exports = TDBExtraDataField;