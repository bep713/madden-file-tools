const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const HC09Helper = require('../../helpers/HC09Helper');
const hc09FilePath = path.join(__dirname, '../data/HC09USRDATA');
const testWritePath = path.join(__dirname, '../data/HC09_WriteTest.db');

describe('HC09 Helper unit tests', () => {
    describe('can read in a file', async () => {
        let file, helper, tdbFile;

        before(async () => {
            file = fs.readFileSync(hc09FilePath);
    
            helper = new HC09Helper();
            tdbFile = await helper.load(hc09FilePath);
        });

        it('header buffers are equal', () => {
            testBufferHashes(tdbFile.headerBuffer, file.slice(0x1ADCBC, 0x1ADCD4));
        });

        it('definition buffers are equal', () => {
            testBufferHashes(tdbFile.definitionBuffer, file.slice(0x1ADCD4, 0x1AE354));
        });

        // it('table buffers are equal', () => {
        //     let bufferCurrentIndex = 0x1AE354;

        //     tdbFile.tables.forEach((table) => {
        //         describe(table.name, () => {
        //             it('header buffers match', () => {
        //                 testBufferHashes(table.headerBuffer, file.slice(bufferCurrentIndex, bufferCurrentIndex + table.headerBuffer.length));
        //                 bufferCurrentIndex += table.headerBuffer.length;
        //             });
    
        //             it('field buffers match', () => {
        //                 testBufferHashes(table.fieldDefinitionBuffer, file.slice(bufferCurrentIndex, bufferCurrentIndex + table.fieldDefinitionBuffer.length));
        //                 bufferCurrentIndex += table.fieldDefinitionBuffer.length;
        //             });

        //             if (table.dataBuffer) {
        //                 it('data buffers match', () => {
        //                     testBufferHashes(table.dataBuffer, file.slice(bufferCurrentIndex, bufferCurrentIndex + table.dataBuffer.length));
        //                     bufferCurrentIndex += table.dataBuffer.length;
        //                 });
        //             }
        //         });
        //     });
        // });
    });

    describe('can write a file', () => {
        let file, helper, tdbFile;

        before(async () => {
            file = fs.readFileSync(hc09FilePath);
            fs.writeFileSync(testWritePath, file);
    
            helper = new HC09Helper();
            tdbFile = await helper.load(hc09FilePath);
            await helper.save(testWritePath);
        });

        it('files are equal', () => {
            const writeFile = fs.readFileSync(testWritePath);
            testBufferHashes(file, writeFile);
        });
    });
});

function testBufferHashes(bufferToTest, bufferToCompare) {
    let testHash = crypto.createHash('sha1');
    testHash.update(bufferToTest);

    let compareHash = crypto.createHash('sha1');
    compareHash.update(bufferToCompare);

    expect(testHash.digest('hex')).to.eql(compareHash.digest('hex'));
};