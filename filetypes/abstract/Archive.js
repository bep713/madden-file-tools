const File = require('./File');
const ArchivedFile = require('./ArchivedFile');

class Archive extends File {
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

module.exports = Archive;