const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const TDBParser = require('../../streams/TDBParser');
const TDBWriter = require('../../streams/TDBWriter');

const testWritePath = path.join(__dirname, '../data/HC09_WriteTest.db');
const tdbPath = path.join(__dirname, '../data/HC09_TDB.db');
const tdb2Path = path.join(__dirname, '../data/ncaa-test.db');
const tdbFile = fs.readFileSync(tdbPath);
const tdbFileOneChange = fs.readFileSync(path.join(__dirname, '../data/DBAfterOneChange.db'));
const tdbFileChangeLastTable = fs.readFileSync(path.join(__dirname, '../data/ChangeLastTable.db'));

const streameddataPath = path.join(__dirname, '../data/streameddata.DB');
const streameddataDBFile = fs.readFileSync(streameddataPath);

let dbParser, dbWriter, outputBuffer, bufferToCompare;

const { pipeline } = require('stream');

describe('TDB Writer unit tests', () => {
    before(function (done) {
        this.timeout(10000);
        const stream = fs.createReadStream(tdbPath);
        dbParser = new TDBParser();

        stream.on('end', () => {
            done();
        });

        stream
            .pipe(dbParser);
    });

    describe('no changes to file', () => {
        before(function (done) {
            this.timeout(10000);
            bufferToCompare = tdbFile;
            generateOutputBuffer(done);
        });

        testBuffers();
    });

    describe('single change', () => {
        before(function (done) {
            this.timeout(10000);

            bufferToCompare = tdbFileOneChange;

            dbParser.file.AWPL.readRecords()
                .then(() => {
                    dbParser.file.AWPL.records[0].fields['STC1'].value = 20;
                    generateOutputBuffer(done);
                });
        });

        testBuffers();
    });

    describe('make changes on the second to last table', () => {
        before(function (done) {
            this.timeout(10000);

            bufferToCompare = tdbFileChangeLastTable;

            dbParser.file.AWPL.records[0].fields['STC1'].value = 0;

            dbParser.file.UQIO.readRecords()
                .then(() => {
                    dbParser.file.UQIO.records[2].fields['QITM'].value = 102;
                    dbParser.file.UQIO.records[2].fields['QIIA'].value = 0;
                    dbParser.file.UQIO.records[20].fields['QIIA'].value = 0;
                    dbParser.file.UQIO.records[113].fields['QITM'].value = 99;
                    dbParser.file.UQIO.records[151].fields['QIEA'].value = 1;
                    generateOutputBuffer(done);
                });
        });

        testBuffers();
    });

    describe('make changes on the last table (uncompressed strings)', () => {
        let newReadParser;

        before(function (done) {
            this.timeout(10000);

            dbParser.file.EARE.readRecords()
                .then(() => {
                    dbParser.file.EARE.records[0].fields['ENDN'].value = 'Disagree';
                    dbParser.file.EARE.records[0].fields['AGDE'].value = 'Testing123';
                    dbParser.file.EARE.records[20].fields['ENDN'].value = 'Anotha test';
                    dbParser.file.EARE.records[23].fields['ENSN'].value = 'OK, last test.';
                    
                    const writer = new TDBWriter(dbParser.file);

                    pipeline(
                        writer,
                        fs.createWriteStream(testWritePath),
                        (err) => {
                            if (err) {
                                console.error(err);
                                done();
                            }

                            newReadParser = new TDBParser();

                            pipeline(
                                fs.createReadStream(testWritePath),
                                newReadParser,
                                (err) => {
                                    if (err) {
                                        console.error(err);
                                        done();
                                    }

                                    newReadParser.file.EARE.readRecords()
                                        .then(() => {
                                            done();
                                        });
                                }
                            )
                        }
                    )
                });
        });

        it('edit successfully wrote and file was successfully parsed again', () => {
            expect(newReadParser.file.EARE.records[0].ENDN).to.eql('Disagree');
            expect(newReadParser.file.EARE.records[0].AGDE).to.eql('Testing123');
            expect(newReadParser.file.EARE.records[20].ENDN).to.eql('Anotha test');
            expect(newReadParser.file.EARE.records[23].ENSN).to.eql('OK, last test.');
        });
    });

    describe('make changes to table with 1 record', () => {
        let newReadParser, dbParser2;

        before(function (done) {
            this.timeout(10000);

            const stream = fs.createReadStream(tdb2Path);
            dbParser2 = new TDBParser();

            stream.on('end', () => {
                readRecords(done);
            });

            stream
                .pipe(dbParser2);

            function readRecords(done) {
                dbParser2.file.SEAI.readRecords()
                    .then(() => {
                        dbParser2.file.SEAI.records[0].fields['SEWN'].value = 21;
                        dbParser2.file.SEAI.records[0].fields['SEWT'].value = 7;
                        
                        const writer = new TDBWriter(dbParser2.file);
    
                        pipeline(
                            writer,
                            fs.createWriteStream(testWritePath),
                            (err) => {
                                if (err) {
                                    console.error(err);
                                    done();
                                }
    
                                newReadParser = new TDBParser();
    
                                pipeline(
                                    fs.createReadStream(testWritePath),
                                    newReadParser,
                                    (err) => {
                                        if (err) {
                                            console.error(err);
                                            done();
                                        }
    
                                        newReadParser.file.SEAI.readRecords()
                                            .then(() => {
                                                done();
                                            });
                                    }
                                )
                            }
                        )
                    });
            }
        });

        it('edit successfully wrote and file was successfully parsed again', () => {
            expect(newReadParser.file.SEAI.records[0].SEWN).to.eql(21);
            expect(newReadParser.file.SEAI.records[0].SEWT).to.eql(7);
        });
    });

    describe('can change huffman table fields', () => {
        before(function (done) {
            this.timeout(10000);
            const stream = fs.createReadStream(streameddataPath);
            dbParser = new TDBParser();
    
            stream.on('end', () => {
                done();
            });
    
            stream
                .pipe(dbParser);
        });

        describe('no changes', () => {
            before(function (done) {
                this.timeout(10000);
                bufferToCompare = streameddataDBFile;
                generateOutputBuffer(done);
            });
    
            testBuffers();
        });

        describe('changing huffman field', () => {
            let newReadParser;

            before(function (done) {
                this.timeout(10000);
                
                dbParser.file.LCLS.readRecords()
                    .then(() => {
                        dbParser.file.LCLS.records[20].LCLT = "Testing compressed string change.";
                        const writer = new TDBWriter(dbParser.file);

                        pipeline(
                            writer,
                            fs.createWriteStream(testWritePath),
                            (err) => {
                                if (err) {
                                    console.error(err);
                                    done();
                                }

                                newReadParser = new TDBParser();

                                pipeline(
                                    fs.createReadStream(testWritePath),
                                    newReadParser,
                                    (err) => {
                                        if (err) {
                                            console.error(err);
                                            done();
                                        }

                                        newReadParser.file.LCLS.readRecords()
                                            .then(() => {
                                                done();
                                            });
                                    }
                                )
                            }
                        )
                    });
            });
    
            it('edit successfully wrote and file was successfully parsed again', () => {
                expect(newReadParser.file.LCLS.records[20].LCLT).to.eql("Testing compressed string change.");
            });
        });
    });

    function generateOutputBuffer(done) {
        outputBuffer = Buffer.from([]);
        dbWriter = new TDBWriter(dbParser.file);

        dbWriter.on('end', () => {
            done();
            fs.writeFileSync(path.join(__dirname, '../data/HC09_WriteTest.db'), outputBuffer);
        });
        
        dbWriter.on('data', (chunk) => {
            outputBuffer = Buffer.concat([outputBuffer, chunk]);
        });

    };

    function testBuffers() {
        it('buffer lengths are the same', () => {
            expect(outputBuffer.length).to.eql(bufferToCompare.length); 
        });
    
        it('expected file header', () => {
            compare(0, 0x18);
        });
    
        it('expected table definitions', () => {
            compare(0x18, 0x6A0);
        });

        it('expected EOF CRC', () => {
            compare(0x3EED00, 0x3EED04);
        });
    
        it('expected rest of file', () => {
            compare(0, 0x3EED04);
        });
    
        describe('expected first table', () => {
            it('header', () => {
                compare(0x6A0, 0x6C8);
            });
    
            it('field definitions', () => {
                compare(0x6C8, 0x8A8);
            });
    
            it('table data', () => {
                compare(0x8A8, 0x10028);
            });
        });
    
        describe('expected second table', () => {
            it('header', () => {
                compare(0x10028, 0x10050);
            });
    
            it('field definitions', () => {
                compare(0x10050, 0x10090);
            });

            it('table data', () => {
                compare(0x10090, 0x128C8);
            });
        });
    
        describe('expected third table', () => {
            it('header', () => {
                compare(0x128C8, 0x128F0);
            });
    
            it('field definitions', () => {
                compare(0x128F0, 0x12910);
            });
        });

        describe('expected second to last table', () => {
            it('header', () => {
                compare(0x3EE448, 0x3EE470);
            });
    
            it('field definitions', () => {
                compare(0x3EE470, 0x3EE4A0);
            });
    
            it('table data', () => {
                compare(0x3EE4A0, 0x3EEA40);
            });
        });
    
        describe('expected last table', () => {
            it('header', () => {
                compare(0x3EEA40, 0x3EEA68);
            });
    
            it('field definitions', () => {
                compare(0x3EEA68, 0x3EEAA8);
            });
    
            it('table data', () => {
                compare(0x3EEAA8, 0x3EED00);
            });
        });
    };
    
    function compare(start, end) {
        const bufferToTest = outputBuffer.slice(start, end);
        let testHash = crypto.createHash('sha1');
        testHash.update(bufferToTest);

        const compare = bufferToCompare.slice(start, end);
        let compareHash = crypto.createHash('sha1');
        compareHash.update(compare);
    
        expect(testHash.digest('hex')).to.eql(compareHash.digest('hex'));
    };
});