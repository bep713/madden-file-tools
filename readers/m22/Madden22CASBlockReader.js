const fs = require('fs');
const path = require('path');
const zstd = require('node-zstandard');
const { pipeline } = require('stream');

const EBXParser = require('../../streams/ebx/EBXParser');
const CASBlockParser = require('../../streams/CASBlockParser');
const EBXDataReader = require('./EBXDataReader');

class Madden22CASBlockReader {
    constructor(casPath, types) {
        this._types = types;
        this._casPath = casPath;

        this._ebxs = [];
        this._parseEbxPromises = [];
        this._casParser = new CASBlockParser();
        this._casParser.on('block', this._onCasBlock.bind(this));
    };

    read() {
        return new Promise((resolve, reject) => {
            pipeline(
                fs.createReadStream(this._casPath),
                this._casParser,
                (err) => {
                    if (err) {
                        reject(err);
                    }
            
                    Promise.all(this._parseEbxPromises)
                        .then(() => {
                            resolve(this._ebxs);
                        });
                }
            );
        });
    };

    _onCasBlock(block) {
        if (block.meta.isCompressed) {
            switch(block.meta.compressionType) {
                case CASBlockParser.COMPRESSION_TYPE.ZSTD:
                    this._onZstdCompressedBlock(block);
                    break;
            };
        }
    };

    _onZstdCompressedBlock(block) {
        this._parseEbxPromises.push(new Promise((resolve, reject) => {
            const tempFilePath = path.join(__dirname, `../../scripts/temp/${block.meta.offset}.bin`);
            fs.writeFile(tempFilePath, block.data, (err) => {
                if (err) {
                    resolve(err);
                }
                else {
                    zstd.decompressFileToFile(tempFilePath, `${tempFilePath}.ebx`, (err, result) => {
                        if (err) {
                            resolve(err);
                        }
                        else {
                            fs.unlink(tempFilePath, (err) => {
                                if (err) {
                                    resolve(err);
                                }
                                else {
                                    let ebxParser = new EBXParser();

                                    pipeline(
                                        fs.createReadStream(`${tempFilePath}.ebx`),
                                        ebxParser,
                                        (err) => {
                                            if (err) {
                                                resolve(err);
                                            }

                                            let ebxFile = ebxParser._file;
                                            let reader = new EBXDataReader(this._types);

                                            let data;

                                            try {
                                                data = reader.readEbxData(ebxFile);
                                                ebxFile.name = data.mainObject.Name;
                                                ebxFile.data = data;
                                            }
                                            catch (err) {
                                                resolve(err);
                                            }

                                            fs.unlink(`${tempFilePath}.ebx`, (err) => {
                                                if (err) {
                                                    resolve(err);
                                                }
                                                
                                                this._ebxs.push(ebxFile);
                                                resolve(ebxFile);
                                            })
                                        }
                                    )
                                }
                            });
                        }
                    });
                }
            })
        }));
    };
};

module.exports = Madden22CASBlockReader;