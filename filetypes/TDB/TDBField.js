class TDBField {
    constructor() {
        this[Symbol.toStringTag] = 'TDBField';

        this._key = null;
        this._definition = null;
        this._raw = null;
        this._value = null;
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

    // Alias for raw
    get unformattedValue() {
        return this.raw;
    };

    // Alias for raw
    set unformattedValue(raw) {
        this.raw = raw;
    };

    get value() {
        return this._value;
    };

    set value(value) {
        this._value = value;
    };
};

module.exports = TDBField;