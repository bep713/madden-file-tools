const utilService = require('../../services/utilService');

class TDB2Table {
    constructor() {
        this._type = 4;
        this._name = '';
        this._offset = 0;
        this._unknown1 = 0;
        this._records = [];
        this._rawKey = null;
        this._numEntriesRaw = null;
    };

    get name() {
        return this._name;
    };

    set name(name) {
        this._name = name;
    };

    get offset() {
        return this._offset;
    };

    set offset(offset) {
        this._offset = offset;
    };

    get type() {
        return this._type;
    };
    
    set type(type) {
        this._type = type;
    };

    get unknown1() {
        return this._unknown1;
    };

    set unknown1(unk1) {
        this._unknown1 = unk1;
    };

    get numEntriesRaw() {
        return this._numEntriesRaw;
    };

    set numEntriesRaw(raw) {
        this._numEntriesRaw = raw;
    };

    get numEntries() {
        return utilService.readModifiedLebCompressedInteger(this._numEntriesRaw);
    };

    set numEntries(num) {
        this._numEntries = num;
    };

    get records() {
        return this._records;
    };

    get rawKey() {
        return this._rawKey;
    };

    set rawKey(rawKey) {
        this._rawKey = rawKey;
    };

    get fieldDefinitions() {
        if (this._records.length > 0) {
            return Object.keys(this._records[0].fields).map((fieldKey) => {
                const field = this._records[0].fields[fieldKey];

                return {
                    'name': field.name,
                    'type': field.type,
                    'offset': -1,
                    'bits': -1,
                    'maxValue': -1
                }
            })
        }
    };
};

module.exports = TDB2Table;