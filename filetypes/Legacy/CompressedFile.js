class CompressedFile {
    constructor(casStartingIndex) {
        this._chunks = [];
        this._casStartingIndex = casStartingIndex;
    };

    get chunks() {
        return this._chunks;
    };

    get casStartingIndex() {
        return this._casStartingIndex;
    };

    addChunk(chunk) {
        this._chunks.push(chunk);
    };

    getCompressedBuffer() {
        return Buffer.concat(this._chunks);
    };
};

module.exports = CompressedFile;