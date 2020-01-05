const Archive = require('./abstract/Archive');

class ASTFile extends Archive {
    
    constructor() {
        super();
        this[Symbol.toStringTag] = 'ASTFile';

        this._toc = [];
    };

    get toc() {
        return this._tocs;
    };

    set toc(tocs) {
        this._tocs = tocs;
    };

    // parse() {
    //     const that = this;
    //     const astParser = new ASTParser();

    //     this._stream
    //         .pipe(astParser);

    //     astParser.on('header', function (header) {
    //         that._header = header;
    //     });

    //     astParser.on('toc', function (toc) {
    //         that._toc = toc;
    //         that.emit('ready');
    //     });
    // };

    // _parseFileHeader(buf) {
    //     this._header.fileSignature = buf.slice(0, 8);
    //     this._header.numberOfBlocks = buf.readInt32LE(8);
    //     this._header.numberOfFiles = buf.readInt32LE(12);
    //     this._header.tableOfContentsOffset = buf.readInt32LE(16);
    //     this._header.tableOfContentsLength = buf.readInt32LE(24);
    //     this._header.unknown1Length = buf.readInt8(33);
    //     this._header.idLength = buf.readInt8(34);
    //     this._header.startPositionLength = buf.readInt8(35);
    //     this._header.fileSizeLength = buf.readInt8(36);
    //     this._header.unknown2Length = buf.readInt8(37);
    //     this._header.tableOfContentsAdditionalOffset = buf.readInt8(40);

    //     this._headerProcessed = true;
    // };

    // _parseTableOfContents() {
    //     this._toc = [];
    //     // this.
    //     // let currentOffset = this._header.tableOfContentsStart + 1 // add 1 to ignore the 01 separator;

    //     // for (let i = 0; i < this._header.numberOfFiles; i++) {
    //     //     const tocEntry = {};

    //     //     if (this._header.unknown1Length > 0) {
    //     //         tocEntry.unknown1 = utilService.hex2Dec(this.rawContents.slice(currentOffset, currentOffset + this._header.unknown1Length), true);
    //     //         currentOffset += this._header.unknown1Length;
    //     //     } else {
    //     //         tocEntry.unknown1 = null;
    //     //     }
            
    //     //     tocEntry.id = this.rawContents.slice(currentOffset, currentOffset + this._header.idLength);
    //     //     currentOffset += this._header.idLength;

    //     //     tocEntry.startPosition = utilService.hex2Dec(this.rawContents.slice(currentOffset, currentOffset + this._header.startPositionLength), true) * 8;
    //     //     currentOffset += this._header.startPositionLength;
            
    //     //     tocEntry.fileSize = utilService.hex2Dec(this.rawContents.slice(currentOffset, currentOffset + this._header.fileSizeLength), true);
    //     //     currentOffset += this._header.fileSizeLength;

    //     //     tocEntry.unknown2 = this.rawContents.slice(currentOffset, currentOffset + this._header.unknown2Length);
    //     //     currentOffset += this._header.unknown2Length + 1; // add 1 to ignore the 01 separator at the end

    //     //     tocEntry.index = i;

    //     //     this._toc.push(tocEntry);
    //     // }

    //     // this._toc.sort((a, b) => {
    //     //     return a.startPosition - b.startPosition;
    //     // });
    // };

    // _parseCompressedData() {
    //     this._toc.forEach((archiveFileHeader) => {
    //         this._addArchivedFile(this.rawContents.slice(archiveFileHeader.startPosition, archiveFileHeader.startPosition + archiveFileHeader.fileSize), archiveFileHeader);
    //     });
    // };
};

module.exports = ASTFile;