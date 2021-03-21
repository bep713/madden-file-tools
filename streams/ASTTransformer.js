const FileTransformParser = require('../filetypes/abstract/FileTransformParser');

class ASTTransformer extends FileTransformParser {
    // take in ASTFile in constructor
    // loop through each ASTEntry
    // if ASTEntry has a data stream, we need to update every toc that comes after it with a new start position

    // the original file will get piped into this stream
    // we need to make logic to replace the new parts.

    constructor(file) {
        super();
        this._file = file;
        this._currentTocIndex = 0;

        this._file.tocs.sort((a, b) => {
            return a.startPositionInt - b.startPositionInt;
        });

        let runningStartPositionDifference = 0;

        this._file.tocs.forEach((toc) => {
            if (runningStartPositionDifference !== 0) {
                toc.startPositionInt += runningStartPositionDifference;
            }

            if (toc.isChanged) {
                const difference = (toc.fileSizeInt - toc.originalFileSizeInt) / 8;
                runningStartPositionDifference += Math.round(difference);
            }
        });

        this._file.tocs.sort((a, b) => {
            return a.index - b.index;
        });

        this._logIndex = false;

        this.passthrough(this._file.header.tableOfContentsStart + this._file.header.tableOfContentsAdditionalOffset, function () {
            this.bytes(this._file.header.individualTOCLength + 1, this._onToc);
        });
    };
    
    _onToc(buf) {
        const toc = this._file.tocs[this._currentTocIndex];

        if (toc.isChanged) {
            const newTocBuffer = Buffer.concat([buf.slice(0, 1), toc.unknown1, toc.id, toc.startPosition, toc.fileSize, toc.uncompressedSize]);
            this.push(newTocBuffer);
        }
        else {
            this.push(buf);
        }

        this._currentTocIndex += 1;

        if (this._currentTocIndex < this._file.tocs.length) {
            this.bytes(this._file.header.individualTOCLength + 1, this._onToc);
        }
        else {
            this._file.tocs.sort((a, b) => {
                return a.startPositionInt - b.startPositionInt;
            });

            if (this._file.header.offsetAfterToc > 0) {
                this.passthrough(this._file.header.offsetAfterToc, function () {
                    this._findNextArchivedData(0);
                });
            }
            else {
                this._findNextArchivedData(0);
            }
        }
    };

    _onArchivedData(toc, index, buf) {
        if (!this._logIndex && (this.currentBufferIndex !== (toc.originalStartPositionInFile + toc.originalFileSizeInt))) {
            this._logIndex = true;
            console.log(this.currentBufferIndex, (toc.originalStartPositionInFile + toc.originalFileSizeInt));
        }

        let dataToWrite = buf;

        if (toc.isChanged && toc.data) {
            dataToWrite = toc.data;
        }

        this.push(dataToWrite);

        if (index < (this._file.tocs.length-1)) {
            this._findNextArchivedData(index+1);
        }
    };

    _findNextArchivedData(nextIndex) {
        const toc = this._file.tocs[nextIndex];
        let calculatedPadding = 0;
        let newPadding = 0;
        let paddingToPassthrough = 0;
        let paddingToSkip = 0;
        
        if (nextIndex >= 1) {
            const previousToc = this._file.tocs[nextIndex-1];
            calculatedPadding = (8 - (previousToc.fileSizeInt % 8)) % 8;
            paddingToPassthrough = calculatedPadding;
            const previousPadding = (8 - (previousToc.originalFileSizeInt % 8)) % 8;
            
            if (previousToc.isChanged) {
                newPadding = calculatedPadding - previousPadding;

                if (newPadding < 0) {
                    paddingToSkip = previousPadding - calculatedPadding;
                }
                else {
                    paddingToPassthrough = calculatedPadding - newPadding;
                }
            }

            const extraPaddingSize = (toc.originalStartPositionInFile - previousPadding) - (previousToc.originalStartPositionInFile + previousToc.originalFileSizeInt);
            paddingToPassthrough += extraPaddingSize;
        }

        if (paddingToPassthrough > 0) {
            this.passthrough(paddingToPassthrough, afterPassthrough.bind(this));
        }
        else {
            afterPassthrough.bind(this)();
        }

        function afterPassthrough() {
            if (calculatedPadding > 0) {
                if (newPadding < 0) {
                    this.skipBytes(paddingToSkip, function () {
                        this.bytes(toc.originalFileSizeInt, function (buf) {
                            this._onArchivedData(toc, nextIndex, buf);
                        });
                    });
                }
                else {
                    if (newPadding > 0) {
                        this.push(Buffer.alloc(newPadding));
                    }

                    this.bytes(toc.originalFileSizeInt, function (buf) {
                        this._onArchivedData(toc, nextIndex, buf);
                    });
                }
            }
            else {
                if (paddingToSkip > 0) {
                    this.skipBytes(paddingToSkip, function () {
                        this.bytes(toc.originalFileSizeInt, function (buf) {
                            this._onArchivedData(toc, nextIndex, buf);
                        });
                    });
                }
                else {
                    this.bytes(toc.originalFileSizeInt, function (buf) {
                        this._onArchivedData(toc, nextIndex, buf);
                    });
                }
            }
        };
    };
};

module.exports = ASTTransformer;