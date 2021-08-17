class TDB2Record {
    constructor() {
        this[Symbol.toStringTag] = 'TDB2Record';
        this._fields = {};
    };

    get fields() {
        return this._fields;
    };

    set fields(fields) {
        this._fields = fields;
    };

    get index() {
        return this._index;
    };

    set index(index) {
        this._index = index;
    };

    getFieldByKey(key) {
        return this._fields[key];
    };
};

module.exports = TDB2Record;