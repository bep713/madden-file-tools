const utilService = require('../services/utilService');
const Archive = require('./abstract/Archive_Old');

class ASTFile extends Archive {
    
    constructor(filePath, contents) {
        super(filePath, contents);
        this[Symbol.toStringTag] = 'ASTFile';
        this.parse();
    };

    parse() {
        this._parseFileHeader();
        this._parseTableOfContents();
        this._parseCompressedData();
    };

    _parseFileHeader() {
        this._header.fileSignature = this.rawContents.slice(0, 8);
        this._header.numberOfBlocks = utilService.readDWordAt(11, this.rawContents, true);
        this._header.numberOfFiles = utilService.readDWordAt(15, this.rawContents, true);
        this._header.tableOfContentsOffset = utilService.readDWordAt(19, this.rawContents, true);
        this._header.tableOfContentsLength = utilService.readDWordAt(27, this.rawContents, true);
        this._header.unknown1Length = utilService.toInteger(this.rawContents[33]);
        this._header.idLength = utilService.toInteger(this.rawContents[34]);
        this._header.startPositionLength = utilService.toInteger(this.rawContents[35]);
        this._header.fileSizeLength = utilService.toInteger(this.rawContents[36]);
        this._header.unknown2Length = utilService.toInteger(this.rawContents[37]);
        this._header.tableOfContentsAdditionalOffset = utilService.toInteger(this.rawContents[40]);
        this._header.tableOfContentsStart = this._header.tableOfContentsOffset + (this._header.tableOfContentsAdditionalOffset * 4);
        this._header.individualTOCLength = this._header.unknown1Length + this._header.idLength + this._header.startPositionLength 
            + this._header.fileSizeLength + this._header.unknown2Length;
    };

    _parseTableOfContents() {
        this._toc = [];
        let currentOffset = this._header.tableOfContentsStart + 1 // add 1 to ignore the 01 separator;

        for (let i = 0; i < this._header.numberOfFiles; i++) {
            const tocEntry = {};

            if (this._header.unknown1Length > 0) {
                tocEntry.unknown1 = utilService.hex2Dec(this.rawContents.slice(currentOffset, currentOffset + this._header.unknown1Length), true);
                currentOffset += this._header.unknown1Length;
            } else {
                tocEntry.unknown1 = null;
            }
            
            tocEntry.id = this.rawContents.slice(currentOffset, currentOffset + this._header.idLength);
            currentOffset += this._header.idLength;

            tocEntry.startPosition = utilService.hex2Dec(this.rawContents.slice(currentOffset, currentOffset + this._header.startPositionLength), true) * 8;
            currentOffset += this._header.startPositionLength;
            
            tocEntry.fileSize = utilService.hex2Dec(this.rawContents.slice(currentOffset, currentOffset + this._header.fileSizeLength), true);
            currentOffset += this._header.fileSizeLength;

            tocEntry.unknown2 = this.rawContents.slice(currentOffset, currentOffset + this._header.unknown2Length);
            currentOffset += this._header.unknown2Length + 1; // add 1 to ignore the 01 separator at the end

            tocEntry.index = i;

            this._toc.push(tocEntry);
        }

        this._toc.sort((a, b) => {
            return a.startPosition - b.startPosition;
        });
    };

    _parseCompressedData() {
        this._toc.forEach((archiveFileHeader) => {
            this._addArchivedFile(this.rawContents.slice(archiveFileHeader.startPosition, archiveFileHeader.startPosition + archiveFileHeader.fileSize), archiveFileHeader);
        });
    };
};

module.exports = ASTFile;