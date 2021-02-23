class TDBTable {
    constructor() {
        this[Symbol.toStringTag] = 'TDBTable';

        this._name = '';
        this._header = {};
        this._fieldDefinitions = [];
        this._records = [];
    };

    get name() {
        return this._name;
    };

    set name(name) {
        this._name = name;
    };

    get header() {
        return this._header;
    };

    set header(header) {
        this._header = header;
    };

    get fieldDefinitions() {
        return this._fieldDefinitions;
    };

    set fieldDefinitions(fieldDefinitions) {
        this._fieldDefinitions = fieldDefinitions;
    };

    get records() {
        return this._records.filter((record) => { 
            return record.isPopulated;
        });
    };

    set records(records) {
        this._records = records;
    };
};

module.exports = TDBTable;