class TDBRecord {
    constructor() {
        this[Symbol.toStringTag] = 'TDBRecord';
        this._fields = {};
        this._isPopulated = true;
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

    getFieldByKey(key) {
        return this._fields.find((field) => { if (field.key === 'ANFP') { console.log('PFNA'); } return field.key === key; });
    };
};

module.exports = TDBRecord;
