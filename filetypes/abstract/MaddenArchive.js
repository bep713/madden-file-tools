const MaddenFile = require('./MaddenFile');
const ArchivedFile = require('./ArchivedFile');

class MaddenArchive extends MaddenFile {
    constructor (filePath, rawContents) {
        super(filePath, rawContents);
        this._archivedFiles = [];
    };

    get archivedFiles () {
        return this._archivedFiles;
    };

    extractAll(outputPath) {
        throw new Error('Method not implemented.');
    };

    compress() {
        throw new Error('Method not implemented.');
    };

    _addArchivedFile(compressedData) {
        this._archivedFiles.push(new ArchivedFile(compressedData));
    };
};

module.exports = MaddenArchive;