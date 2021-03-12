const { Readable } = require('stream');
const FileParser = require('../filetypes/abstract/FileParser');

class CASLegacyParser extends FileParser {
    constructor() {
        super();
        this._streams = [];
        this.bytes(0x8, (buf) => {
            this._testBlockStart(buf);
        });
    };

    _testBlockStart(buf, streamInProgress) {
        const uncompressedSize = buf.readUInt32BE(0);
        const compressionCheck = buf.readUInt16BE(4);
        
        if (uncompressedSize <= 0x10000 && (compressionCheck === 0x0970 || compressionCheck === 0x0070 || compressionCheck === 0x0071)) {
            let blockSize = buf.readUInt16BE(6);

            if (uncompressedSize === 0x10000 && blockSize === 0) {
                blockSize = 0x10000;
            }

            if (blockSize === 0 || (compressionCheck === 0x0070 && uncompressedSize !== blockSize)) {
                if (streamInProgress) {
                    streamInProgress.push(null);
                }

                this._checkPartialMatch(buf);
            }
            else {
                let stream = streamInProgress;
                const compressionType = buf.readUInt8(4);

                if (!streamInProgress) {
                    stream = this._createAndEmitNewReadStream();
                }
                
                this.bytes(blockSize, (buf) => {
                    this._onCompressedBlock(buf, stream, uncompressedSize, compressionType, blockSize, uncompressedSize !== 0x10000);
                });
            }
        }
        else {
            if (streamInProgress) {
                streamInProgress.push(null);
            }

            this._checkPartialMatch(buf);
        }
    };

    _checkPartialMatch(buf) {
        let zeros = [];

        for (let i = 1; i < buf.length; i++) {
            const digit = buf.readUInt8(i);

            if (digit === 0) {
                zeros.push(i);
            }
        }

        const zeroExistsInBuffer = zeros.length >= 1;

        if (zeroExistsInBuffer) {
            this._onPartialZeroMatch(buf, zeros);
        }
        else {
            this.bytes(0x8, (buf) => {
                this._testBlockStart(buf);
            });
        }
    };

    _onCompressedBlock(buf, stream, uncompressedSize, compressionType, compressedSize, endStreamAfterBuffer) {
        stream.push({
            'uncompressedSize': uncompressedSize,
            'compressionType': compressionType,
            'compressedSize': compressedSize,
            'data': buf
        });

        if (endStreamAfterBuffer) {
            stream.push(null);
            this.bytes(0x8, (buf) => {
                this._testBlockStart(buf);
            });
        }
        else {
            this.bytes(0x8, (buf) => {
                this._testBlockStart(buf, stream);
            });
        }
    };

    _onPartialZeroMatch(buf, zeroList) {
        let bytesToRead = 7;
        const lengthOfDataWeAlreadyHave = (buf.length - (zeroList[0] + 1));
        bytesToRead -= lengthOfDataWeAlreadyHave;

        const self = this;

        this.bytes(bytesToRead, (buf2) => {
            const fullBuffer = Buffer.concat([buf, buf2]);
            const uncompressedSize = fullBuffer.readUInt32BE(zeroList[0]);
            const compressionCheck = fullBuffer.readUInt16BE(zeroList[0] + 4);
            
            if (uncompressedSize <= 0x10000 && (compressionCheck === 0x0970 || compressionCheck === 0x0070 || compressionCheck === 0x0071)) {
                let blockSize = fullBuffer.readUInt16BE(zeroList[0] + 6);

                if (uncompressedSize === 0x10000 && blockSize === 0) {
                    blockSize = 0x10000;
                }

                if (blockSize === 0 || (compressionCheck === 0x0070 && uncompressedSize !== blockSize)) {
                    tryNextPartial();
                }
                else {
                    const compressionType = fullBuffer.readUInt8(zeroList[0] + 4);
                    const stream = this._createAndEmitNewReadStream();

                    let bytesToRead = blockSize;
                    if (fullBuffer.length > zeroList[0] + 8) {
                        bytesToRead -= fullBuffer.length - (zeroList[0] + 8);
                    }
    
                    this.bytes(bytesToRead, (buf3) => {
                        let bufferToSend = buf3;
    
                        if (fullBuffer.length > zeroList[0] + 8) {
                            bufferToSend = Buffer.concat([fullBuffer.slice(zeroList[0] + 8), bufferToSend]);
                        }
    
                        this._onCompressedBlock(bufferToSend, stream, uncompressedSize, compressionType, blockSize, uncompressedSize !== 0x10000);
                    });
                }
            }
            else {
                tryNextPartial();
            }

            function tryNextPartial() {
                for (let i = 0; i < buf2.length; i++) {
                    const digit = buf2.readUInt8(i);
    
                    if (digit === 0) {
                        zeroList.push(buf.length + i);
                    }
                }

                if (zeroList.length > 1) {
                    zeroList.shift();
                    self._onPartialZeroMatch(fullBuffer, zeroList);
                }
                else {
                    self.bytes(0x8, (buf2) => {
                        self._testBlockStart(buf2);
                    });
                }
            };
        });
    };

    _final(cb) {
        this._streams.forEach((stream) => {
            stream.push(null);
        });

        cb();
    };

    _createAndEmitNewReadStream() {
        const stream = new Readable({objectMode: true});
        stream._read = () => {};
        this._streams.push(stream);
        this.emit('compressed-data', {
            'startIndex': this.currentBufferIndex,
            'stream': stream
        });

        return stream;
    };
};

module.exports = CASLegacyParser;