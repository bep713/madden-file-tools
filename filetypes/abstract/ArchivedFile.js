class ArchivedFile {
    constructor(compressedData) {
        this._compressedData = compressedData;
        this._compressionMethod = getCompressionMethod(compressedData);
        this._uncompressedFile = null;
    };

    get compressedData() {
        return this._compressedData;
    };

    get compressionMethod() {
        return this._compressionMethod;
    };

    get uncompressedFile() {
        return this._uncompressedFile;
    };

    set uncompressedFile(file) {
        this._uncompressedFile = file;
    };
};

module.exports = ArchivedFile;

function getCompressionMethod(data) {
    if (data[0] === 0x78) {
        return 'zlib';
    }
};