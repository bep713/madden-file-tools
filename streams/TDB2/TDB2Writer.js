const { Readable } = require('stream');
const utilService = require('../../services/utilService');
const zlib = require('zlib');
const subTableWriter = require('./subTableWriter');

class TDB2Writer extends Readable {
    constructor(tdb2File) {
        super();
        this._file = tdb2File;

        tdb2File.tables.forEach((table) => {
            this.push(table.rawKey);
            if(table.type === 5) {
                this.push(Buffer.from([table.unknown2]));
            }
            this.push(table.numEntriesRaw);

            table.records.forEach((record) => {
                // Write the record index for visuals table (type 5)
                if(table.type === 5)
                {
                    this.push(utilService.writeModifiedLebCompressedInteger(record.index));
                }
                
                if(table.unknown2 !== 0x2)
                {
                    Object.keys(record.fields).map((fieldKey) => {
                        const field = record.fields[fieldKey];
                        this.push(field.rawKey);

                        if (field.type === 1) {
                            this.push(utilService.writeModifiedLebCompressedInteger(field.length));
                        }

                        if(field.type !== 4)
                        {
                            this.push(field.raw);
                        }
                        else
                        {
                            this.push(Buffer.from([field.value.unknown1]));
                            this.push(field.value.numEntriesRaw);
                            this.push(subTableWriter.write(field.value));
                        }
                    });
                    
                    this.push(Buffer.from([0x00]));
                }
                else
                {
                    const decompressedBufs = [];

                    decompressedBufs.push(Buffer.from(utilService.compress6BitString("CHVI")));

                    decompressedBufs.push(Buffer.from([0x03]));

                    Object.keys(record.fields).map((fieldKey) => {
                        const field = record.fields[fieldKey];
                        decompressedBufs.push(field.rawKey);

                        if (field.type === 1) {
                            decompressedBufs.push(utilService.writeModifiedLebCompressedInteger(field.length));
                        }

                        if(field.type !== 4)
                        {
                            decompressedBufs.push(field.raw);
                        }
                        else
                        {
                            decompressedBufs.push(Buffer.from([field.value.unknown1]));
                            decompressedBufs.push(field.value.numEntriesRaw);
                            decompressedBufs.push(subTableWriter.write(field.value));
                        }
                    });
                    
                    decompressedBufs.push(Buffer.from([0x00]));

                    const compressedBuf = zlib.gzipSync(Buffer.concat(decompressedBufs));

                    this.push(utilService.writeModifiedLebCompressedInteger(compressedBuf.length));
                    this.push(compressedBuf);
                }
            });
        });

        this.push(null);
    }

    _read() {
        // No-op: all data is pushed in the constructor
    }
};

module.exports = TDB2Writer;