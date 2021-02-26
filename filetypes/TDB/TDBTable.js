const TDBField = require('./TDBField');
const TDBRecord = require('./TDBRecord');
const { BitView } = require('bit-buffer');
const utilService = require('../../services/utilService');

class TDBTable {
    constructor() {
        this[Symbol.toStringTag] = 'TDBTable';

        this._name = '';
        this._header = {};
        this._fieldDefinitions = [];
        this._records = [];
        this._headerBuffer = null;
        this._fieldDefinitionBuffer = null;
        this._dataBuffer = null;
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

    get dataBuffer() {
        return this._dataBuffer;
    };

    set dataBuffer(buffer) {
        this._dataBuffer = buffer;
    };

    get headerBuffer() {
        return this._headerBuffer;
    };

    set headerBuffer(buffer) {
        this._headerBuffer = buffer;
    };

    get fieldDefinitionBuffer() {
        return this._fieldDefinitionBuffer;
    };

    set fieldDefinitionBuffer(buffer) {
        this._fieldDefinitionBuffer = buffer;
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

                const recordBuf = this._dataBuffer.slice((this.header.lengthBytes * i), (this.header.lengthBytes * i) + this.header.lengthBytes);
                record.recordBuffer = recordBuf;

                const recordBitArray = new BitView(recordBuf, recordBuf.byteOffset);
                recordBitArray.bigEndian = true;

                for (let j = 0; j < this.fieldDefinitions.length; j++) {
                    let field = new TDBField();
                    field.definition = this.fieldDefinitions[j];
                    field.raw = recordBuf;
                    field.rawBits = recordBitArray;

                    field.isChanged = false;
                    record.fields[field.name] = field;
                }
                
                records.push(new Proxy(record, {
                    get: function (target, prop, receiver) {
                        return record.fields[prop] !== undefined ? record.fields[prop].value : record[prop] !== undefined ? record[prop] : null;
                    },
                    set: function (target, prop, receiver) {
                        if (record.fields[prop] !== undefined) {
                            record.fields[prop].value = receiver;
                        }
                        else {
                            record[prop] = receiver;
                        }

                        return true;
                    }
                }));
            }

            this.records = records;
            resolve(records);
        });
    };
};

module.exports = TDBTable;