class TDBField {
    constructor(key, value, offset) {
        super();
        this[Symbol.toStringTag] = 'TDBField';

        this._key = key;
        this._offset = offset;
        this._raw = raw;
    };

    get key() {
        return this._key;
    };

    set key(key) {
        this._key = key;
    };

    get offset() {
        return this._offset;
    };

    set offset(offset) {
        this._offset = offset;
    };

    get raw() {
        return this._raw;
    };

    set raw(raw) {
        this._raw = raw;
    };

    // Alias for raw
    get unformattedValue() {
        return this.raw;
    };

    // Alias for raw
    set unformattedValue(raw) {
        this.raw = raw;
    };
};

module.exports = TDBField;