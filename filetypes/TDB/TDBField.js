const { BitView } = require('bit-buffer');

const FIELD_TYPE_STRING = 0;
const FIELD_TYPE_BINARY = 1;
const FIELD_TYPE_SINT = 2;
const FIELD_TYPE_UINT = 3;
const FIELD_TYPE_FLOAT = 4;
const FIELD_TYPE_VARCHAR1 = 13;
const FIELD_TYPE_VARCHAR2 = 14;

class TDBField {
    constructor() {
        this[Symbol.toStringTag] = 'TDBField';

        this._key = null;
        this._definition = null;
        this._raw = null;
        this._rawBits = null;
        this._value = null;
        this._isChanged = false;
    };

    get key() {
        return this._key;
    };

    set key(key) {
        this._key = key;
    };

    // Alias for key
    get name() {
        return this.key;
    };

    // Alias for key
    set name(name) {
        this.key = name;
    };

    get definition() {
        return this._definition;
    };

    set definition(definition) {
        this._definition = definition;
        this._key = definition.name;
    };

    get raw() {
        return this._raw;
    };

    set raw(raw) {
        this._raw = raw;
    };

    get rawBits() {
        return this._rawBits;
    };

    set rawBits(rawBits) {
        this._rawBits = rawBits;
    };

    // Alias for raw
    get unformattedValue() {
        return this.raw;
    };

    // Alias for raw
    set unformattedValue(raw) {
        this.raw = raw;
    };

    get value() {
        switch (this.definition.type) {
            case FIELD_TYPE_STRING:
                return this._raw.toString('utf8', (this.definition.offset/8), (this.definition.offset + this.definition.bits)/8).replace(/\0/g, '');
            case FIELD_TYPE_BINARY:
                return '0x' + this._raw.slice((this.definition.offset/8), (this.definition.offset + this.definition.bits)/8).toString('hex');
            case FIELD_TYPE_VARCHAR1:
            case FIELD_TYPE_VARCHAR2:
                return this._raw.readUInt32BE(this.definition.offset/8);
                break;
            case FIELD_TYPE_SINT:
            case FIELD_TYPE_UINT:
            case FIELD_TYPE_FLOAT:
            default:
                return this._rawBits.getBits(this.definition.offset, this.definition.bits);
        }
    };

    set value(value) {
        switch (this.definition.type) {
            case FIELD_TYPE_STRING:
                let strHexArray = value.split('').map((char) => {
                    return char.charCodeAt(0);
                });

                strHexArray.length = this.definition.bits/8;
                this._raw.set(new Uint8Array(strHexArray), this.definition.offset/8);
                break;
            case FIELD_TYPE_BINARY:
                // const fieldValue = Buffer.from(, 'hex');
                this._raw.write(value.substring(2), (this.definition.offset/8), (this.definition.offset + this.definition.bits)/8, 'hex');
                break;
            case FIELD_TYPE_VARCHAR1:
            case FIELD_TYPE_VARCHAR2:
                this._rawBits.setBits(this.definition.offset, value, 32);
                break;
            case FIELD_TYPE_SINT:
            case FIELD_TYPE_UINT:
            case FIELD_TYPE_FLOAT:
            default:
                this._rawBits.setBits(this.definition.offset, value, this.definition.bits);
        }

        this._isChanged = true;
    };

    get isChanged() {
        return this._isChanged;
    };

    set isChanged(isChanged) {
        this._isChanged = isChanged;
    };
};

module.exports = TDBField;