const TDB2File = require('../../filetypes/TDB2/TDB2File');
const utilService = require('../../services/utilService');
const TDB2Table = require('../../filetypes/TDB2/TDB2Table');
const TDB2Record = require('../../filetypes/TDB2/TDB2Record');
const TDB2Field = require('../../filetypes/TDB2/TDB2Field');
const FileParser = require('../../filetypes/abstract/FileParser');

const FIELD_TYPE_INT = 0;
const FIELD_TYPE_STRING = 1;
const FIELD_TYPE_FLOAT = 10;

class TDB2Parser extends FileParser {
    constructor() {
        super();
        this.file = new TDB2File();
        this.bytes(0x5, this._onTableStart);
    };

    _onTableStart(buf) {
        let table = new TDB2Table();
        table.offset = this.currentBufferIndex - 5;
        table.rawKey = buf.slice(0, 5)
        table.name = utilService.getUncompressedTextFromSixBitCompression(buf.slice(0, 3));
        table.type = buf.readUInt8(3);
        table.unknown1 = buf.readUInt8(4);

        this.bytes(0x1, function (buf) {
            this._readLebNumber(buf, (numEntriesBuf) => {
                table.numEntriesRaw = numEntriesBuf;
                this._onTableRecordStart(table);
            });
        });
    };

    _onTableRecordStart(table) {
        let record = new TDB2Record();
        record.index = table.records.length;
        this._onTableFieldStart(record, table);
    };

    _onTableFieldStart(record, table, startTableBuf) {
        const bytesToRead = startTableBuf ? 0x5 - (startTableBuf.length) : 0x5;
        this.bytes(bytesToRead, (tableKeyBuf) => {
            if (startTableBuf) {
                tableKeyBuf = Buffer.concat([startTableBuf, tableKeyBuf]);
            }
            
            let field = new TDB2Field();
            field.rawKey = tableKeyBuf.slice(0, 4);
            field.key = utilService.getUncompressedTextFromSixBitCompression(tableKeyBuf.slice(0, 3));
            field.type = tableKeyBuf.readUInt8(3);

            switch (field.type) {
                case FIELD_TYPE_INT:
                    return this._readLebNumber(tableKeyBuf.slice(4), (fieldBuffer) => {
                        field.raw = fieldBuffer;
                        record.fields[field.key] = field;

                        this._checkTableRecordEnd(record, table);
                    });
                case FIELD_TYPE_STRING:
                    field.length = tableKeyBuf.slice(4).readUInt8(0);
                    return this.bytes(field.length, (strBuf) => {
                        field.raw = strBuf;
                        record.fields[field.key] = field;

                        this._checkTableRecordEnd(record, table);
                    });
                case FIELD_TYPE_FLOAT:
                    return this.bytes(0x3, (restOfFloatBuf) => {
                        const fieldBuffer = Buffer.concat([tableKeyBuf.slice(4), restOfFloatBuf])
                        field.raw = fieldBuffer;
                        record.fields[field.key] = field;

                        this._checkTableRecordEnd(record, table);
                    });
                default:
                    console.warn(`Unsupported field type: 0x${field.type.toString(16)} at index 0x${this.currentBufferIndex.toString(16)}`);
            }
        });
    };

    _checkTableRecordEnd(record, table) {
        this.bytes(0x1, (buf) => {
            if (buf.readUInt8(0) === 0x0) {
                table.records.push(new Proxy(record, {
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

                this._checkTableEnd(table);
            }
            else {
                this._onTableFieldStart(record, table, buf);
            }
        });
    };

    _checkTableEnd(table) {
        if (table.records.length === table.numEntries) {
            this.file.addTable(table);
            this.bytes(0x5, this._onTableStart);
        }
        else {
            this._onTableRecordStart(table);
        }
    };

    _readLebNumber(buf, cb) {
        const latestValue = buf.readUInt8(buf.length - 1);

        if (latestValue >= 0x80) {
            this.bytes(0x1, function (buf2) {
                return this._readLebNumber(Buffer.concat([buf, buf2]), cb);
            });
        }
        else {
            cb(buf);
        }
    };
};

module.exports = TDB2Parser;