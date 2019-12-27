const zlib = require('zlib');
const ASTFile = require('../filetypes/ASTFile');
const DDSFile = require('../filetypes/DDSFile');
const PNGFile = require('../filetypes/PNGFile');
const File = require('../filetypes/abstract/File');

let fileService = {};

fileService.getFileType = function (contents) {
    if (Buffer.compare(contents.slice(0, 3), Buffer.from([0x44, 0x44, 0x53])) === 0) {
        return 'dds';
    }
    else if (Buffer.compare(contents.slice(0, 5), Buffer.from([0x42, 0x47, 0x46, 0x41, 0x31])) === 0) {
        return 'ast';
    }
    else if (Buffer.compare(contents.slice(0, 4), Buffer.from([0x89, 0x50, 0x4E, 0x47])) === 0) {
        return 'png';
    }
    else {
        return null;
    }
};

fileService.createFile = function (fileType, contents, filePath) {
    switch (fileType) {
        case 'dds':
            return new DDSFile(filePath, contents);
        case 'ast':
            return new ASTFile(filePath, contents);
        case 'png':
            return new PNGFile(filePath, contents);
        default:
            return new File(filePath, contents);
    }
};

fileService.parseUnknownFile = function (contents) {
    return fileService.createFile(fileService.getFileType(contents), contents);
};

fileService.extractArchivedFile = function (archivedFile) {
    return new Promise((resolve, reject) => {
        uncompressFile(archivedFile)
            .then((contents) => {
                const uncompressedFile = fileService.parseUnknownFile(contents);
                archivedFile.uncompressedFile = uncompressedFile;
                resolve(uncompressedFile);
            })
    });
};

fileService.extractAllFromArchive = function (maddenArchive) {
    return new Promise((resolve, reject) => {
        let promises = [];

        maddenArchive.archivedFiles.forEach((archive) => {
            promises.push(fileService.extractArchivedFile(archive));
        });

        Promise.all(promises)
            .then((results) => {
                resolve(results);
            })
            .catch(err => reject);
    });
};

fileService.convertFile = function (file, convertTo) {
    return new Promise((resolve, reject) => {
        file.convert(convertTo)
            .then((file) => {
                resolve(fileService.createFile(convertTo.toLowerCase(), file.rawContents));
            })
            .catch(err => reject);
    });
};

module.exports = fileService;

function uncompressFile(file) {
    switch (file.compressionMethod) {
        case 'zlib':
        default:
            return extractZlib(file.compressedData);
    }
};

function extractZlib(data) {
    return new Promise((resolve, reject) => {
        zlib.inflate(data, function (err, result) {
            if (err) {
                reject(err);
                return;
            }
            
            resolve(result);
        });
    });
};