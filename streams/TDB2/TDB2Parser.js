const TDB2File = require('../../filetypes/TDB2/TDB2File');
const utilService = require('../../services/utilService');
const TDB2Table = require('../../filetypes/TDB2/TDB2Table');
const TDB2Record = require('../../filetypes/TDB2/TDB2Record');
const TDB2Field = require('../../filetypes/TDB2/TDB2Field');
const FileParser = require('../../filetypes/abstract/FileParser');
const {SimpleParser} = require('../../filetypes/abstract/SimpleParser');
const zlib = require('zlib');

const FIELD_TYPE_INT = 0;
const FIELD_TYPE_STRING = 1;
const FIELD_TYPE_UNK = 3;
const FIELD_TYPE_SUBTABLE = 4;
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
            if(table.type === 0x5)
            {
                table.unknown2 = buf.readUInt8(0);
                this.bytes(0x1, (buf2) => {
                    this._readLebNumber(buf2, (numEntriesBuf) => {
                        table.numEntriesRaw = numEntriesBuf;
                        this._onTableRecordStart(table);
                    });
                });
            }
            else
            {
                this._readLebNumber(buf, (numEntriesBuf) => {
                    table.numEntriesRaw = numEntriesBuf;
                    this._onTableRecordStart(table);
                });
            }
        });
    };

    _getLebRecordKey(record, table) {
        this.bytes(0x1, (buf) => {
            this._readLebNumber(buf, (lebBuf) => {
                record.index = utilService.readModifiedLebCompressedInteger(lebBuf);
                if(table.unknown2 === 0x2)
                {
                    // Read LEB number for compressed byte size
                    this.bytes(0x1, (numBytesBuf) => {
                        this._readLebNumber(numBytesBuf, (lebBytesBuf) => {
                            const bytesToRead = utilService.readModifiedLebCompressedInteger(lebBytesBuf);
                            this.bytes(bytesToRead, (compressedRecordBuf) => {
                                this._onCompressedTableFieldStart(compressedRecordBuf, record, table)
                            });
                        });
                    });
                }
                else
                {
                    this._onTableFieldStart(record, table);
                }
            });
        });
    }

    _onTableRecordStart(table) {
        let record = new TDB2Record();
        record.index = table.type === 5 ? this._getLebRecordKey(record, table) : table.records.length;
        if(table.type !== 5)
            this._onTableFieldStart(record, table);
    };

    _onCompressedTableFieldStart(compressedRecordBuf, record, table, existingParser) {
        const recordParser = new SimpleParser(zlib.gunzipSync(compressedRecordBuf));
        recordParser.readBytes(4); // Skip the header bytes
        this._onDecompressedTableFieldStart(recordParser, record, table);
    };

    _onDecompressedTableFieldStart(recordParser, record, table)
    {
        let field = new TDB2Field();
        field.rawKey = recordParser.readBytes(4);
        field.key = utilService.getUncompressedTextFromSixBitCompression(field.rawKey.slice(0, 3));
        field.type = field.rawKey.slice(3).readUInt8(0);

        if (!table.fieldDefinitions.find((f) => f.name === field.key)) {
            const newFieldDef = {
                'name': field.key,
                'type': field.type,
                'offset': -1,
                'bits': -1,
                'maxValue': -1
            }

            table.fieldDefinitions.push(newFieldDef);
        }

        switch (field.type) {
            case FIELD_TYPE_INT:
                field.raw = utilService.writeModifiedLebCompressedInteger(utilService.parseModifiedLebEncodedNumber(recordParser));
                record.fields[field.key] = field;
                if(field.key === 'UNWI')
                {
                    field.raw = Buffer.concat([field.raw, recordParser.readBytes(1)]);
                    record.fields[field.key] = field;
                }
                return this._checkCompressedTableRecordEnd(record, table, recordParser);
            case FIELD_TYPE_STRING:
                const strLen = utilService.parseModifiedLebEncodedNumber(recordParser);
                field.length = strLen;
                field.raw = recordParser.readBytes(strLen);
                record.fields[field.key] = field;
                return this._checkCompressedTableRecordEnd(record, table, recordParser);
            case FIELD_TYPE_UNK:
                // M25 rosters decided to be weird, sometimes they have a 0 byte after this type byte, other times they don't.
                // This field type generally never appears at the end of a record, so checking this way shouldn't cause any issues
                field.raw = recordParser.buffer[recordParser.offset] === 0 ? recordParser.readBytes(1) : Buffer.alloc(0);
                record.fields[field.key] = field;
                return this._checkCompressedTableRecordEnd(record, table, recordParser);
            case FIELD_TYPE_SUBTABLE:
                // Read subtable header information
                field.value = new TDB2Table();
                field.value.offset = recordParser.offset - 4;
                field.value.rawKey = field.rawKey;
                field.value.name = field.key;
                field.value.type = field.type;
                field.value.unknown1 = recordParser.readByte().readUInt8(0);
                field.value.numEntriesRaw = utilService.writeModifiedLebCompressedInteger(utilService.parseModifiedLebEncodedNumber(recordParser));
                field.value.isSubTable = true;
                field.value.parentInfo = { parentRecord: record, parentField: field, parentTable: table };

                // Read subtable records
                this._readCompressedRecordSubTable(field.value, recordParser);
                record.fields[field.key] = field;
                return this._checkCompressedTableRecordEnd(record, table, recordParser);
            case FIELD_TYPE_FLOAT:
                field.raw = recordParser.readBytes(4);
                record.fields[field.key] = field;
                return this._checkCompressedTableRecordEnd(record, table, recordParser);
            default:
                console.warn(`Unsupported field type: 0x${field.type.toString(16)} at index 0x${this.currentBufferIndex.toString(16)}`);
        }
    };

    _readCompressedRecordSubTable(table, recordParser)
    {
        for(let i = 0; i < table.numEntries; i++)
        {
            let record = new TDB2Record();
            record.index = i;
            while(recordParser.buffer.readUInt8(recordParser.offset) !== 0x0)
            {
                let field = new TDB2Field();
                field.rawKey = recordParser.readBytes(4);
                field.key = utilService.getUncompressedTextFromSixBitCompression(field.rawKey.slice(0, 3));
                field.type = field.rawKey.slice(3).readUInt8(0);

                if (!table.fieldDefinitions.find((f) => f.name === field.key)) {
                    const newFieldDef = {
                        'name': field.key,
                        'type': field.type,
                        'offset': -1,
                        'bits': -1,
                        'maxValue': -1
                    }
    
                    table.fieldDefinitions.push(newFieldDef);
                }

                switch (field.type) {
                    case FIELD_TYPE_INT:
                        field.raw = utilService.writeModifiedLebCompressedInteger(utilService.parseModifiedLebEncodedNumber(recordParser));
                        record.fields[field.key] = field;
                        break;
                    case FIELD_TYPE_STRING:
                        const strLen = utilService.parseModifiedLebEncodedNumber(recordParser);
                        field.length = strLen;
                        field.raw = recordParser.readBytes(strLen);
                        record.fields[field.key] = field;
                        break;
                    case FIELD_TYPE_UNK:
                        field.raw = Buffer.alloc(0);
                        record.fields[field.key] = field;
                        break;
                    case FIELD_TYPE_SUBTABLE:
                        field.value = new TDB2Table();
                        field.value.offset = recordParser.offset - 4;
                        field.value.rawKey = field.rawKey;
                        field.value.name = field.key;
                        field.value.type = field.type;
                        field.value.unknown1 = recordParser.readByte().readUInt8(0);
                        field.value.numEntriesRaw = utilService.writeModifiedLebCompressedInteger(utilService.parseModifiedLebEncodedNumber(recordParser));
                        field.value.isSubTable = true;
                        field.value.parentInfo = { parentRecord: record, parentField: field, parentTable: table };
                        record.fields[field.key] = field;
                        this._readCompressedRecordSubTable(field.value, recordParser);
                        break;
                    case FIELD_TYPE_FLOAT:
                        field.raw = recordParser.readBytes(4);
                        record.fields[field.key] = field;
                        break;
                    default:
                        console.warn(`Unsupported field type found in subtable at index 0x${recordParser.offset.toString(16)}`);
                }
            }

            this._pushTableRecord(record, table);

            recordParser.readBytes(1);
        }
    }

    _checkCompressedTableRecordEnd(record, table, recordParser)
    {
        if (recordParser.buffer.readUInt8(recordParser.offset) === 0x0) {
            this._pushTableRecord(record, table);

            recordParser.readBytes(1);

            this._checkTableEnd(table);
        }
        else {
            this._onDecompressedTableFieldStart(recordParser, record, table);
        }
    }

    _pushTableRecord(record, table)
    {
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

            if (!table.fieldDefinitions.find((f) => f.name === field.key)) {
                const newFieldDef = {
                    'name': field.key,
                    'type': field.type,
                    'offset': -1,
                    'bits': -1,
                    'maxValue': -1
                }

                table.fieldDefinitions.push(newFieldDef);
            }

            switch (field.type) {
                case FIELD_TYPE_INT:
                    return this._readLebNumber(tableKeyBuf.slice(4), (fieldBuffer) => {
                        field.raw = fieldBuffer;
                        record.fields[field.key] = field;

                        // UNWI has an extra zero for some reason
                        if(field.key === 'UNWI')
                        {
                            this.bytes(0x1, (buf) => {
                                field.raw = Buffer.concat([fieldBuffer, buf]);
                                record.fields[field.key] = field;
                                this._checkTableRecordEnd(record, table);
                            });
                        }
                        else
                        {
                            this._checkTableRecordEnd(record, table);
                        }
                    });
                case FIELD_TYPE_STRING:
                        const firstNumByte = tableKeyBuf.slice(4);
                        // If the first byte is 0x80 or higher, we need to use different logic
                        if (firstNumByte.readUInt8(0) >= 0x80) {
                            return this.bytes(0x1, (buf) => {
                                this._readLebNumber(Buffer.concat([tableKeyBuf.slice(4), buf]), (strLenBuf) => {
                                    const strLen = utilService.readModifiedLebCompressedInteger(strLenBuf);
                                    field.length = strLen;
                                    this.bytes(strLen, (strBuf) => {
                                        field.raw = strBuf;
                                        record.fields[field.key] = field;
                                        this._checkTableRecordEnd(record, table);
                                    });
                                });
                            });
                        }
                        else {
                            const strLen = firstNumByte.readUInt8(0);
                            field.length = strLen;
                            return this.bytes(strLen, (strBuf) => {
                                field.raw = strBuf;
                                record.fields[field.key] = field;
                                this._checkTableRecordEnd(record, table);
                            });
                        }
                case FIELD_TYPE_UNK:
                    return this.bytes(0x1, (buf) => {
                       const excessBuf = Buffer.concat([tableKeyBuf.slice(4), buf]);
                       field.raw = Buffer.alloc(0);
                       record.fields[field.key] = field;
                       
                       this._onTableFieldStart(record, table, excessBuf);
                    });
                case FIELD_TYPE_SUBTABLE:
                    return this.bytes(0x1, (buf) => {
                        field.value = new TDB2Table();
                        field.value.offset = this.currentBufferIndex - 6;
                        field.value.rawKey = field.rawKey;
                        field.value.name = field.key;
                        field.value.type = field.type;
                        field.value.unknown1 = tableKeyBuf.readUInt8(4);
                        this._readLebNumber(buf, (numEntriesBuf) => {
                            field.value.numEntriesRaw = numEntriesBuf;
                            field.value.isSubTable = true;
                            field.value.parentInfo = { parentRecord: record, parentField: field, parentTable: table };
                            record.fields[field.key] = field;
                            
                            this._onTableRecordStart(field.value);
                        });
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
                this._pushTableRecord(record, table);

                this._checkTableEnd(table);
            }
            else {
                this._onTableFieldStart(record, table, buf);
            }
        });
    };

    _normalizeRecords(table) {
        // Iterate through the records and add any missing fields that are present in some records but not all
        for (let i = 0; i < table.records.length; i++) {
            const record = table.records[i];
            for (let key in table.fieldDefinitions) {
                const fieldDef = table.fieldDefinitions[key];
                if (!record.fields.hasOwnProperty(fieldDef.name)) {
                    // Skip subtables as they could become a little tricky and don't really need this right now
                    if(fieldDef.type === FIELD_TYPE_SUBTABLE)
                    {
                        continue;
                    }

                    const newField = new TDB2Field();

                    newField.key = fieldDef.name;
                    newField.type = fieldDef.type;
                    newField.rawKey = Buffer.from([...utilService.compress6BitString(fieldDef.name), fieldDef.type]);

                    // Set default values for the field based on type
                    switch (fieldDef.type) {
                        case FIELD_TYPE_INT:
                            newField.value = 0;
                            break;
                        case FIELD_TYPE_STRING:
                            newField.value = '';
                            break;
                        case FIELD_TYPE_UNK:
                            newField.raw = Buffer.from([0x0]);
                            break;
                        case FIELD_TYPE_FLOAT:
                            newField.value = 0.0;
                            break;
                        default:
                            console.warn(`Unsupported field type: 0x${fieldDef.type.toString(16)}`);
                    }

                    // It's not really changed since this is being done while reading
                    newField.isChanged = false;
                    
                    record.fields[fieldDef.name] = newField;
                }
            }
        }
    }

    _checkTableEnd(table) {
        if (table.records.length === table.numEntries) {
            if(table.isSubTable)
            {
                const parentField = table.parentInfo.parentField;
                const parentRecord = table.parentInfo.parentRecord;
                const parentTable = table.parentInfo.parentTable;

                // Remove the parent info from the table
                delete table.parentInfo;

                parentField.value = table;
                this._checkTableRecordEnd(parentRecord, parentTable);
            }
            else
            {
                this._normalizeRecords(table);
                this.file.addTable(table);
                this.bytes(0x5, this._onTableStart);
            }
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