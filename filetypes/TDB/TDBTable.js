const TDBField = require('./TDBField');
const TDBRecord = require('./TDBRecord');
const utilService = require('../../services/utilService');

const FIELD_TYPE_STRING = 0;
const FIELD_TYPE_BINARY = 1;
const FIELD_TYPE_SINT = 2;
const FIELD_TYPE_UINT = 3;
const FIELD_TYPE_FLOAT = 4;

class TDBTable {
    constructor() {
        this[Symbol.toStringTag] = 'TDBTable';

        this._name = '';
        this._header = {};
        this._fieldDefinitions = [];
        this._records = [];
        this._tableBuffer = null;
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

    get tableBuffer() {
        return this._tableBuffer;
    };

    set tableBuffer(buffer) {
        this._tableBuffer = buffer;
    };

    readRecords() {
        return new Promise((resolve, reject) => {
            let numberOfRecordsAllocatedInFile = this.header.maxRecords;

            if (this.header.dataAllocationType !== 2 && this.header.dataAllocationType !== 6) {
                numberOfRecordsAllocatedInFile = this.header.currentRecords;
            }

            let records = [];
            for (let i = 0; i < numberOfRecordsAllocatedInFile; i++) {
                let record = new TDBRecord();

                if ((i+1) > this.header.currentRecords) {
                    record.isPopulated = false;
                }

                const recordBuf = this._tableBuffer.slice((this.header.lengthBytes * i), (this.header.lengthBytes * i) + this.header.lengthBytes);
                const recordBitArray = utilService.getBitArray(recordBuf);

                let fields = {};
                for (let j = 0; j < this.fieldDefinitions.length; j++) {
                    let field = new TDBField();
                    field.definition = this.fieldDefinitions[j];

                    switch (field.definition.type) {
                        case FIELD_TYPE_STRING:
                            field.value = recordBuf.toString('utf8', (field.definition.offset/8), (field.definition.offset + field.definition.bits)/8).replace(/\0/g, '');
                            break;
                        case FIELD_TYPE_BINARY:
                            field.value = recordBuf.slice((field.definition.offset/8), (field.definition.offset + field.definition.bits)/8);
                            break;
                        case FIELD_TYPE_SINT:
                        case FIELD_TYPE_UINT:
                        case FIELD_TYPE_FLOAT:
                        default:
                            field.value = utilService.bin2dec(recordBitArray, field.definition.offset, field.definition.bits);
                            break;
                    }

                    fields[field.key] = field;
                }

                record.fields = fields;

                records.push(new Proxy(record, {
                    get: function (target, prop, receiver) {
                        if (prop in record) {
                            return record[prop];
                        }
                        else {
                            const field = record.fields[prop];

                            if (field) {
                                return field.value;
                            }
                            else {
                                return null;
                            }
                        }
                    },
                    set: function (target, prop, receiver) {
                        if (prop in record) {
                            return record[prop];
                        }
                        else {
                            const field = record.fields[prop];
                            if (!field) { return; }
                            field.value = receiver;
                            target.isChanged = true;
                        }
                    }
                }));
            }

            this.records = records;
            resolve(records);
        });
    };
};

module.exports = TDBTable;