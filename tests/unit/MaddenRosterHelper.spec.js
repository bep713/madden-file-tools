const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const MaddenRosterHelper = require('../../helpers/MaddenRosterHelper');
const dbRosterPath = path.join(__dirname, '../data/M20_Roster-Official');
const tdb2RosterPath = path.join(__dirname, '../data/M22_ROSTER-Official');
const testWritePath = path.join(__dirname, '../data/TDB2/ROSTER-OfficialWriteTest');

describe('MaddenRosterHelper unit tests', () => {
    describe('M21+', async () => {
        let file, helper, tdb2File;

        before(async () => {
            file = fs.readFileSync(tdb2RosterPath);
    
            helper = new MaddenRosterHelper();
            tdb2File = await helper.load(tdb2RosterPath);
        });

        describe('can read in the file', () => {
            it('expected number of tables', () => {
                expect(helper.file.tables.length).to.equal(4);
            });
        });

        describe('can save the file', () => {
            describe('no changes', () => {
                before(async function () {
                    this.timeout(35000);
                    file = fs.readFileSync(tdb2RosterPath);
                    fs.writeFileSync(testWritePath, file);
            
                    helper = new MaddenRosterHelper();
                    tdbFile = await helper.load(tdb2RosterPath);
                    await helper.save(testWritePath);
                });
        
                it('files are equal', () => {
                    const writeFile = fs.readFileSync(testWritePath);
                    testBufferHashes(file, writeFile);
                });
            });

            describe('changed file size', () => {
                before(async function () {
                    this.timeout(35000);
                    file = fs.readFileSync(tdb2RosterPath);
                    fs.writeFileSync(testWritePath, file);
            
                    helper = new MaddenRosterHelper();
                    tdbFile = await helper.load(tdb2RosterPath);
                    tdbFile.DCHT.records[0].PGID = 1;
                    await helper.save(testWritePath);
                });
        
                it('expected uncompressed size', () => {
                    const writeFile = fs.readFileSync(testWritePath);
                    expect(writeFile.readUInt32LE(0x12)).to.eql(3544304);
                });
            });
        });
    });

    describe('M20-', async () => {
        let file, helper, dbFile;

        before(async () => {
            file = fs.readFileSync(dbRosterPath);
    
            helper = new MaddenRosterHelper();
            dbFile = await helper.load(dbRosterPath);
        });

        describe('can read in the file', () => {
            it('expected number of tables', () => {
                expect(helper.file.tables.length).to.equal(6);
            });
        });

        describe('can save the file', () => {
            before(async function () {
                this.timeout(10000);
                file = fs.readFileSync(dbRosterPath);
                fs.writeFileSync(testWritePath, file);
        
                helper = new MaddenRosterHelper();
                tdbFile = await helper.load(dbRosterPath);
                await helper.save(testWritePath);
            });
    
            it('files are equal', () => {
                const writeFile = fs.readFileSync(testWritePath);
                testBufferHashes(file, writeFile);
            });
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