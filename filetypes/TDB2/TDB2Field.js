const utilService = require('../../services/utilService');

const FIELD_TYPE_INT = 0;
const FIELD_TYPE_STRING = 1;
const FIELD_TYPE_UNK = 3;
const FIELD_TYPE_SUBTABLE = 4;
const FIELD_TYPE_FLOAT = 10;

class TDB2Field {
    constructor() {
        this[Symbol.toStringTag] = 'TDB2Field';
        this._key = null;
        this._rawKey = null;
        this._type = null;
        this._length = 0;
        this._raw = null;
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

    get type() {
        return this._type;
    };

    set type(type) {
        this._type = type;
    };

    get raw() {
        return this._raw;
    };

    set raw(raw) {
        this._raw = raw;
    };

    get value() {
        switch(this.type) {
            case FIELD_TYPE_INT:
                return utilService.readModifiedLebCompressedInteger(this._raw);
            case FIELD_TYPE_STRING:
                const str = this._raw.toString('utf8');
                return str.substring(0, str.length - 1);
            case FIELD_TYPE_SUBTABLE:
                return this._value;
            case FIELD_TYPE_FLOAT:
                return this._raw.readFloatBE(0);
        }
    };

    set value(value) {
        this._isChanged = true;

        switch(this.type) {
            case FIELD_TYPE_INT:
                this._raw = utilService.writeModifiedLebCompressedInteger(value);
                break;
            case FIELD_TYPE_STRING:
                let strHexArray = value.split('').map((char) => {
                    return char.charCodeAt(0);
                });

                strHexArray.push(0x0);
                this.length = strHexArray.length;

                this._raw = Buffer.from(strHexArray);
                break;
            case FIELD_TYPE_SUBTABLE:
                this._value = value;
                break
            case FIELD_TYPE_FLOAT:
                this._raw.writeFloatBE(value, 0);
                break;
        }
    };

    get raw() {
        return this._raw;
    };

    set raw(raw) {
        this._raw = raw;
    };

    get length() {
        return this._length;
    };

    set length(len) {
        this._length = len;
    };

    get isChanged() {
        return this._isChanged;
    };

    set isChanged(isChanged) {
        this._isChanged = isChanged;
    };

    get rawKey() {
        return this._rawKey;
    };

    set rawKey(raw) {
        this._rawKey = raw;
    };
};

module.exports = TDB2Field;