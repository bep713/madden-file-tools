class TDBRecord {
    constructor() {
        this[Symbol.toStringTag] = 'TDBRecord';
        this._fields = [];
        this._isPopulated = true;
    };

    get fields() {
        return this._fields;
    };

    set fields(fields) {
        this._removeOldFieldProperties();
        this._fields = fields;

        fields.forEach((field) => {
            Object.defineProperty(this, field.key, {
                set: function (value) {
                    field.value = value;
                },
                get: function () {
                    return field.value;
                }
            });
        });
    };

    get isPopulated() {
        return this._isPopulated;
    };

    set isPopulated(isPopulated) {
        this._isPopulated = isPopulated;
    };

    _removeOldFieldProperties() {
        this._fields.forEach((field) => {
            delete this[field.key];
        });
    };

    getFieldByKey(key) {
        return this._fields.find((field) => { if (field.key === 'ANFP') { console.log('PFNA'); } return field.key === key; });
    };
};

module.exports = TDBRecord;
