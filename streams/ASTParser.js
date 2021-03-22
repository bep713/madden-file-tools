const stream = require('stream');
const ASTFile = require('../filetypes/ASTFile');
const FileParser = require('../filetypes/abstract/FileParser');
const ASTEntry = require('../filetypes/AST/ASTEntry');

class ASTParser extends FileParser {
    constructor() {
        super();

        this._file = new ASTFile();
        this._idsToExtract = [];
        this._extract = true;
        
        this.bytes(0x30, this.onheader);
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
            'name': 'uncompressedSize',
            'type': 'integer'
        }];

        tocSchema.forEach((val, idx) => {
            const prev = idx > 0 ? header.toc[tocSchema[idx - 1].name] : null;

            header.toc[val.name] = {
                'type': val.type,
                'length': buf.readInt8(33 + idx),
                'offset': prev !== null ? prev.offset + prev.length : 0
            };
        });

        header.offsetShift = buf.readInt8(33 + tocSchema.length);
        header.tableOfContentsAdditionalOffset = (buf.readInt8(40) * 4); // add 1 to individualTOCLength to skip the 01 separator
        header.offsetAfterToc = getPadding(header.tableOfContentsLength, Math.pow(2, header.offsetShift));
        header.tableOfContentsStart = header.tableOfContentsOffset;
        header.descriptionFieldLength = buf.readInt8(44);

        header.individualTOCLengthBeforeDescription = Object.keys(header.toc).reduce((sum, key) => {
            return sum + header.toc[key].length;
        }, 0);

        header.individualTOCLength = header.individualTOCLengthBeforeDescription + header.descriptionFieldLength;

        this._file.header = header;
        this.emit('header', header);

        this.skipBytes((header.tableOfContentsStart - 0x30 + header.tableOfContentsAdditionalOffset), function () {
            this.bytes(this._file.header.tableOfContentsLength - header.tableOfContentsAdditionalOffset + this._file.header.offsetAfterToc, this.ontoc);
        });
    };

    ontoc(buf) {
        let tocs = [];

        const totalLength = this._file.header.tableOfContentsLength - this._file.header.tableOfContentsAdditionalOffset;
        const individualTOCLength = this._file.header.individualTOCLength + 1;   

        for (let i = 0; i < totalLength; i += individualTOCLength) {
            const toc = this.parseTocEntry(buf.slice(i+1, i + individualTOCLength), i / individualTOCLength);
            toc.isChanged = false;
            tocs.push(toc);
        }
        
        if (this._idsToExtract.length > 0) {
            tocs = tocs.filter((toc) => {
                return this._idsToExtract.includes(toc.id.slice(0, 4).toString('hex'));
            });
        }
        
        tocs.sort((a, b) => {
            return a.startPositionInt - b.startPositionInt;
        });

        this._file.tocs = tocs;
        this.emit('toc', tocs);

        if (!this._extract) {
            this.emit('done');
            this._skipBytes(Infinity);
            return;
        }
        
        this.bytes(tocs[0].fileSizeInt, function (buf) {
            this.onArchivedData(tocs, 0, buf);
        });
    };

    parseTocEntry(buf, index) {
        let entry = new ASTEntry(this._file.header.toc);
        entry.index = index;
        entry.offsetShift = this._file.header.offsetShift;

        for (let [key, value] of Object.entries(this._file.header.toc)) {
            entry[key] = buf.slice(value.offset, value.offset + value.length);
        };

        entry.description = buf.slice(this._file.header.individualTOCLengthBeforeDescription);

        return entry;
    };

    onArchivedData(tocs, index, buf) {
        const toc = tocs[index];

        if (this._currentBufferIndex < (toc.startPositionInFile + toc.fileSizeInt)) {
            const bytesToOffset = (toc.startPositionInFile + toc.fileSizeInt) - this._currentBufferIndex;

            return this.bytes(bytesToOffset, function (newBuf) {
                let bufferToPass = Buffer.concat([buf, newBuf]).slice(toc.fileSizeInt * -1);
                this.onArchivedData(tocs, index, bufferToPass)
            });
        }
        else {    
            const fileStream = new stream.Readable();
            fileStream._read = () => {};
            fileStream.push(buf);
            fileStream.push(null);
            this.emit('compressed-file', {
                'stream': fileStream,
                'toc': toc
            });
    
            // this._currentBufferIndex += toc.fileSizeInt;
    
            if (tocs.length === index+1) {
                this.emit('done');
                this.skipBytes(Infinity, function () {});
            }
            else {
                this.bytes(tocs[index+1].fileSizeInt, function (buf) {
                    this.onArchivedData(tocs, index+1, buf);
                });
            }
        }

    };
};

module.exports = ASTParser;

function getPadding(size, offsetShift) {
    return (offsetShift - (size % offsetShift)) % offsetShift;
};