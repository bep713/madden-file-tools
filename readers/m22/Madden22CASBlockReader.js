const fs = require('fs');
const path = require('path');
const uuid = require('uuid').v4;
const zstd = require('@fstnetwork/cppzst');
const { pipeline, Readable, Transform } = require('stream');

const EBXDataReader = require('./EBXDataReader');
const EBXParser = require('../../streams/ebx/EBXParser');
const CASBlockParser = require('../../streams/CASBlockParser');

class Madden22CASBlockReader {
    constructor(casPath, types, options) {
        this._types = types;
        this._casPath = casPath;
        this._options = options;

        this._ebxs = [];
        this._parseEbxPromises = [];
        this._tempDirectory = path.join(__dirname, '../../scripts/temp');

        this._casParser = new CASBlockParser();
        this._casParser.on('chunk', this._onCasChunk.bind(this));
    };

    get tempDirectory() {
        return this._tempDirectory;
    };

    set tempDirectory(temp) {
        this._tempDirectory = temp;
    };

    read() {
        let readStreamOptions = {};

        if (this._options) {
            if (this._options.start) {
                readStreamOptions.start = this._options.start;
            }

            if (this._options.size) {
                if (!readStreamOptions.start) {
                    readStreamOptions.start = 0;
                }

                readStreamOptions.end = readStreamOptions.start + this._options.size;
            }
        }

        return new Promise(async (resolve, reject) => {
            pipeline(
                fs.createReadStream(this._casPath, readStreamOptions),
                this._casParser,
                async (err) => {
                    if (err) {
                        reject(err);
                    }
            
                    const ebxList = await Promise.all(this._parseEbxPromises)
                    resolve(ebxList);
                }
            );
        });
    };

    _onCasChunk(chunk) {
        const firstBlock = chunk.blocks[0];

        if (firstBlock.meta.isCompressed) {
            switch(firstBlock.meta.compressionType) {
                case CASBlockParser.COMPRESSION_TYPE.ZSTD:
                    this._onZstdCompressedBlock(chunk);
                    break;
            };
        }
    };

    _onZstdCompressedBlock(chunk) {
        this._parseEbxPromises.push(new Promise(async (resolve, reject) => {
            let decompressionPromises = chunk.blocks.map((block, index) => {
                return new Promise(async (resolve, reject) => {

                    try {
                        const decompressedData = await zstd.decompress(block.data);
                        resolve({
                            index: index,
                            data: decompressedData
                        });
                    }
                    catch (err) {
                        resolve({
                            index: index,
                            data: null
                        });
                    }
                });
            });
            
            const decompressedDataBufferMetadata = await Promise.all(decompressionPromises);
            decompressedDataBufferMetadata.sort((a, b) => {
                return a.index - b.index;
            });
            
            const decompressedDataBuffers = decompressedDataBufferMetadata.filter((meta) => {
                return meta.data !== null;
            }).map((meta) => {
                return meta.data;
            });
            
            const decompressedData = Buffer.concat(decompressedDataBuffers);            
            const readStream = Readable.from(decompressedData);
            let ebxParser = new EBXParser();

            let pipes = [ebxParser];
            let ebxData = Buffer.from([]);

            if (this._options && this._options.exportOptions && this._options.exportOptions.export) {
                pipes.unshift(new Transform({
                    transform(chunk, enc, cb) {
                        ebxData = Buffer.concat([ebxData, chunk]);
                        cb();
                    }
                }))
            }
            
            pipeline(
                readStream,
                ...pipes,
                (err) => {
                    if (err) {
                        reject(err);
                    }
                    
                    let ebxFile = ebxParser._file;
                    ebxFile.data = ebxData;
                    ebxFile.offset = chunk.offset;
                    ebxFile.sizeInCas = chunk.sizeInCas;

                    if (this._options && this._options.readEbxData) {
                        let reader = new EBXDataReader(this._types);

                        try {
                            ebxFile.data = reader.readEbxData(ebxFile);
                        }
                        catch (err) {
                            console.log(err);
                            // const fileId = ebxFile.ebx.efix ? ebxFile.ebx.efix.fileGuid : `no_efix_${uuid()}`;
                            // fs.writeFileSync(path.join(__dirname, `../../tests/data/ebx/failed-ebx/${fileId}.uncompressed.ebx`), decompressedData);
                            return reject(err);
                        }
                    }
                    
                    // this._ebxs.push(ebxFile);
                    resolve(ebxFile);
                });
            }));
        };
    };
    
    module.exports = Madden22CASBlockReader;