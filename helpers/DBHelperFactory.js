const fs = require('fs');
const TDBHelper = require('./TDBHelper');
const HC09Helper = require('./HC09Helper');

module.exports = {
    createHelper(filePath) {
        return new Promise((resolve, reject) => {
            fs.open(filePath, (err, fd) => {
                const buffer = Buffer.alloc(4);
                fs.read(fd, buffer, buffer.byteOffset, 4, 0, (err, bytesRead, buffer) => {
                    if (buffer.readUInt16BE(0) === 0x4442) {
                        resolve(new TDBHelper());
                    }
                    else {
                        resolve(new HC09Helper());
                    }
                });  
            });
        });
    }
}