const leb = require('leb128');
const File = require('./abstract/File');

const ENCRYPTED_AND_HAS_SIGNATURE_HEX = 0x00D1CE00;
const NOT_ENCRYPTED_AND_HAS_SIGNATURE_HEX = 0x00D1CE01;

const ENCRYPTED_AND_HAS_SIGNATURE = 'ENCRYPTED_AND_HAS_SIGNATURE';
const NOT_ENCRYPTED_AND_HAS_SIGNATURE = 'NOT_ENCRYPTED_AND_HAS_SIGNATURE';

class TOCFile extends File {
    constructor(filePath, contents) {
        super(filePath, contents);
        this._entryMetadata = [];
        this[Symbol.toStringTag] = 'TOCFile';

        this.parse();
    };

    get entryMetadata () {
        return this._entryMetadata;
    };

    parse() {
        this._parseFileHeader();
        this._parseEntries();
    };

    _parseFileHeader() {
        const content = this._rawContents;
        const magic = content.readInt32LE(0);

        if (magic === ENCRYPTED_AND_HAS_SIGNATURE_HEX) {
            this._header.fileType = ENCRYPTED_AND_HAS_SIGNATURE;
            this._header.dataStart = 296;
        }
        else {
            this._header.fileType = NOT_ENCRYPTED_AND_HAS_SIGNATURE;
            this._header.dataStart = 556;
        }
    };

    _parseEntries() {
        let offset = this._header.dataStart;
        this._parseEntry(offset);
    };

    _parseEntry(offset) {
        let entryMetadata = {};

        const entryType = this._rawContents[offset];
        switch(entryType) {
            case 0x82:
                entryMetadata.type = 'normal';
                entryMetadata.size = leb.unsigned.decode(this._rawContents.slice(offset+1, offset+5));
        }

        this._entryMetadata.push(entryMetadata);
    };
}

module.exports = TOCFile;

function read128() {

};