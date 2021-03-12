const LZ4 = require('lz4');
const { Transform } = require('stream');

class CompressedLegacyFileReader extends Transform {
    constructor() {
        super({
            'objectMode': true
        });
    };

    _transform(chunk, enc, cb) {
        let transformedResult = chunk.data;

        if (chunk.compressionType === 9) {
            let uncompressedChunk = Buffer.alloc(chunk.uncompressedSize);
            let uncompressedSize = LZ4.decodeBlock(chunk.data, uncompressedChunk);
            transformedResult = uncompressedChunk.slice(0, uncompressedSize);
        }
        
        this.push(transformedResult);
        cb();
    };
};

module.exports = CompressedLegacyFileReader;