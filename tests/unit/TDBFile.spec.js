const fs = require('fs');
const path = require('path');
// const debug = require('debug')('mft');
const concat = require('concat-stream');
const expect = require('chai').expect;

const tdbPath = path.join(__dirname, '../data/HC09_TDB.db');
const TDBParser = require('../../streams/TDBParser');

let dbParser;

describe('TOCFile unit tests', () => {
    before((done) => {
        dbParser = new TDBParser();

        const stream = fs.createReadStream(tdbPath);

        stream.on('end', () => {
            done();
        });

        stream
            .pipe(dbParser);
    });

    describe('header', () => {
        it('dbUnknown', () => {
            expect(dbParser.file.header.digit).to.eql(17474);
        });
        
        it('version', () => {
            expect(dbParser.file.header.version).to.eql(8);
        });
        
        it('unknown1', () => {
            expect(dbParser.file.header.unknown1).to.eql(16777216);
        });

        it('dbSize', () => {
            expect(dbParser.file.header.dbSize).to.eql(4123196);
        });

        it('zero', () => {
            expect(dbParser.file.header.zero).to.eql(0);
        });

        it('numTables', () => {
            expect(dbParser.file.header.numTables).to.eql(208);
        });

        it('unknown2', () => {
            expect(dbParser.file.header.unknown2).to.eql(2010575941);
        });
    });

    describe('definitions', () => {
        it('correct definition count', () => {
            expect(dbParser.file.definitions.length).to.equal(208);
        });

        it('AWPL', () => {
            expect(dbParser.file.definitions[0]).to.eql({
                'name': 'AWPL',
                'offset': 0
            });
        });

        it('IRST', () => {
            expect(dbParser.file.definitions[22]).to.eql({
                'name': 'IRST',
                'offset': 89316
            });
        });

        it('UQIO', () => {
            expect(dbParser.file.definitions[207]).to.eql({
                'name': 'UQIO',
                'offset': 4119976
            });
        });
    });

    describe('tables', () => {
        it('correct table count', () => {
            expect(dbParser.file.tables.length).to.eql(208);
        });

        describe('AWPL', () => {
            it('header', () => {
                const awpl = dbParser.file.AWPL;
                expect(awpl.header).to.eql({
                    'priorCrc': 3374511333,
                    'dataAllocationType': 2,
                    'lengthBytes': 96,
                    'lengthBits': 767,
                    'zero': 0,
                    'maxRecords': 660,
                    'currentRecords': 49,
                    'unknown2': 65535,
                    'numFields': 30,
                    'indexCount': 0,
                    'zero2': 0,
                    'zero3': 0,
                    'headerCrc': 2357557338
                });
            });

            describe('field definitions', () => {
                it('correct field length', () => {
                    const awpl = dbParser.file.AWPL;
                    expect(awpl.fieldDefinitions.length).to.equal(30);
                });

                it('1CTS', () => {
                    const awpl = dbParser.file.AWPL;
                    const field = awpl.fieldDefinitions[0];

                    expect(field.type).to.equal(3);
                    expect(field.offset).to.equal(0);
                    expect(field.name).to.equal('1CTS');
                    expect(field.bits).to.equal(32);
                });

                it('DIGC', () => {
                    const awpl = dbParser.file.AWPL;
                    const field = awpl.fieldDefinitions[23];

                    expect(field.type).to.equal(3);
                    expect(field.offset).to.equal(708);
                    expect(field.name).to.equal('DIGC');
                    expect(field.bits).to.equal(2);
                });
            });
        });
    });
});