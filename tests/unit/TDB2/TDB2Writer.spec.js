const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { expect } = require('chai');
const { pipeline } = require('stream');

const TDB2Parser = require('../../../streams/TDB2/TDB2Parser');
const TDB2Writer = require('../../../streams/TDB2/TDB2Writer');

const testWritePath = path.join(__dirname, '../../data/TDB2/RosterTestWrite.db');
const tdb2Path = path.join(__dirname, '../../data/TDB2/TDB2_ROSTER.db');

const tdb2File = fs.readFileSync(tdb2Path);

let dbParser, dbWriter, outputBuffer, bufferToCompare;

describe('TDB2 writer unit tests', () => {
    before(function (done) {
        this.timeout(10000);
        const stream = fs.createReadStream(tdb2Path);
        dbParser = new TDB2Parser();

        stream.on('end', () => {
            done();
        });

        stream
            .pipe(dbParser);
    });

    describe('no changes to the file', () => {
        before(function (done) {
            this.timeout(10000);
            generateOutputBuffer(done);
        });

        it('files are equal', () => {
            testBufferHashes(outputBuffer, tdb2File);
        });
    });

    describe('small change to file', () => {
        before(function (done) {
            this.timeout(10000);

            dbParser.file.DCHT.records[0].PGID = 21560;
            dbParser.file.DCHT.records[1].PGID = 10439;
            generateOutputBuffer(done);
        });

        it('expected result', (done) => {
            const dbParser2 = new TDB2Parser();

            pipeline(
                fs.createReadStream(testWritePath),
                dbParser2,
                (err) => {
                    if (err) { console.error(err); }
                    expect(dbParser2.file.DCHT.records[0].PGID).to.equal(21560);
                    expect(dbParser2.file.DCHT.records[1].PGID).to.equal(10439);
                    done();
                }
            );
        });
    });

    describe('changing int length', () => {
        before(function (done) {
            this.timeout(10000);

            dbParser.file.DCHT.records[0].PGID = 63;
            generateOutputBuffer(done);
        });

        it('expected result', (done) => {
            const dbParser2 = new TDB2Parser();

            pipeline(
                fs.createReadStream(testWritePath),
                dbParser2,
                (err) => {
                    if (err) { console.error(err); }
                    expect(dbParser2.file.DCHT.records[0].PGID).to.equal(63);
                    expect(outputBuffer.length).to.equal(tdb2File.length - 2);
                    done();
                }
            );
        });
    });

    describe('changing first table, mid-record', () => {
        before(function (done) {
            this.timeout(10000);

            dbParser.file.DCHT.records[250].DDEP = 0;
            dbParser.file.DCHT.records[250].PPOS = 10;
            generateOutputBuffer(done);
        });

        it('expected result', (done) => {
            const dbParser2 = new TDB2Parser();

            pipeline(
                fs.createReadStream(testWritePath),
                dbParser2,
                (err) => {
                    if (err) { console.error(err); }
                    expect(dbParser2.file.DCHT.records[250].DDEP).to.equal(0);
                    expect(dbParser2.file.DCHT.records[250].PPOS).to.equal(10);
                    done();
                }
            );
        });
    });

    describe('changing mid table, string value', () => {
        before(function (done) {
            this.timeout(10000);

            dbParser.file.PLAY.records[150].PEPS = 'PanettaMatthew_2377';
            generateOutputBuffer(done);
        });

        it('expected result', (done) => {
            const dbParser2 = new TDB2Parser();

            pipeline(
                fs.createReadStream(testWritePath),
                dbParser2,
                (err) => {
                    if (err) { console.error(err); }
                    expect(dbParser2.file.PLAY.records[150].PEPS).to.equal('PanettaMatthew_2377');
                    done();
                }
            );
        });
    });

    describe('changing mid table, negative int value', () => {
        before(function (done) {
            this.timeout(10000);

            dbParser.file.PLAY.records[150].PLHY = -29;
            generateOutputBuffer(done);
        });

        it('expected result', (done) => {
            const dbParser2 = new TDB2Parser();

            pipeline(
                fs.createReadStream(testWritePath),
                dbParser2,
                (err) => {
                    if (err) { console.error(err); }
                    expect(dbParser2.file.PLAY.records[150].PLHY).to.equal(-29);
                    done();
                }
            );
        });
    });

    describe('changing mid table, negative int value to positive', () => {
        before(function (done) {
            this.timeout(10000);

            dbParser.file.PLAY.records[150].PLHY = 1;
            generateOutputBuffer(done);
        });

        it('expected result', (done) => {
            const dbParser2 = new TDB2Parser();

            pipeline(
                fs.createReadStream(testWritePath),
                dbParser2,
                (err) => {
                    if (err) { console.error(err); }
                    expect(dbParser2.file.PLAY.records[150].PLHY).to.equal(1);
                    done();
                }
            );
        });
    });

    describe('changing mid table, positive int value to negative', () => {
        before(function (done) {
            this.timeout(10000);

            dbParser.file.PLAY.records[150].PGID = -100;
            generateOutputBuffer(done);
        });

        it('expected result', (done) => {
            const dbParser2 = new TDB2Parser();

            pipeline(
                fs.createReadStream(testWritePath),
                dbParser2,
                (err) => {
                    if (err) { console.error(err); }
                    expect(dbParser2.file.PLAY.records[150].PGID).to.equal(-100);
                    done();
                }
            );
        });
    });

    describe('changing multiple tables', () => {
        before(function (done) {
            this.timeout(10000);

            dbParser.file.PLAY.records[2].PEPS = 'PanettaMatthew_2377';
            dbParser.file.PLAY.records[1205].BSPT = 3.92;
            dbParser.file.INJY.records[6].INJR = 3;
            generateOutputBuffer(done);
        });

        it('expected result', (done) => {
            const dbParser2 = new TDB2Parser();

            pipeline(
                fs.createReadStream(testWritePath),
                dbParser2,
                (err) => {
                    if (err) { console.error(err); }
                    expect(dbParser2.file.PLAY.records[2].PEPS).to.equal('PanettaMatthew_2377');
                    expect(dbParser2.file.PLAY.records[1205].BSPT).to.be.closeTo(3.92, 0.1);
                    expect(dbParser2.file.INJY.records[6].INJR).to.equal(3);
                    done();
                }
            );
        });
    });

    function generateOutputBuffer(done) {
        outputBuffers = []
        dbWriter = new TDB2Writer(dbParser.file);

        dbWriter.on('end', () => {
            outputBuffer = Buffer.concat(outputBuffers);
            fs.writeFileSync(testWritePath, outputBuffer);
            done();
        });
        
        dbWriter.on('data', (chunk) => {
            outputBuffers.push(chunk);
        });
    };
});

function testBufferHashes(bufferToTest, bufferToCompare) {
    let testHash = crypto.createHash('sha1');
    testHash.update(bufferToTest);

    let compareHash = crypto.createHash('sha1');
    compareHash.update(bufferToCompare);

    expect(testHash.digest('hex')).to.eql(compareHash.digest('hex'));
};