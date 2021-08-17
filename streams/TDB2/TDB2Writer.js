const { Readable } = require('stream');

class TDB2Writer extends Readable {
    constructor(tdb2File) {
        super();
        this._file = tdb2File;

        tdb2File.tables.forEach((table) => {
            this.push(table.rawKey);
            this.push(table.numEntriesRaw);

            table.records.forEach((record) => {
                Object.keys(record.fields).map((fieldKey) => {
                    const field = record.fields[fieldKey];
                    this.push(field.rawKey);

                    if (field.type === 1) {
                        this.push(Buffer.from([field.length]));
                    }

                    this.push(field.raw);
                });
                
                this.push(Buffer.from([0x00]));
            });
        });

        this.push(null);
    }
};

module.exports = TDB2Writer;