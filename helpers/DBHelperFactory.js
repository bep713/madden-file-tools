const fs = require('fs');
const TDBHelper = require('./TDBHelper');
const HC09Helper = require('./HC09Helper');
const MaddenRosterHelper = require('./MaddenRosterHelper');

module.exports = {
    createHelper(filePath) {
        return new Promise((resolve, reject) => {
            fs.open(filePath, (err, fd) => {
                const buffer = Buffer.alloc(0xE);
                fs.read(fd, buffer, buffer.byteOffset, 0xE, 0, (err, bytesRead, buffer) => {
                    if (buffer.readUInt16BE(0) === 0x4442) {
                        resolve(new TDBHelper());
                    }
                    else if (buffer.readUInt32BE(0) === 0x46424348) {
                        if (buffer.readUInt32BE(0xA) === 0x40) {
                            // franchise file
                        }
                        else {
                            // roster file
                            resolve(new MaddenRosterHelper());
                        }
                    }
                    else {
                        resolve(new HC09Helper());
                    }
                });  
            });
        });
    }
}