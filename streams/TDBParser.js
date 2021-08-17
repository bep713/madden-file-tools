const TDBFile = require('../filetypes/TDB/TDBFile');
const TDBField = require('../filetypes/TDB/TDBField');
const TDBTable = require('../filetypes/TDB/TDBTable');
const utilService = require('../services/utilService');
const TDBRecord = require('../filetypes/TDB/TDBRecord');
const FileParser = require('../filetypes/abstract/FileParser');

const LITTLE_ENDIAN = 0;
const BIG_ENDIAN = 1;

class TDBParser extends FileParser {
    constructor() {
        super();
        this.file = new TDBFile();

        this._readUInt8 = (offset, buf) => {
            return buf.readUInt8(offset);
        };

        this._readUInt16 = null;
        this._readUInt32 = null;
        this.bytes(0x18, this._onHeader);
    };

    _onHeader(buf) {
        let header = {
            'digit': buf.readUInt16BE(0),
            'version': buf.readUInt16BE(2),
            'endian': buf.readUInt8(4), 
        }

        if (header.endian === LITTLE_ENDIAN) {
            this._readUInt16 = (offset, buf) => {
                return buf.readUInt16LE(offset);
            }
            
            this._readUInt32 = (offset, buf) => {
                return buf.readUInt32LE(offset);
            }
        }
        else {
            this._readUInt16 = (offset, buf) => {
                return buf.readUInt16BE(offset);
            }
            
            this._readUInt32 = (offset, buf) => {
                return buf.readUInt32BE(offset);
            }
        }

        header['unknown1'] = this._readUInt8(5, buf),
        header['unknown2'] = this._readUInt16(6, buf),
        header['dbSize'] = this._readUInt32(8, buf),
        header['zero'] = this._readUInt32(12, buf),
        header['numTables'] = this._readUInt32(16, buf),
        header['unknown3'] = this._readUInt32(20, buf)

        this.file.header = header;
        this.file.headerBuffer = buf;

        this.bytes((header.numTables * 0x8), this._onDefinitions);
    };

    _onDefinitions(buf) {
        let definitions = [];
        let unknownTableCount = 0;

        for (let i = 0; i < this.file.header.numTables; i++) {
            const nameIndex = i*8;
            const offsetIndex = (i*8)+4;

            const nameRaw = this._readUInt32(nameIndex, buf);
            let name;
            
            if (nameRaw >= 65536) {
                if (this.file.header.endian === BIG_ENDIAN) {
                    const nameBackwards = buf.toString('utf8', nameIndex, offsetIndex);
                    name = reverseString(nameBackwards);
                }
                else {
                    name = buf.toString('utf8', nameIndex, offsetIndex);
                }
            }
            else {
                name = `Unk${unknownTableCount}`;
                unknownTableCount += 1;
            }

            definitions.push({
                'name': name,
                'offset': this._readUInt32(offsetIndex, buf),
            });
        }

        definitions.sort((a, b) => {
            return a.offset - b.offset;
        });

        this.file.definitions = definitions;
        this.file.definitionBuffer = buf;
        this.tableDataStart = this.currentBufferIndex;

        this.bytes(0x28, this._onTableHeader);
    };

    _onTableHeader(buf) {
        const table = new TDBTable();
        table.endian = this.file.header.endian;

        const tableOffset = this.currentBufferIndex - (this.tableDataStart + 0x28);
        const tableDefinition = this.file.definitions.find((def) => {
            return def.offset === tableOffset;
        });

        if(!tableDefinition) {
            console.warn(`Expected table at offset ${tableOffset}, but none exists in table definitions.`);
        }

        table.name = tableDefinition.name;
        table.offset = tableDefinition.offset;
        table.headerBuffer = buf;

        table.header = {
            'priorCrc': this._readUInt32(0, buf),
            'dataAllocationType': this._readUInt32(4, buf),
            'lengthBytes': this._readUInt32(8, buf),
            'lengthBits': this._readUInt32(12, buf),
            'zero': this._readUInt32(16, buf),
            'maxRecords': this._readUInt16(20, buf),
            'currentRecords': this._readUInt16(22, buf),
            'unknown2': this._readUInt32(24, buf),
            'numFields': buf.readUInt8(28),
            'indexCount': buf.readUInt8(29),
            'zero2': this._readUInt16(30, buf),
            'zero3': this._readUInt32(32, buf),
            'headerCrc': this._readUInt32(36, buf)
        };

        this.bytes(table.header.numFields * 0x10, (buf) => {
            this._onTableFieldDefinitions(buf, table);
        });
    };

    _onTableFieldDefinitions(buf, table) {
        const fieldDefinitions = [];

        for (let i = 0; i < table.header.numFields; i++) {
            let definition = {
                'type': this._readUInt32(i*0x10, buf),
                'offset': this._readUInt32((i*0x10) + 4, buf),
                'name': this.file.header.endian === BIG_ENDIAN ? reverseString(buf.toString('utf8', (i*0x10) + 8, (i*0x10) + 12)) : buf.toString('utf8', (i*0x10) + 8, (i*0x10) + 12),
                'bits': this._readUInt32((i*0x10) + 12, buf),
            };

            if (definition.type === 0) {
                // string
                definition.maxLength = definition.bits / 8;
                definition.maxValue = definition.maxLength;
            }
            else {
                definition.maxValue = Math.pow(2, definition.bits) -1;
            }

            fieldDefinitions.push(definition);
        }

        table.fieldDefinitions = fieldDefinitions;
        table.fieldDefinitionBuffer = buf;

        let numberOfBytesToReadNext = table.header.lengthBytes * table.header.currentRecords;

        switch(table.header.dataAllocationType) {
            case 2:
            case 6:
            case 10:
            case 14:
                numberOfBytesToReadNext = table.header.lengthBytes * table.header.maxRecords;
                break;
            case 34:
            case 66:
                const currentTableDefinitionIndex = this.file.definitions.findIndex((definition) => {
                    return definition.offset === table.offset;
                });

                let nextTableOffset;
                
                if (this.file.definitions.length > currentTableDefinitionIndex + 1) {
                    nextTableOffset = this.file.definitions[currentTableDefinitionIndex + 1].offset;
                    numberOfBytesToReadNext = (nextTableOffset + this.tableDataStart) - this.currentBufferIndex;
                }
                else {
                    // the current table is the last table or only table
                    nextTableOffset = this.file.header.dbSize - 4;
                    numberOfBytesToReadNext = nextTableOffset - this.currentBufferIndex;
                }

                break;
            default:
                break;
        }

        if (numberOfBytesToReadNext > 0) {
            this.bytes(numberOfBytesToReadNext, (buf) => {
                this._onTableRecords(buf, table);
            });
        }
        else {
            this._onTableComplete(table);
        }
    };

    _onTableRecords(buf, table) {
        table.dataBuffer = buf;

        if (table.header.indexCount > 0) {
            this.bytes(0x10 * table.header.indexCount, (buf) => {
                this._onTableIndexes(buf, table);
            });
        }
        else {
            this._onTableComplete(table);
        }
    };
    
    _onTableIndexes(buf, table) {
        table.indexBuffer = buf;
        this._onTableComplete(table);
    };

    _onTableComplete(table) {
        this.file.addTable(table);
        this.emit('table', table);

        if (this.file.tables.length === this.file.header.numTables) {
            this.bytes(0x4, this._onEofCrc);
        }
        else {
            this.bytes(0x28, this._onTableHeader);
        }
    };

    _onEofCrc(buf) {
        this.file.eofCrcBuffer = buf;
        this.skipBytes(Infinity);
    };
};

module.exports = TDBParser;

function reverseString(str) {
    return str.split('').reverse().join('');
};