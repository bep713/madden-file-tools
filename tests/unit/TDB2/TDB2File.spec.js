const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;

const tdbPath = path.join(__dirname, '../../data/TDB2/TDB2_ROSTER.db');
const TDB2Parser = require('../../../streams/TDB2/TDB2Parser');

let dbParser;

describe('TDBv2 File unit tests', () => {
    before(function(done) {
        this.timeout(10000);
        console.time('parse');
        dbParser = new TDB2Parser();

        const stream = fs.createReadStream(tdbPath);

        stream.on('end', () => {
            console.timeEnd('parse');
            done();
        });

        stream
            .pipe(dbParser);
    });

    describe('DCHT', () => {
        it('expected table header', () => {
            expect(dbParser.file.tables[0].offset).to.equal(0);
            expect(dbParser.file.tables[0].name).to.equal('DCHT');
            expect(dbParser.file.tables[0].type).to.equal(4);
            expect(dbParser.file.tables[0].unknown1).to.equal(3);
            expect(dbParser.file.tables[0].numEntries).to.equal(3173);
            expect(dbParser.file.DCHT.numEntries).to.equal(3173);
            expect(dbParser.file.DCHT.rawKey).to.eql(Buffer.from([0x92, 0x3A, 0x34, 0x04, 0x03]));
        });

        describe('field definitions', () => {
            const tableName = 'DCHT';

            it('DDEP', () => {
                const table = dbParser.file[tableName];
                const field = table.fieldDefinitions[0];

                expect(field.type).to.equal(0);
                expect(field.offset).to.equal(-1);
                expect(field.name).to.equal('DDEP');
                expect(field.bits).to.equal(-1);
                expect(field.maxValue).to.equal(-1);
            });

            it('TGID', () => {
                const table = dbParser.file[tableName];
                const field = table.fieldDefinitions[3];

                expect(field.type).to.equal(0);
                expect(field.offset).to.equal(-1);
                expect(field.name).to.equal('TGID');
                expect(field.bits).to.equal(-1);
                expect(field.maxValue).to.equal(-1);
            });
        });

        describe('first record', () => {
            it('DDEP', () => {
                expect(dbParser.file.tables[0].records[0].fields['DDEP']).to.exist;
                expect(dbParser.file.tables[0].records[0].fields['DDEP'].value).to.equal(0);
                expect(dbParser.file.tables[0].records[0].fields['DDEP'].rawKey).to.eql(Buffer.from([0x92, 0x49, 0x70, 0x00]));
            });

            it('PGID', () => {
                expect(dbParser.file.tables[0].records[0].fields['PGID'].value).to.equal(10439);
                expect(dbParser.file.tables[0].records[0].fields['PGID'].rawKey).to.eql(Buffer.from([0xC2, 0x7A, 0x64, 0x00]));
            });

            it('PPOS', () => {
                expect(dbParser.file.tables[0].records[0].fields['PPOS'].value).to.equal(0);
                expect(dbParser.file.tables[0].records[0].fields['PPOS'].rawKey).to.eql(Buffer.from([0xC3, 0x0B, 0xF3, 0x00]));
            });

            it('TGID', () => {
                expect(dbParser.file.tables[0].records[0].fields['TGID'].value).to.equal(1);
                expect(dbParser.file.tables[0].records[0].fields['TGID'].rawKey).to.eql(Buffer.from([0xD2, 0x7A, 0x64, 0x00]));
            });
        });

        describe('second record', () => {
            it('DDEP', () => {
                expect(dbParser.file.tables[0].records[1].fields['DDEP'].value).to.equal(1);
            });

            it('PGID', () => {
                expect(dbParser.file.tables[0].records[1].fields['PGID'].value).to.equal(21560);
            });

            it('PPOS', () => {
                expect(dbParser.file.tables[0].records[1].fields['PPOS'].value).to.equal(0);
            });

            it('TGID', () => {
                expect(dbParser.file.tables[0].records[1].fields['TGID'].value).to.equal(1);
            });

            it('index', () => {
                expect(dbParser.file.tables[0].records[1].index).to.equal(1);
            });
        });

        describe('random record', () => {
            it('DDEP', () => {
                expect(dbParser.file.tables[0].records[1580].fields['DDEP'].value).to.equal(1);
            });

            it('PGID', () => {
                expect(dbParser.file.tables[0].records[1580].fields['PGID'].value).to.equal(24430);
            });

            it('PPOS', () => {
                expect(dbParser.file.tables[0].records[1580].fields['PPOS'].value).to.equal(31);
            });

            it('TGID', () => {
                expect(dbParser.file.tables[0].records[1580].fields['TGID'].value).to.equal(16);
            });

            it('index', () => {
                expect(dbParser.file.tables[0].records[1580].index).to.equal(1580);
            });
        });

        describe('last record', () => {
            it('DDEP', () => {
                expect(dbParser.file.tables[0].records[3172].fields['DDEP'].value).to.equal(2);
            });

            it('PGID', () => {
                expect(dbParser.file.tables[0].records[3172].fields['PGID'].value).to.equal(17713);
            });

            it('PPOS', () => {
                expect(dbParser.file.tables[0].records[3172].fields['PPOS'].value).to.equal(32);
            });

            it('TGID', () => {
                expect(dbParser.file.tables[0].records[3172].fields['TGID'].value).to.equal(32);
            });

            it('index', () => {
                expect(dbParser.file.tables[0].records[3172].index).to.equal(3172);
            });
        });
    });

    describe('INJY', () => {
        it('expected table header', () => {
            expect(dbParser.file.INJY.offset).to.equal(0x11BC2);
            expect(dbParser.file.INJY.name).to.equal('INJY');
            expect(dbParser.file.INJY.type).to.equal(4);
            expect(dbParser.file.INJY.unknown1).to.equal(3);
            expect(dbParser.file.INJY.numEntries).to.equal(40);
        });

        it('first record', () => {
            const record = dbParser.file.INJY.records[0];
            expect(record.PGID).to.equal(915);
            expect(record.TGID).to.equal(10);
            expect(record.INIR).to.equal(1);
            expect(record.INJR).to.equal(0);
            expect(record.INJS).to.equal(5);
            expect(record.INJT).to.equal(5);
            expect(record.INJL).to.equal(253);
            expect(record.INTW).to.equal(5);
        });
    });
    
    describe('PLAY', () => {
        describe('field definitions', () => {
            const tableName = 'PLAY';

            it('PFNA', () => {
                const table = dbParser.file[tableName];
                const field = table.fieldDefinitions[50];

                expect(field.type).to.equal(1);
                expect(field.offset).to.equal(-1);
                expect(field.name).to.equal('PFNA');
                expect(field.bits).to.equal(-1);
                expect(field.maxValue).to.equal(-1);
            });

            it('BSBT', () => {
                const table = dbParser.file[tableName];
                const field = table.fieldDefinitions[3];

                expect(field.type).to.equal(10);
                expect(field.offset).to.equal(-1);
                expect(field.name).to.equal('BSBT');
                expect(field.bits).to.equal(-1);
                expect(field.maxValue).to.equal(-1);
            });
        });

        it('expected table header', () => {
            expect(dbParser.file.PLAY.offset).to.equal(0x122B7);
            expect(dbParser.file.PLAY.name).to.equal('PLAY');
            expect(dbParser.file.PLAY.type).to.equal(4);
            expect(dbParser.file.PLAY.unknown1).to.equal(3);
            expect(dbParser.file.PLAY.numEntries).to.equal(2922);
        });

        it('first record', () => {
            const record = dbParser.file.PLAY.records[0];
            expect(record.BSAA).to.be.closeTo(0.399, 0.1);
            expect(record.BSAT).to.eql(0.0);
            expect(record.BSBA).to.be.closeTo(0.548, 0.1);
            expect(record.PEPS).to.equal('SmithGeno_112');
            expect(record.PGHE).to.equal(201);
            expect(record.index).to.equal(0);
        });

        it('reads negative values as expected', () => {
            const record = dbParser.file.PLAY.records[10];
            expect(record.PLHY).to.equal(-31);
        });
    });

    describe('TEAM', () => {
        it('expected table header', () => {
            expect(dbParser.file.TEAM.offset).to.equal(0x35CC54);
            expect(dbParser.file.TEAM.name).to.equal('TEAM');
            expect(dbParser.file.TEAM.type).to.equal(4);
            expect(dbParser.file.TEAM.unknown1).to.equal(3);
            expect(dbParser.file.TEAM.numEntries).to.equal(33);
        });

        it('first record', () => {
            const record = dbParser.file.TEAM.records[0];
            expect(record.AFLD).to.equal('');
            expect(record.ATPB).to.equal(0);
            expect(record.TDAN).to.equal('teamdb_Bears');
            expect(record.TROL).to.equal(72);
            expect(dbParser.file.TEAM.records[0].fields['TROL'].isChanged).to.equal(false);
            expect(record.index).to.equal(0);
        });
    });

    describe('can edit the file', () => {
        it('int', () => {
            dbParser.file.DCHT.records[20].fields['DDEP'].value = 0;
            expect(dbParser.file.DCHT.records[20].fields['DDEP'].value).to.equal(0);
            expect(dbParser.file.DCHT.records[20].fields['DDEP'].isChanged).to.equal(true);
        });

        it('int (more bytes)', () => {
            dbParser.file.DCHT.records[226].fields['PGID'].value = 20935;
            expect(dbParser.file.DCHT.records[226].fields['PGID'].value).to.equal(20935);
            expect(dbParser.file.DCHT.records[226].fields['PGID'].isChanged).to.equal(true);
        });

        it('int (negative)', () => {
            dbParser.file.PLAY.records[2].fields['PLHY'].value = -30;
            expect(dbParser.file.PLAY.records[2].fields['PLHY'].value).to.equal(-30);
            expect(dbParser.file.PLAY.records[2].fields['PLHY'].isChanged).to.equal(true);
        });

        it('string', () => {
            dbParser.file.TEAM.records[0].TDAN = 'Test';
            expect(dbParser.file.TEAM.records[0].TDAN).to.equal('Test');
            expect(dbParser.file.TEAM.records[0].fields['TDAN'].length).to.equal(5); // count the 00 at the end of the string
            expect(dbParser.file.TEAM.records[0].fields['TDAN'].isChanged).to.equal(true);
        });

        it('float', () => {
            dbParser.file.PLAY.records[0].BSAA = 0.59;
            expect(dbParser.file.PLAY.records[0].BSAA).to.be.closeTo(0.59, 0.1);
            expect(dbParser.file.PLAY.records[0].fields['BSAA'].isChanged).to.be.true;
        });
    });
});