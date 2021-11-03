const leb = require('leb');
// const debug = require('debug')('mft');
const stream = require('stream');
const Parser = require('stream-parser');

const Field = require('../filetypes/TOC/Field');
const Entry = require('../filetypes/TOC/Entry');
const TOCFile = require('../filetypes/TOC/TOCFile');
const DATA_TYPES = require('../filetypes/TOC/FieldDataTypes');

const ENCRYPTED_AND_HAS_SIGNATURE_HEX = 0x00D1CE00;
const NOT_ENCRYPTED_AND_HAS_SIGNATURE_HEX = 0x00D1CE01;

const ENCRYPTED_AND_HAS_SIGNATURE = 'ENCRYPTED_AND_HAS_SIGNATURE';
const NOT_ENCRYPTED_AND_HAS_SIGNATURE = 'NOT_ENCRYPTED_AND_HAS_SIGNATURE';

class TOCParser extends stream.Writable {
    constructor() {
        super();
        Parser(this);

        this._file = new TOCFile();
        this._currentBufferIndex = 0;
        this._bytes(4, this._onMagic);
    };

    _onMagic(buf) {
        const magic = buf.readUInt32LE(0);

        if (magic === ENCRYPTED_AND_HAS_SIGNATURE_HEX) {
            this._file.header.fileType = ENCRYPTED_AND_HAS_SIGNATURE;
            this._file.header.dataStart = 296;
        }
        else {
            this._file.header.fileType = NOT_ENCRYPTED_AND_HAS_SIGNATURE;
            this._file.header.dataStart = 556;
        }

        this._currentBufferIndex += 4;

        this._skipBytes(this._file.header.dataStart - 4, function () {
            this._currentBufferIndex += this._file.header.dataStart - 4;

            this._bytes(1, function (buf) {
                this._currentBufferIndex += 1;
                this._onEntryStart(buf, this._file, this._file._entries);
            });
        });
    };

    _onEntryStart(buf, scope, entryList) {
        const entry = new Entry(0, scope);

        switch(buf[0]) {
            case 0x81:
                entry.type = 'list';
                entryList.push(entry);

                this._parseLEB(null, function (leb) {
                    entry.leb = leb;
                    entry.startIndex = this._currentBufferIndex;
                    entry._entries = [];
                    
                    this._bytes(1, (buf) => {
                        this._currentBufferIndex += 1;
                        this._onEntryStart(buf, entry, entry._entries);
                    });
                });

                break;
            case 0x82:
                entry.type = 'normal';
                entryList.push(entry);

                this._parseLEB(null, function (leb) {
                    entry.leb = leb;
                    entry.startIndex = this._currentBufferIndex;
                    this._onEntryFields(entry);
                });

                break;
            case 0x87:
                entry.type = 'type87';
                entryList.push(entry);

                this._parseLEB(null, function (leb) {
                    entry.leb = leb;
                    entry.startIndex = this._currentBufferIndex;
                    
                    this._bytes(entry.size, function (buf1) {
                        this._currentBufferIndex += entry.size;
                        entry._type87Data = buf1;

                        this._bytes(1, function (buf2) {
                            this._currentBufferIndex += 1;
                            this._onEntryStart(buf2, entry, entryList);
                        });
                    });
                });

                break;
            case 0x8F:
                entry.type = 'type8F';
                entryList.push(entry);

                this._bytes(16, function (buf1) {
                    this._currentBufferIndex += 16;
                    entry._type8FData = buf1;

                    this._bytes(1, function (buf2) {
                        this._currentBufferIndex += 1;
                        this._onEntryStart(buf2, entry, entryList);
                    })
                });

                break;
            case 0x00:
                this._onEntryFields(entry.parent);
                break;
            default:
                // debug('ENTRY', this._currentBufferIndex.toString(16), buf[0]);
                this._skipBytes(Infinity);
        }
    };

    _parseLEB(runningBytes, cb) {
        if (!runningBytes) {
            runningBytes = Buffer.from([]);
        }
        
        if (runningBytes.length > 0 && runningBytes.slice(-1)[0] >> 7 === 0) {
            const lebEntry = leb.decodeUIntBuffer(runningBytes);
            cb.bind(this)(lebEntry);
        }
        else {
            this._bytes(1, function (buf) {
                this._currentBufferIndex += 1;
                return this._parseLEB(Buffer.concat([runningBytes, buf]), cb);
            });
        }
    };

    _readNullTerminatedString(runningBytes, cb) {
        if (!runningBytes) {
            runningBytes = Buffer.from([]);
        }

        if (runningBytes.length > 0 && runningBytes.slice(-1)[0] === 0) {
            cb.bind(this)(runningBytes.slice(0, -1).toString());
        }
        else {
            this._bytes(1, function (buf) {
                this._currentBufferIndex += 1;
                return this._readNullTerminatedString(Buffer.concat([runningBytes, buf]), cb);   
            });
        }
    };

    _onEntryFields(entry) {
        if (this._currentBufferIndex < entry.endIndex) {
            const field = new Field(this._currentBufferIndex, entry);

            this._bytes(1, function (buf) {
                this._currentBufferIndex += 1;

                field.dataType = parseDataType(buf[0]);

                if (field.dataType === DATA_TYPES.SKIP) {
                    return this._onEntryFields(entry);
                }

                this._readNullTerminatedString(null, function (name) {
                    field.name = name;
                    entry.addField(field);
        
                    switch(field.dataType) {
                        case DATA_TYPES.LIST:
                            return this._parseLEB(null, function (listSizeMeta) {
                                field.leb = listSizeMeta;
                                field.startIndex = this._currentBufferIndex;
                                this._parseList(entry, field);
                            });
                        case DATA_TYPES.STRING:
                            return this._parseLEB(null, function (stringSizeMeta) {
                                field.leb = stringSizeMeta;
                                this._parseString(entry, field);
                            });
                        case DATA_TYPES.UNSIGNED_INT:
                            return this._bytes(4, function (buf) {
                                this._currentBufferIndex += 4;
                                field.value = buf.readUInt32LE(0);
                                this._onEntryFields(entry);
                            });
                        case DATA_TYPES.UNSIGNED_LONG_LONG:
                            return this._bytes(8, function (buf) {
                                this._currentBufferIndex += 8;
                                field.value = buf.readBigUInt64LE(0);
                                this._onEntryFields(entry);
                            })
                        case DATA_TYPES.OBJECT:
                            return this._parseLEB(null, function (objectSize) {
                                field.leb = objectSize;
                                field.startIndex = this._currentBufferIndex;
                                this._parseObject(field);
                            });
                        case DATA_TYPES.ID:
                            return this._bytes(16, function (buf) {
                                this._currentBufferIndex += 16;
                                field.value = buf;
                                this._onEntryFields(entry);
                            });
                        case DATA_TYPES.BOOLEAN:
                            return this._bytes(1, function (buf) {
                                this._currentBufferIndex += 1;
                                if (buf[0] === 0x00) {
                                    field.value = false;
                                } else {
                                    field.value = true;
                                }

                                this._onEntryFields(entry);
                            });
                        case DATA_TYPES.SHA_1:
                            return this._bytes(20, function (buf) {
                                this._currentBufferIndex += 20;
                                field.value = buf;

                                this._onEntryFields(entry);
                            });
                        case DATA_TYPES.BLOB:
                            return this._parseLEB(null, function (size) {
                                field.leb = size;
                                
                                this._bytes(field.size, function (buf) {
                                    this._currentBufferIndex += field.size;
                                    field.value = buf;

                                    this._onEntryFields(entry);
                                });
                            });
                        default:
                            // debug('FIELD', this._currentBufferIndex.toString(16), buf[0])
                            this._skipBytes(Infinity);
                    }
                });
            });
        }
        else {
            let parent = entry.parent;

            while (this._currentBufferIndex >= parent.endIndex) {
                parent = parent.parent;                
            }

            if (parent instanceof Entry) {
                if (parent.type === 'list') {
                    this._bytes(1, (buf) => {
                        this._currentBufferIndex += 1;
                        this._onEntryStart(buf, parent, parent._entries);
                    });
                }
                else {
                    this._onEntryFields(parent);
                }
            }
            else {
                this._bytes(1, function (buf) {
                    this._currentBufferIndex += 1;
                    this._onEntryStart(buf, entry.parent, entry.parent._entries);
                });
            }
        }
    };

    _parseList(entry, field) {
        field._entries = [];
        field.value = field._entries;

        this._bytes(1, function (buf) {
            this._currentBufferIndex += 1;
            this._onEntryStart(buf, field, field._entries);
        });
    };

    _parseString(entry, field) {
        this._readNullTerminatedString(null, function (str) {
            field.value = str;
            this._onEntryFields(entry)
        });
    };

    _parseObject(field) {
        const entry = new Entry(0, field);
        entry.type = 'normal';
        entry.leb = field.leb;
        entry.startIndex = this._currentBufferIndex - field.name.length;

        field.value = entry;

        this._onEntryFields(entry);
    };

    _readLEB(runningBytes) {
        return new Promise((resolve, reject) => {
            if (!runningBytes) {
                runningBytes = Buffer.from([]);
            }
    
            if (runningBytes.length > 0 && runningBytes.slice(-1) >> 7 === 0) {
                resolve(leb.encodeUIntBuffer(runningBytes));
            }
            else {
                this._bytes(1, function (buf) {
                    this._currentBufferIndex += 1;
                    console.log('BUF', buf);
                    return this._readLEB(Buffer.concat([runningBytes, buf]));
                });
            }
        });
    };
};

module.exports = TOCParser;

function parseDataType(byte) {
    switch(byte) {
        case 0x00:
            return DATA_TYPES.SKIP;
        case 0x01:
            return DATA_TYPES.LIST;
        case 0x02:
            return DATA_TYPES.OBJECT;
        case 0x06:
            return DATA_TYPES.BOOLEAN
        case 0x07:
            return DATA_TYPES.STRING
        case 0x08:
            return DATA_TYPES.UNSIGNED_INT;
        case 0x09:
            return DATA_TYPES.UNSIGNED_LONG_LONG;
        case 0x0F:
            return DATA_TYPES.ID;
        case 0x10:
            return DATA_TYPES.SHA_1;
        case 0x13:
            return DATA_TYPES.BLOB;
        default:
            return DATA_TYPES.UNKNOWN3;
    }
};