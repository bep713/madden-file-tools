const { Transform } = require('stream');
const { BitView } = require('bit-buffer');
const zstd = require('@fstnetwork/cppzst');
const CASBlockParser = require('./CASBlockParser');

const MAX_CHUNK_SIZE = 0x10000;

class CASBlockTransformer extends Transform {
    constructor(opts) {
        super();
        this._chunks = [];
        this._tempBufs = [];
        this._options = opts;
        this._internalTempBufSize = 0;
    };

    _transform(chunk, enc, cb) {
        this._tempBufs.push(chunk);
        this._internalTempBufSize += chunk.length;

        if (this._internalTempBufSize >= MAX_CHUNK_SIZE) {
            const trimmedBuf = Buffer.concat(this._tempBufs).slice(0, MAX_CHUNK_SIZE);
            const meta = new BufMeta(trimmedBuf);
            this._generateOutputBuffer(meta)
                .then((buf) => {
                    this.push(buf);
                });
            
            // Reset internal buffer, push remaining chunk if applicable.
            // Say the internal buffer is 0x10001. We need to push the last byte on the internal buffer
            // because it won't be part of the timmedBuf.
            this._tempBufs = [];
            this._internalTempBufSize = MAX_CHUNK_SIZE - this._internalTempBufSize;

            if (this._internalTempBufSize > 0) {
                this._tempBufs.push(chunk.slice(this._internalTempBufSize));
            }
        }

        cb();
    };

    _final(cb) {
        const buf = Buffer.concat(this._tempBufs);
        const meta = new BufMeta(buf);

        this._generateOutputBuffer(meta)
            .then((buf) => {
                this.push(buf);
                cb();
            });
    };

    async _generateOutputBuffer(bufMeta) {
        if (this._options && this._options.compressionType) {
            bufMeta.compressionType = this._options.compressionType;
        }

        switch (bufMeta.compressionType) {
            case CASBlockParser.COMPRESSION_TYPE.ZSTD:
                bufMeta.buf = await zstd.compress(bufMeta.buf);
                bufMeta.sizeInCas = bufMeta.buf.length;
                break;
        }

        const outputBuf = Buffer.alloc(bufMeta.sizeInCas + 8);
        const bv = new BitView(outputBuf);
        bv.bigEndian = true;

        bv.setUint32(0, bufMeta.uncompressedLength);
        bv.setBits(32, 0, 1);
        bv.setBits(33, bufMeta.compressionType, 7);
        bv.setBits(40, 56, 7);                          // i don't know why each standard CAS block has a value of 56 here...
        bv.setBits(47, bufMeta.sizeInCas, 17);
        outputBuf.fill(bufMeta.buf, 8);

        return outputBuf;
    };
};

module.exports = CASBlockTransformer;

class BufMeta {
    constructor(buf) {
        this.buf = buf;
        this.compressionType = CASBlockParser.COMPRESSION_TYPE.UNCOMPRESSED;
        this.sizeInCas = buf.length;
        this.uncompressedLength = buf.length;
    };
};