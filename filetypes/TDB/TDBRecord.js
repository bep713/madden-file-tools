class TDBRecord {
    constructor() {
        super();
        this[Symbol.toStringTag] = 'TDBField';

        this._fields = [];
    };

    get fields() {
        return this._fields;
    };

    set fields(fields) {
        _removeOldFieldProperties();

        this._fields = fields;

        this._fields.forEach((field) => {
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

    _removeOldFieldProperties() {
        this._fields.forEach((field) => {
            delete field.key;
        });
    };
};

module.exports = TDBRecord;
