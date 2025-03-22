const utilService = require('../../services/utilService');

class TDB2Table {
    constructor() {
        this._type = 4;
        this._name = '';
        this._offset = 0;
        this._unknown1 = 0;
        this._unknown2 = 0;
        this._records = [];
        this._rawKey = null;
        this._numEntriesRaw = null;
        this._isSubTable = false;
        this._parentInfo = null;
        this._fieldDefinitions = [];
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

    get unknown2() {
        return this._unknown2;
    };

    set unknown2(unk2) {
        this._unknown2 = unk2;
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
        this._numEntriesRaw = utilService.writeModifiedLebCompressedInteger(num);
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

    get isSubTable() {
        return this._isSubTable;
    }

    set isSubTable(isSubTable) {
        this._isSubTable = isSubTable;
    }

    get parentInfo() {
        return this._parentInfo;
    }

    set parentInfo(parentInfo) {
        this._parentInfo = parentInfo;
    }

    get fieldDefinitions() {
        return this._fieldDefinitions;
    };

    set fieldDefinitions(fieldDefinitions) {
        this._fieldDefinitions = fieldDefinitions;
    };

    // Adds newRecord to the table 
    addRecord(newRecord) {
        // If we're working with a keyed record table, we need to make sure the key doesn't exist already
        if (this._type === 5) {
            const newKey = newRecord.index;

            if (this._records.some(record => record.index === newKey)) {
                throw new Error('Cannot add a record to a keyed record table with a duplicate key.');
            }
        }

        // Add the record to the array
        this._records.push(newRecord);

        // Update table's entry count
        this.numEntries++;
    }

    // Removes a record from the table
    removeRecord(index) {
        // Find the record to remove (we do it this way instead of just assuming records[index] to accomodate table 5 records since their indices are keyed)
        const recordIndex = this._records.findIndex(record => record.index === index);

        // If the record is found, remove it
        if (recordIndex !== -1) {
            this._records.splice(recordIndex, 1);

            // Update table's entry count
            this.numEntries--;
        }
    }
};

module.exports = TDB2Table;