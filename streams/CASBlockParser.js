const FileParser = require("../filetypes/abstract/FileParser");

class CASBlockParser extends FileParser {
    static COMPRESSION_TYPE = {
        UNCOMPRESSED: 0,
        ZLIB: 2,
        LZ4_BLOCK: 9,
        ZSTD: 15,
        OODLE: 17,
        OODLE_2: 21,
        OODLE_3: 25
    };

    constructor() {
        super();
        
        this.bytes(8, this._onBlockStart);
    };

    _onBlockStart(buf) {
        let block = {
            meta: {
                size: buf.readUInt32BE(0),
                offset: this.currentBufferIndex - 8
            }
        };

        const type = buf.readUInt32BE(4);

        if (type === 0xB3EDF05D || type == 0x5DF0EDB3 || type == 0xD68E799D) {
            block.meta.type = type;
            block.meta.isCompressed = false;

            this.bytes(block.meta.size - 4, (dataBuf) => {
                this._onBlockEnd(Buffer.concat([buf.slice(4), dataBuf]), block);
            });
        }
        else {
            block.meta.compressionIndicator = buf.readUInt16LE(4);
            block.meta.compressionType = block.meta.compressionIndicator & 0x7F;
            block.meta.compressedSize = buf.readUInt16BE(6);

            if (block.meta.compressionType === CASBlockParser.COMPRESSION_TYPE.UNCOMPRESSED) {
                this.bytes(block.meta.size - 4, (dataBuf) => {
                    this._onBlockEnd(Buffer.concat([buf.slice(4), dataBuf]), block);
                });
            }
            else {
                block.meta.isCompressed = true;
                
                this.bytes(block.meta.compressedSize, (buf) => {
                    return this._onBlockEnd(buf, block);
                });
            }
        }
    };

    _onBlockEnd(buf, block) {
        block.data = buf;
        this.emit('block', block);

        this.bytes(8, this._onBlockStart);
    };
};

module.exports = CASBlockParser;