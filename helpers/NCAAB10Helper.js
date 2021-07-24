const fs = require('fs');
const CRC32 = require('crc-32');
const pipeline = require('stream').pipeline;
const TDBParser = require('../streams/TDBParser');
const TDBWriter = require('../streams/TDBWriter');
const utilService = require('../services/utilService');

class NCAAB10Helper {
    constructor() {
        this._filePath = null;
        this._file = null;
        this._dataStart = 0;
        this._checksumStartingOffset = 0x1C;
    };

    load(filePath) {
        const self = this;
        this._filePath = filePath;

        return new Promise((resolve, reject) => {
            fs.open(filePath, (err, fd) => {
                const buffer = Buffer.alloc(5);
                fs.read(fd, buffer, buffer.byteOffset, 5, 0, (err, bytesRead, buffer) => {
                    const typeCheck = buffer.readUInt8(4);
                    switch(typeCheck) {
                        case 0x44:
                            // dynasty
                            this._dataStart = 0xAD76E;
                            break;
                        case 0x52:
                            // roster
                            this._dataStart = 0x1C;
                            break;
                        default:
                            // not supported
                            console.warn('This file type is not supported.');
                            reject('This file type is not supported.');
                            break;
                    }

                    if (this._dataStart) {
                        readTdbStream(fd, this._dataStart);
                    }
                });  
            });

            function readTdbStream(fd, offset) {
                const stream = fs.createReadStream(null, {fd: fd, start: offset });
                self._parser = new TDBParser();
    
                stream.on('end', () => {
                    self._file = self._parser.file;
                    resolve(self._file);
                });
                
                stream
                    .pipe(self._parser);
            };
        });
    };

    save(outputFile) {
        const self = this;

        return new Promise((resolve, reject) => {
            const saveDestination = outputFile ? outputFile : this._filePath;

            const cloneFilePromise = new Promise((resolve, reject) => {
                if (outputFile) {
                    pipeline(
                        fs.createReadStream(this._filePath),
                        fs.createWriteStream(outputFile),
                        (err) => {
                            if (err) {
                                reject(err);
                            }
                            resolve();
                        }
                    )
                }
                else {
                    resolve();
                }
            });

            cloneFilePromise.then(() => {
    
                const stream = fs.createWriteStream(saveDestination, { flags: 'r+', start: self._dataStart });
                const writer = new TDBWriter(this._file);

                stream.on('close', () => {
                    // update beginning CRC
                    fs.readFile(saveDestination, (err, buf) => {
                        if (err) {
                            const errorMessage = 'Error reading file at ' + saveDestination;
                            console.error(errorMessage);
                            reject(errorMessage);
                        }

                        const checksum = utilService.toUint32(CRC32.buf(buf.slice(0x1C)));
                        buf.writeUInt32BE(checksum, 0x10);
                        fs.writeFile(saveDestination, buf, (err) => {
                            if (err) {
                                const errorMessage = 'Error writing file at ' + saveDestination;
                                console.error(errorMessage);
                                reject(errorMessage);
                            }

                            resolve();
                        })
                    });
                });
        
                writer
                    .pipe(stream);
            });
        });
    };

    get filePath() {
        return this._filePath;
    };

    set filePath(fileName) {
        this._filePath = fileName;
    };

    get file() {
        return this._file;
    };
};

module.exports = NCAAB10Helper;