const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const NCAAB10Helper = require('../../helpers/NCAAB10Helper');
const ncaaRosterFilePath = path.join(__dirname, '../data/NCAAB10RosterSYSDATA');
const ncaaDynastyFilePath = path.join(__dirname, '../data/NCAAB10DynastySYSDATA');
const testWritePath = path.join(__dirname, '../data/NCAAB10_WriteTest.db');

describe('NCAAB10 Helper unit tests', () => {
    describe('can read in a file', async () => {
        let file, helper, tdbFile;

        before(async () => {
            file = fs.readFileSync(ncaaRosterFilePath);
    
            helper = new NCAAB10Helper();
            tdbFile = await helper.load(ncaaRosterFilePath);
        });

        it('header buffers are equal', () => {
            testBufferHashes(tdbFile.headerBuffer, file.slice(0x1C, 0x34));
        });

        it('definition buffers are equal', () => {
            testBufferHashes(tdbFile.definitionBuffer, file.slice(0x34, 0x5C));
        });
    });

    describe('can write a file', () => {
        let file, helper, tdbFile;

        before(async () => {
            file = fs.readFileSync(ncaaRosterFilePath);
            fs.writeFileSync(testWritePath, file);
    
            helper = new NCAAB10Helper();
            tdbFile = await helper.load(ncaaRosterFilePath);
            await helper.save(testWritePath);
        });

        it('files are equal', () => {
            const writeFile = fs.readFileSync(testWritePath);
            testBufferHashes(file, writeFile);
        });

        it('can write to original file path', async () => {
            const original = fs.readFileSync(testWritePath);

            const newHelper = new NCAAB10Helper();
            const file = await newHelper.load(testWritePath);
            await newHelper.save();

            const compare = fs.readFileSync(testWritePath);

            testBufferHashes(original, compare);
        });

        it('can write to new file path', async () => {
            const original = fs.readFileSync(testWritePath);

            const newHelper = new NCAAB10Helper();
            const file = await newHelper.load(testWritePath);
            const newPath = path.join(__dirname, '../data/NCAAB10HelperWriteTest.db');
            await newHelper.save(newPath);

            const compare = fs.readFileSync(newPath);

            testBufferHashes(original, compare);
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