const TDB2Table = require('./TDB2Table');
const TDB2Field = require('./TDB2Field');

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

    // Returns a deep copy of the current record
    deepCopyRecord(record = null, cache = new WeakMap(), isTopLevel = true) {
        if (record === null) record = this;
        if (typeof record !== 'object') return record;
        if (record instanceof Buffer) return Buffer.from(record);
        if (cache.has(record)) return cache.get(record);
    
        if (record instanceof TDB2Record) {
            const copy = new TDB2Record();
            copy._fields = {};
            cache.set(record, copy);
            for (const key in record._fields) {
                copy._fields[key] = this.deepCopyRecord(record._fields[key], cache, false);
            }
            copy._index = record._index;
            if (isTopLevel) {
                return new Proxy(copy, {
                    get: function (target, prop, receiver) {
                        return target._fields[prop] !== undefined ? target._fields[prop].value : target[prop] !== undefined ? target[prop] : null;
                    },
                    set: function (target, prop, receiver) {
                        if (target._fields[prop] !== undefined) {
                            target._fields[prop].value = receiver;
                        } else {
                            target[prop] = receiver;
                        }
                        return true;
                    }
                });
            }
            return copy;
        }
    
        if (record instanceof TDB2Table) {
            const copy = new TDB2Table();
            cache.set(record, copy);
            copy._type = record._type;
            copy._name = record._name;
            copy._offset = record._offset;
            copy._unknown1 = record._unknown1;
            copy._unknown2 = record._unknown2;
            copy._records = record._records.map(r => this.deepCopyRecord(r, cache, false));
            copy._rawKey = record._rawKey;
            copy._numEntriesRaw = record._numEntriesRaw;
            copy._isSubTable = record._isSubTable;
            copy._parentInfo = record._parentInfo;
            copy._fieldDefinitions = record._fieldDefinitions;
            return copy;
        }
    
        if (record instanceof TDB2Field) {
            const copy = new TDB2Field();
            cache.set(record, copy);
            copy._key = record._key;
            copy._rawKey = record._rawKey;
            copy._type = record._type;
            copy._length = record._length;
            copy._raw = record._raw ? Buffer.from(record._raw) : null;
            copy._value = record._value ? this.deepCopyRecord(record._value, cache, false) : null;
            copy._isChanged = record._isChanged;
            return copy;
        }
    
        const proto = Object.getPrototypeOf(record);
        const copy = Object.create(proto);
        cache.set(record, copy);
        const descriptors = Object.getOwnPropertyDescriptors(record);
        for (const [key, descriptor] of Object.entries(descriptors)) {
            const newDescriptor = { ...descriptor };
            if ('value' in descriptor) {
                newDescriptor.value = this.deepCopyRecord(descriptor.value, cache, false);
            }
            Object.defineProperty(copy, key, newDescriptor);
        }
        return copy;
    }
};

module.exports = TDB2Record;