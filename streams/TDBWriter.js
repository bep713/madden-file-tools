const { Readable } = require('stream');
const TDBHuffmanField = require('../filetypes/TDB/TDBHuffmanField');
const CRC = require('../services/CRC');
const utilService = require('../services/utilService');

class TDBWriter extends Readable {
    constructor(tdbFile) {
        super();
        this._tdbFile = tdbFile;

        let crc = new CRC();

        this._tdbFile.tables.forEach((table, index) => {
            const isChanged = table.records.length > 0 && table.records.find((record) => {
                return Object.entries(record.fields).find(([key, field]) => {
                    return field.isChanged;
                });
            }) !== null;

            if (isChanged) {
                const priorCrc = utilService.toUint32(~crc.crc32_be(0, Buffer.concat([table.fieldDefinitionBuffer, table.dataBuffer]), table.fieldDefinitionBuffer.length + table.dataBuffer.length));
                const isLastTable = index === this._tdbFile.tables.length-1;

                if (isLastTable) {
                    this._tdbFile.eofCrcBuffer.writeUInt32BE(priorCrc, 0);
                }
                else {
                    const nextTable = this._tdbFile.tables[index+1];
                    nextTable.headerBuffer.writeUInt32BE(priorCrc, 0);
                }

                if (table.header.dataAllocationType === 66) {
                    let buffers = [];
                    buffers.push(table.dataBuffer.slice(0, table.huffmanBufferOffset));
                    buffers.push(table.huffmanTreeBuffer);
                    
                    let runningOffset = 0;

                    table.records.forEach((record) => {
                        Object.keys(record.fields).filter((key) => {
                            return record.fields[key] instanceof TDBHuffmanField;
                        }).map((key) => {
                            const field = record.fields[key];
                            
                            if (runningOffset === 0) {
                                runningOffset = field.offset;
                            }
                            else {
                                field.offset = runningOffset;
                            }

                            buffers.push(field.huffmanEncodedBuffer);
                            runningOffset += field.huffmanEncodedBuffer.length;
                        })
                    });

                    table.dataBuffer = Buffer.concat(buffers);
                }
            }
        });

        let runningOffsetAdjustmentAmount = 0;
        this._tdbFile.definitions.sort((a, b) => {
            return a.offset - b.offset;
        }).forEach((definition, index) => {
            if (index < this._tdbFile.definitions.length - 1) {
                
                const nextDefinition = this._tdbFile.definitions[index+1];
                const expectedSize = nextDefinition.offset - definition.offset;

                definition.offset += runningOffsetAdjustmentAmount;

                this._tdbFile.definitionBuffer.writeUInt32BE(definition.offset, index*8 + 4);

                const table = this._tdbFile.tables.find((table) => {
                    return table.name === definition.name;
                });

                if (table.dataBuffer) {
                    const size = table.headerBuffer.length + table.fieldDefinitionBuffer.length + table.dataBuffer.length;
                    
                    if (size !== expectedSize) {
                        runningOffsetAdjustmentAmount += size - expectedSize;
                    }
                }
            }
            else {
                definition.offset += runningOffsetAdjustmentAmount;
                this._tdbFile.definitionBuffer.writeUInt32BE(definition.offset, index*8 + 4);
            }
        })

        tdbFile.header.dbSize += runningOffsetAdjustmentAmount;
        tdbFile.headerBuffer.writeUInt32BE(tdbFile.header.dbSize, 8);
        
        // calculate file header checksum
        tdbFile.header.unknown2 = utilService.toUint32(~crc.crc32_be(0, this._tdbFile.headerBuffer.slice(0, 0x14), 0x14));
        tdbFile.headerBuffer.writeUInt32BE(tdbFile.header.unknown2, 0x14);

        // calculate first table header prior CRC
        this._tdbFile.tables[0].header.priorCRC = utilService.toUint32(~crc.crc32_be(0, this._tdbFile.definitionBuffer, this._tdbFile.definitionBuffer.length));
        this._tdbFile.tables[0].headerBuffer.writeUInt32BE(this._tdbFile.tables[0].header.priorCRC, 0);


        this.push(this._tdbFile.headerBuffer);
        this.push(this._tdbFile.definitionBuffer);

        this._tdbFile.tables.forEach((table) => {
            this.push(table.headerBuffer);
            this.push(table.fieldDefinitionBuffer);

            if (table.dataBuffer) {
                this.push(table.dataBuffer);
            }
        })

        this.push(this._tdbFile.eofCrcBuffer);
        this.push(null);
    };
};

module.exports = TDBWriter;