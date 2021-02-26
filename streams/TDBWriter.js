const { Readable } = require('stream');
const CRC = require('../services/CRC');
const utilService = require('../services/utilService');

class TDBWriter extends Readable {
    constructor(tdbFile) {
        super();
        this._tdbFile = tdbFile;

        this.push(this._tdbFile.headerBuffer);
        this.push(this._tdbFile.definitionBuffer);

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
            }

            this.push(table.headerBuffer);
            this.push(table.fieldDefinitionBuffer);

            if (table.dataBuffer) {
                this.push(table.dataBuffer);
            }
        });

        this.push(this._tdbFile.eofCrcBuffer);
        this.push(null);
    };
};

module.exports = TDBWriter;