const File = require('./File_Old');
const ArchivedFile = require('./ArchivedFile');

class Archive extends File {
    constructor (filePath, rawContents) {
        super(filePath, rawContents);
        this._archivedFiles = [];
    };

    get archivedFiles () {
        return this._archivedFiles;
    };

    compress() {
        throw new Error('Method not implemented.');
    };

    _addArchivedFile(compressedData, metadata) {
        this._archivedFiles.push(new ArchivedFile(compressedData, metadata));
    };
};

module.exports = Archive;