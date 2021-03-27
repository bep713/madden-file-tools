const TDBFile = require('../filetypes/TDB/TDBFile');
const TDBField = require('../filetypes/TDB/TDBField');
const TDBTable = require('../filetypes/TDB/TDBTable');
const utilService = require('../services/utilService');
const TDBRecord = require('../filetypes/TDB/TDBRecord');
const FileParser = require('../filetypes/abstract/FileParser');

class TDBParser extends FileParser {
    constructor() {
        super();
        this.file = new TDBFile();
        this.bytes(0x18, this._onHeader);
    };

    _onHeader(buf) {
        const header = {
            'digit': buf.readUInt16BE(0),
            'version': buf.readUInt16BE(2),
            'unknown1': buf.readUInt32BE(4),
            'dbSize': buf.readUInt32BE(8),
            'zero': buf.readUInt32BE(12),
            'numTables': buf.readUInt32BE(16),
            'unknown2': buf.readUInt32BE(20)
        }

        this.file.header = header;
        this.file.headerBuffer = buf;

        this.bytes((header.numTables * 0x8), this._onDefinitions);
    };

    _onDefinitions(buf) {
        let definitions = [];

        for (let i = 0; i < this.file.header.numTables; i++) {
            const nameIndex = i*8;
            const offsetIndex = (i*8)+4;

            const nameBackwards = buf.toString('utf8', nameIndex, offsetIndex);
            const name = reverseString(nameBackwards);

            definitions.push({
                'name': name,
                'offset': buf.readUInt32BE(offsetIndex),
            });
        }

        definitions.sort((a, b) => {
            return a.offset - b.offset;
        })

        this.file.definitions = definitions;
        this.file.definitionBuffer = buf;
        this.tableDataStart = this.currentBufferIndex;

        this.bytes(0x28, this._onTableHeader);
    };

    _onTableHeader(buf) {
        const table = new TDBTable();

        const tableOffset = this.currentBufferIndex - (this.tableDataStart + 0x28);
        const tableDefinition = this.file.definitions.find((def) => {
            return def.offset === tableOffset;
        });

        if(!tableDefinition) {
            console.log(tableOffset);
        }

        table.name = tableDefinition.name;
        table.offset = tableDefinition.offset;
        table.headerBuffer = buf;

        table.header = {
            'priorCrc': buf.readUInt32BE(0),
            'dataAllocationType': buf.readUInt32BE(4),
            'lengthBytes': buf.readUInt32BE(8),
            'lengthBits': buf.readUInt32BE(12),
            'zero': buf.readUInt32BE(16),
            'maxRecords': buf.readUInt16BE(20),
            'currentRecords': buf.readUInt16BE(22),
            'unknown2': buf.readUInt32BE(24),
            'numFields': buf.readUInt8(28),
            'indexCount': buf.readUInt8(29),
            'zero2': buf.readUInt16BE(30),
            'zero3': buf.readUInt32BE(32),
            'headerCrc': buf.readUInt32BE(36)
        };

        this.bytes(table.header.numFields * 0x10, (buf) => {
            this._onTableFieldDefinitions(buf, table);
        });
    };

    _onTableFieldDefinitions(buf, table) {
        const fieldDefinitions = [];

        for (let i = 0; i < table.header.numFields; i++) {
            fieldDefinitions.push({
                'type': buf.readUInt32BE(i*0x10),
                'offset': buf.readUInt32BE((i*0x10) + 4),
                'name': reverseString(buf.toString('utf8', (i*0x10) + 8, (i*0x10) + 12)),
                'bits': buf.readUInt32BE((i*0x10) + 12)
            });
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
            case 66:
                const currentTableDefinitionIndex = this.file.definitions.findIndex((definition) => {
                    return definition.offset === table.offset;
                });

                const nextTableOffset = this.file.definitions[currentTableDefinitionIndex + 1].offset;
                numberOfBytesToReadNext = (nextTableOffset + this.tableDataStart) - this.currentBufferIndex;
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