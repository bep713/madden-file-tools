class ArchivedFile {
    constructor(compressedData, archiveMetadata) {
        this._compressedData = compressedData;
        this._compressionMethod = getCompressionMethod(compressedData);
        this._archiveMetadata = archiveMetadata;
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

    get archiveMetadata() {
        return this._archiveMetadata;
    };

    set archiveMetadata(metadata) {
        this._archiveMetadata = metadata;
    };
};

module.exports = ArchivedFile;

function getCompressionMethod(data) {
    if (data[0] === 0x78) {
        return 'zlib';
    }
};