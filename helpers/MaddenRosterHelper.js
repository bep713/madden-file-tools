const fs = require('fs');
const zlib = require('zlib');
const pipeline = require('stream').pipeline;
const utilService = require('../services/utilService');

const CRC = require('../services/CRC');
const CRC32 = require('crc-32');

const TDBParser = require('../streams/TDBParser');
const TDBWriter = require('../streams/TDBWriter');

const TDB2Parser = require('../streams/TDB2/TDB2Parser');
const TDB2Writer = require('../streams/TDB2/TDB2Writer');

class MaddenRosterHelper {
    constructor() {
        this._year = 0;
        this._file = null;
        this._dataStart = 0;
        this._filePath = null;
        this._headerOffset = 0;
        this._headerBuffer = null;
    };

    load(filePath) {
        const self = this;
        this._filePath = filePath;

        return new Promise((resolve, reject) => {
            fs.open(filePath, (err, fd) => {
                const buffer = Buffer.alloc(0x18);

                fs.read(fd, buffer, buffer.byteOffset, 0x18, 0, (err, bytesRead, buffer) => {
                    this._headerBuffer = buffer;
                    this._year = buffer.readUInt16LE(0x16);
                    
                    if (this._year >= 2021) {
                        self._dataStart = 0x4A;
                    }
                    else {
                        self._dataStart = 0x3E;
                    }

                    const headerBytesToRead = self._dataStart - 0x18;
                    const newFormatBuffer = Buffer.alloc(headerBytesToRead);

                    fs.read(fd, newFormatBuffer, newFormatBuffer.byteOffset, headerBytesToRead, 0x18, (err, bytesRead, newBuffer) => {
                        this._headerBuffer = Buffer.concat([this._headerBuffer, newBuffer]);
                        readTdb2Stream(fd, self._dataStart);
                    });
                });
            });

            function readTdb2Stream(fd, dataStart) {
                const stream = fs.createReadStream(null, { fd: fd, start: dataStart });

                let postStreamFunctions = [];

                if (self._year >= 2021) {
                    self._parser = new TDB2Parser();
                    postStreamFunctions = [
                        zlib.createInflate(),
                        self._parser
                    ];
                }
                else {
                    self._parser = new TDBParser();
                    postStreamFunctions = [
                        self._parser
                    ];
                }
                
                pipeline(
                    stream,
                    ...postStreamFunctions,
                    (err) => {
                        if (err) {
                            reject(err);
                        }

                        self._file = self._parser.file;
                        resolve(self._file);
                    }
                )
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
                let writer;

                if (this._year >= 2021) {
                    writer = new TDB2Writer(this._file);
                    let dataBuffers = [];
                    
                    writer.on('end', () => {
                        const buffer = Buffer.concat(dataBuffers);
                        zlib.deflate(buffer, { level: 9 }, (err, result) => {
                            if (err) {
                                reject(err);
                            }

                            let crc = new CRC();
                            const newCrc = utilService.toUint32(utilService.toUint32(~crc.crc32_be(0, buffer, buffer.length)) ^ 0xFFFFFFFF);
                            this._headerBuffer.writeUInt32LE(newCrc, 0x1A);
                            this._headerBuffer.writeUInt32LE(buffer.length, 0x12);

                            writeFile(result);
                        });
                    });

                    writer.on('data', (buf) => {
                        dataBuffers.push(buf);
                    });

                }
                else {
                    let dataBuffers = [];
                    writer = new TDBWriter(this._file);

                    writer.on('end', () => {
                        writeFile(Buffer.concat(dataBuffers));
                    });

                    writer.on('data', (buf) => {
                        dataBuffers.push(buf);
                    });
                }

                function writeFile(dataBuffer) {
                    const fileBuffer = Buffer.concat([self._headerBuffer, dataBuffer]);
                    fs.writeFile(saveDestination, fileBuffer, { flag: 'r+' }, (err) => {
                        if (err) {
                            reject(err);
                        }

                        resolve();
                    });
                };
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

module.exports = MaddenRosterHelper;