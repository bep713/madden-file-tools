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
    deepCopyRecord(record = null, cache = new WeakMap()) {
        // If this is the highest level call, initialize record to the current record
        if(record === null)
        {
            record = this;
        }
        
        if (typeof record !== 'object') {
            return record;
        }

        // Handle Buffer objects (used in TDB2Field.raw)
        if (record instanceof Buffer) {
            return Buffer.from(record);
        }

        // Handle circular references
        if (cache.has(record)) {
            return cache.get(record);
        }

        // Create new instance with proper prototype
        const proto = Object.getPrototypeOf(record);
        const copy = Object.create(proto);
        cache.set(record, copy);

        // Copy all property descriptors
        const descriptors = Object.getOwnPropertyDescriptors(record);
        for (const [key, descriptor] of Object.entries(descriptors)) {
            const newDescriptor = { ...descriptor };
            if ('value' in descriptor) {
                newDescriptor.value = this.deepCopyRecord(descriptor.value, cache);
            }
            Object.defineProperty(copy, key, newDescriptor);
        }

        // Re-apply Proxy if it's a TDB2Record
        if (record instanceof TDB2Record) {
            return new Proxy(copy, {
                get: function (target, prop, receiver) {
                    return target.fields[prop] !== undefined ? target.fields[prop].value : target[prop] !== undefined ? target[prop] : null;
                },
                set: function (target, prop, receiver) {
                    if (target.fields[prop] !== undefined) {
                        target.fields[prop].value = receiver;
                    } else {
                        target[prop] = receiver;
                    }
                    return true;
                }
            });
        }

        return copy;
    }
};

module.exports = TDB2Record;