const stream = require('stream');
const ASTFile = require('../filetypes/ASTFile');
const WritableParser = require('./WritableParser');

class ASTParser extends WritableParser {
    constructor() {
        super();

        this._file = new ASTFile();
        this._idsToExtract = [];
        this._extract = true;
        
        this._bytes(0x29, this.onheader);
    };

    get extract () {
        return this._extract;
    };

    set extract (extract) {
        this._extract = extract;
    };

    extractByFileId(id) {
        if (Number.isInteger(id)) {
            id = id.toString('16');
        }

        if (Buffer.isBuffer(id)) {
            id = id.toString('hex');
        }

        id = id.toLowerCase();

        if (id.length < 8) {
            id = id.padStart(8, '0');
        }

        if (id.length > 8) {
            throw new Error('Id argument length must equal 4 bytes. Ids are checked only by the first four hex characters. Do not include the trailing file id characters.');
        }

        this._idsToExtract.push(id);
    };

    onheader(buf) {
        const header = {};
        header.fileSignature = buf.slice(0, 8);
        header.numberOfBlocks = buf.readInt32LE(8);
        header.numberOfFiles = buf.readInt32LE(12);
        header.tableOfContentsOffset = buf.readInt32LE(16);
        header.tableOfContentsLength = buf.readInt32LE(24);
        header.toc = {};

        const tocSchema = [{
            'name': 'unknown1',
            'type': 'buffer'
        }, {
            'name': 'id',
            'type': 'buffer'
        }, {
            'name': 'startPosition',
            'type': 'integer'
        }, {
            'name': 'fileSize',
            'type': 'integer'
        }, {
            'name': 'unknown2',
            'type': 'buffer'
        }];

        tocSchema.forEach((val, idx) => {
            const prev = idx > 0 ? header.toc[tocSchema[idx - 1].name] : null;

            header.toc[val.name] = {
                'type': val.type,
                'length': buf.readInt8(33 + idx),
                'offset': prev !== null ? prev.offset + prev.length : 0
            };
        });

        header.tableOfContentsAdditionalOffset = (buf.readInt8(40) * 4) + 1; // add 1 to individualTOCLength to skip the 01 separator
        header.tableOfContentsStart = header.tableOfContentsOffset + header.tableOfContentsAdditionalOffset;
        header.individualTOCLength = Object.keys(header.toc).reduce((sum, key) => {
            return sum + header.toc[key].length;
        }, 0);

        this._file.header = header;
        this.emit('header', header);
        
        this._currentBufferIndex = 0x29;
        this._skipBytes((header.tableOfContentsStart - 0x29), function () {
            this._currentBufferIndex += (header.tableOfContentsStart - 0x29);
            this._bytes(this._file.header.tableOfContentsLength - this._file.header.tableOfContentsAdditionalOffset, this.ontoc);
        });
    };

    ontoc(buf) {
        let tocs = [];

        const totalLength = this._file.header.tableOfContentsLength - this._file.header.tableOfContentsAdditionalOffset;
        const individualTOCLength = this._file.header.individualTOCLength + 1;   

        for (let i = 0; i <= totalLength; i += individualTOCLength) {
            tocs.push(this.parseTocEntry(buf.slice(i, i + this._file.header.individualTOCLength), i / individualTOCLength));
        }

        
        if (this._idsToExtract.length > 0) {
            tocs = tocs.filter((toc) => {
                return this._idsToExtract.includes(toc.id.slice(0, 4).toString('hex'));
            });
        }
        
        tocs.sort((a, b) => {
            return a.startPosition - b.startPosition;
        });

        this._file.toc = tocs;
        this.emit('toc', tocs);

        if (!this._extract) {
            this.emit('done');
            this._skipBytes(Infinity);
            return;
        }
        
        this._bytes(tocs[0].fileSize, function (buf) {
            this._currentBufferIndex += (this._file.header.tableOfContentsLength - this._file.header.tableOfContentsAdditionalOffset);
            this.onArchivedData(tocs, 0, buf);
        });
    };

    parseTocEntry(buf, index) {
        let entry = {
            'index': index
        };

        for (let [key, value] of Object.entries(this._file.header.toc)) {
            if (value.length === 0) {
                entry[key] = null;
            }
            else {
                switch (value.type) {
                    case 'integer':
                        entry[key] = buf.readUIntLE(value.offset, value.length);
                        break;
                    case 'buffer':
                    default:
                        entry[key] = buf.slice(value.offset, value.offset + value.length);
                        break;
                }
            }
        };

        entry.startPosition *= 8;   // start pos needs to be *8. They likely did this to save space.
        return entry;
    };

    onArchivedData(tocs, index, buf) {
        const toc = tocs[index];

        if (this._currentBufferIndex < toc.startPosition) {
            const bytesToOffset = toc.startPosition - this._currentBufferIndex;
            this._currentBufferIndex += bytesToOffset;

            return this._bytes(bytesToOffset, function (newBuf) {
                let bufferToPass;

                if (bytesToOffset > toc.fileSize) {
                    bufferToPass = newBuf.slice(bytesToOffset - toc.fileSize);
                }
                else {
                    bufferToPass = Buffer.concat([buf.slice(bytesToOffset), newBuf]);
                }

                this.onArchivedData(tocs, index, bufferToPass)
            });
        }

        this._file._addArchivedFile(Buffer.from([0x78]), toc);

        const fileStream = new stream.Readable();
        fileStream._read = () => {};
        fileStream.push(buf);
        fileStream.push(null);
        this.emit('compressed-file', {
            'stream': fileStream,
            'toc': toc
        });

        this._currentBufferIndex += toc.fileSize;

        if (tocs.length === index+1) {
            this.emit('done');
            this._skipBytes(Infinity, function () {});
        }
        else {
            this._bytes(tocs[index+1].fileSize, function (buf) {
                this.onArchivedData(tocs, index+1, buf);
            });
        }
    };
};

module.exports = ASTParser;