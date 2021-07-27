class TDBRecord {
    constructor() {
        this[Symbol.toStringTag] = 'TDBRecord';
        this._fields = {};
        this._isPopulated = true;
        this._recordBuffer = null;
    };

    get fields() {
        return this._fields;
    };

    set fields(fields) {
        this._fields = fields;
    };

    get isPopulated() {
        return this._isPopulated;
    };

    set isPopulated(isPopulated) {
        this._isPopulated = isPopulated;
    };

    get index() {
        return this._index;
    };

    set index(index) {
        this._index = index;
    };

    get recordBuffer() {
        return this._recordBuffer;
    };

    set recordBuffer(buffer) {
        this._recordBuffer = buffer;
    };

    getFieldByKey(key) {
        return this._fields[key];
    };
};

module.exports = TDBRecord;
