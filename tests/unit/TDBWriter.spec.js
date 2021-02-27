const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const TDBParser = require('../../streams/TDBParser');
const TDBWriter = require('../../streams/TDBWriter');

const testWritePath = '../data/HC09_WriteTest.db';
const tdbPath = path.join(__dirname, '../data/HC09_TDB.db');
const tdbFile = fs.readFileSync(tdbPath);
const tdbFileOneChange = fs.readFileSync(path.join(__dirname, '../data/DBAfterOneChange.db'));
const tdbFileChangeLastTable = fs.readFileSync(path.join(__dirname, '../data/ChangeLastTable.db'));
let dbParser, dbWriter, outputBuffer, bufferToCompare;

const BitView = require('bit-buffer').BitView;

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

    describe('make changes on the last table', () => {
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

    // describe('HC09 test', () => {
    //     it('test change name', (done) => {
    //         const readStream = fs.createReadStream(tdbPath);
    //         const parser = new TDBParser();
    
    //         readStream.on('end', () => {
    //             console.timeEnd('read');

    //             console.time('read records');
    //             const play = parser.file.PLAY;
    
    //             play.readRecords()
    //                 .then(() => {
    //                     console.timeEnd('read records');

    //                     // const firstRecord = ;
                        
    //                     console.time('modifications');
    //                     parser.file.PLAY.records[0].fields['PFNA'].value = 'Test';
    //                     parser.file.PLAY.records[0].fields['PLNA'].value = 'Testson';
    //                     console.timeEnd('modifications');
    
    //                     console.time('init writer');
    //                     const writer = new TDBWriter(parser.file);
    //                     console.timeEnd('init writer');

    //                     const writeStream = fs.createWriteStream(path.join(__dirname, testWritePath));

    //                     writeStream.on('close', () => {
    //                         done();
    //                     });
    
    //                     writer
    //                         .pipe(writeStream);
    //                 });
    //         });

    //         console.time('read');
    //         readStream.pipe(parser);
    //     });
    // });

    function generateOutputBuffer(done) {
        outputBuffer = Buffer.from([]);
        dbWriter = new TDBWriter(dbParser.file);

        dbWriter.on('end', () => {
            done();
            // fs.writeFileSync(path.join(__dirname, '../data/HC09_WriteTest.db'), outputBuffer);
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
            compare(0x18, 0x698);
        });

        it('expected EOF CRC', () => {
            compare(0x3EEA38, 0x3EEA3C);
        });
    
        it('expected rest of file', () => {
            compare(0, 0x3EEA3C);
        });
    
        describe('expected first table', () => {
            it('header', () => {
                compare(0x698, 0x6C0);
            });
    
            it('field definitions', () => {
                compare(0x6C0, 0x8A0);
            });
    
            it('table data', () => {
                compare(0x8A0, 0x10020);
            });
        });
    
        describe('expected second table', () => {
            it('header', () => {
                compare(0x10020, 0x10048);
            });
    
            it('field definitions', () => {
                compare(0x10048, 0x10088);
            });

            it('table data', () => {
                compare(0x10088, 0x128C0);
            });
        });
    
        describe('expected third table', () => {
            it('header', () => {
                compare(0x128C0, 0x128E8);
            });
    
            it('field definitions', () => {
                compare(0x128E8, 0x12908);
            });
        });
    
        describe('expected last table', () => {
            it('header', () => {
                compare(0x3EE440, 0x3EE468);
            });
    
            it('field definitions', () => {
                compare(0x3EE468, 0x3EE498);
            });
    
            it('table data', () => {
                compare(0x3EE498, 0x3EEA38);
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