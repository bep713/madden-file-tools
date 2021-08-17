const { Readable } = require('stream');
const CRC = require('../services/CRC');
const utilService = require('../services/utilService');
const TDBExtraDataField = require('../filetypes/TDB/TDBExtraDataField');

const BIG_ENDIAN = 1;
const LITTLE_ENDIAN = 0;

class TDBWriter extends Readable {
    constructor(tdbFile) {
        super();
        this._tdbFile = tdbFile;
        this._endian = tdbFile.header.endian;

        this._writeUInt32 = (data, offset, buf) => {
            if (this._endian === LITTLE_ENDIAN) {
                buf.writeUInt32LE(data, offset)
            }
            else {
                buf.writeUInt32BE(data, offset);
            }
        };

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
                    this._writeUInt32(priorCrc, 0, this._tdbFile.eofCrcBuffer);
                }
                else {
                    const nextTable = this._tdbFile.tables[index+1];
                    this._writeUInt32(priorCrc, 0, nextTable.headerBuffer);
                }

                if (table.header.dataAllocationType === 34 || table.header.dataAllocationType === 66) {
                    let buffers = [];
                    buffers.push(table.dataBuffer.slice(0, table.extraDataBufferOffset));

                    if (table.huffmanTreeBuffer) {
                        buffers.push(table.huffmanTreeBuffer);
                    }
                    
                    let runningOffset = 0;

                    table.records.forEach((record) => {
                        Object.keys(record.fields).filter((key) => {
                            return record.fields[key] instanceof TDBExtraDataField;
                        }).forEach((key) => {
                            const field = record.fields[key];
                            const fieldOriginallyHadData = field.offset !== 0xFFFFFFFF;
                            const hasData = field.extraDataBuffer;
                            
                            if (runningOffset === 0) {
                                if (fieldOriginallyHadData) {
                                    runningOffset = field.offset;
                                }
                                else {
                                    field.offset = 0;
                                }
                            }
                            else {
                                if (hasData) {
                                    field.offset = runningOffset;
                                }
                            }

                            if (field.extraDataBuffer) {
                                buffers.push(field.extraDataBuffer);
                                runningOffset += field.extraDataBuffer.length;
                            }
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

                this._writeUInt32(definition.offset, index*8 + 4, this._tdbFile.definitionBuffer);

                const table = this._tdbFile.tables.find((table) => {
                    return table.name === definition.name;
                });

                if (table.dataBuffer) {
                    let size = table.headerBuffer.length + table.fieldDefinitionBuffer.length + table.dataBuffer.length;

                    if (table.indexBuffer) {
                        size += table.indexBuffer.length;
                    }
                    
                    if (size !== expectedSize) {
                        runningOffsetAdjustmentAmount += size - expectedSize;
                    }
                }
            }
            else {
                definition.offset += runningOffsetAdjustmentAmount;
                this._writeUInt32(definition.offset, index*8 + 4, this._tdbFile.definitionBuffer);

                const expectedSize = tdbFile.header.dbSize - tdbFile.headerBuffer.length - tdbFile.definitionBuffer.length - definition.offset - 4;

                const table = this._tdbFile.tables.find((table) => {
                    return table.name === definition.name;
                });

                if (table.dataBuffer) {
                    let size = table.headerBuffer.length + table.fieldDefinitionBuffer.length + table.dataBuffer.length;

                    if (table.indexBuffer) {
                        size += table.indexBuffer.length;
                    }
                    
                    if (size !== expectedSize) {
                        runningOffsetAdjustmentAmount += size - expectedSize;
                    }
                }
            }
        });

        tdbFile.header.dbSize += runningOffsetAdjustmentAmount;
        this._writeUInt32(tdbFile.header.dbSize, 8, tdbFile.headerBuffer);
        
        // calculate file header checksum
        tdbFile.header.unknown2 = utilService.toUint32(~crc.crc32_be(0, this._tdbFile.headerBuffer.slice(0, 0x14), 0x14));
        this._writeUInt32(tdbFile.header.unknown2, 0x14, tdbFile.headerBuffer);

        // calculate first table header prior CRC
        this._tdbFile.tables[0].header.priorCRC = utilService.toUint32(~crc.crc32_be(0, this._tdbFile.definitionBuffer, this._tdbFile.definitionBuffer.length));
        this._writeUInt32(this._tdbFile.tables[0].header.priorCRC, 0, this._tdbFile.tables[0].headerBuffer);


        this.push(this._tdbFile.headerBuffer);
        this.push(this._tdbFile.definitionBuffer);

        this._tdbFile.tables.forEach((table) => {
            this.push(table.headerBuffer);
            this.push(table.fieldDefinitionBuffer);

            if (table.dataBuffer) {
                this.push(table.dataBuffer);
            }

            if (table.indexBuffer) {
                this.push(table.indexBuffer);
            }
        });

        this.push(this._tdbFile.eofCrcBuffer);
        this.push(null);
    };
};

module.exports = TDBWriter;