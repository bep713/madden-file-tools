const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const concat = require('concat-stream');
const expect = require('chai').expect;
const TDBParser = require('../../streams/TDBParser');

const tdbPath = path.join(__dirname, '../data/HC09_TDB.db');
const littleEndianDbPath = path.join(__dirname, '../data/TDB_LittleEndian.db');

let dbParser;

describe('TDB File unit tests', () => {
    before(function(done) {
        this.timeout(10000);
        console.time('parse');
        dbParser = new TDBParser();

        const stream = fs.createReadStream(tdbPath);

        stream.on('end', () => {
            console.timeEnd('parse');
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

        it('endian', () => {
            expect(dbParser.file.header.endian).to.eql(1);
        });
        
        it('unknown1', () => {
            expect(dbParser.file.header.unknown1).to.eql(0);
        });

        it('unknown2', () => {
            expect(dbParser.file.header.unknown2).to.eql(0);
        });

        it('dbSize', () => {
            expect(dbParser.file.header.dbSize).to.eql(0x3EED04);
        });

        it('zero', () => {
            expect(dbParser.file.header.zero).to.eql(0);
        });

        it('numTables', () => {
            expect(dbParser.file.header.numTables).to.eql(209);
        });

        it('unknown3', () => {
            expect(dbParser.file.header.unknown3).to.eql(0x5B2A814C);
        });
    });

    describe('definitions', () => {
        it('correct definition count', () => {
            expect(dbParser.file.definitions.length).to.equal(209);
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

    describe('EOF CRC', () => {
        it('expected EOF CRC', () => {
            expect(dbParser.file.eofCrcBuffer).to.eql(Buffer.from([0x00, 0x06, 0x0A, 0x00]));
        });
    });

    describe('tables', () => {
        it('correct table count', () => {
            expect(dbParser.file.tables.length).to.eql(209);
        });

        describe('AWPL', () => {
            const tableName = 'AWPL';

            it('header', () => {
                const table = dbParser.file[tableName];
                expect(table.header).to.eql({
                    'priorCrc': 864092347,
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
                    const table = dbParser.file[tableName];
                    expect(table.fieldDefinitions.length).to.equal(30);
                });

                it('STC1', () => {
                    const table = dbParser.file[tableName];
                    const field = table.fieldDefinitions[0];

                    expect(field.type).to.equal(3);
                    expect(field.offset).to.equal(0);
                    expect(field.name).to.equal('STC1');
                    expect(field.bits).to.equal(32);
                    expect(field.maxValue).to.equal(4294967295);
                });

                it('CGID', () => {
                    const table = dbParser.file[tableName];
                    const field = table.fieldDefinitions[23];

                    expect(field.type).to.equal(3);
                    expect(field.offset).to.equal(708);
                    expect(field.name).to.equal('CGID');
                    expect(field.maxValue).to.equal(3);
                });
            });

            describe('records', () => {
                before((done) => {
                    dbParser.file[tableName].readRecords()
                        .then(() => { 
                            done(); 
                        });
                });

                it('correct number of records', () => {
                    const table = dbParser.file[tableName];
                    expect(table.records.length).to.equal(49);
                });

                it('parses first record correctly', () => {
                    const record = dbParser.file[tableName].records[0];

                    expect(record.STC1).to.equal(0);
                    expect(record.STI1).to.equal(0);
                    expect(record.STV1).to.equal(0);
                    expect(record.STC2).to.equal(0);
                    expect(record.STI2).to.equal(0);
                    expect(record.STV2).to.equal(0);
                    expect(record.STC3).to.equal(0);
                    expect(record.STI3).to.equal(0);
                    expect(record.STV3).to.equal(0);
                    expect(record.STC4).to.equal(0);
                    expect(record.STI4).to.equal(0);
                    expect(record.STV4).to.equal(0);
                    expect(record.STC5).to.equal(0);
                    expect(record.STI5).to.equal(0);
                    expect(record.STV5).to.equal(0);
                    expect(record.STC6).to.equal(0);
                    expect(record.STI6).to.equal(0);
                    expect(record.STV6).to.equal(0);
                    expect(record.STC7).to.equal(0);
                    expect(record.STI7).to.equal(0);
                    expect(record.STV7).to.equal(0);
                    expect(record.PFNA).to.equal('');
                    expect(record.PLNA).to.equal('');
                    expect(record.CGID).to.equal(0);
                    expect(record.PGID).to.equal(2);
                    expect(record.TGID).to.equal(0);
                    expect(record.SGNM).to.equal(0);
                    expect(record.SEWN).to.equal(0);
                    expect(record.PAas).to.equal(0);
                    expect(record.PAat).to.equal(0);

                    expect(record.index).to.equal(0);
                    expect(record.isPopulated).to.be.true;
                });

                describe('edit records', () => {
                    it('can edit integers', () => {
                        const record = dbParser.file[tableName].records[0];
                        record.STC1 = 20;
                        expect(record.STC1).to.equal(20);

                        console.time('get integer');
                        record.fields['STC2'].value;
                        console.timeEnd('get integer');

                        console.time('set integer');
                        record.fields['STC2'].value = 25;
                        console.timeEnd('set integer');

                        expect(record.STC2).to.equal(25);

                        expect(record.index).to.equal(0);
                        expect(record.isPopulated).to.be.true;
                    });

                    it('can edit integers - method #2', () => {
                        const record = dbParser.file[tableName].records[0];
                        record.fields['STC1'].value = 20;
                        expect(record.STC1).to.equal(20);
                    });

                    it('can edit strings', () => {
                        const record = dbParser.file[tableName].records[0];

                        console.time('get string');
                        record.fields['PFNA'].value
                        console.timeEnd('get string');

                        console.time('set string');
                        record.fields['PFNA'].value = 'Test';
                        console.timeEnd('set string');

                        expect(record.PFNA).to.equal('Test');
                    });
                });
            });
        });

        describe('PLRL', () => {
            const tableName = 'PLRL';

            it('header', () => {
                const table = dbParser.file[tableName];
                expect(table.header).to.eql({
                    'priorCrc': 1835962347,
                    'dataAllocationType': 26,
                    'lengthBytes': 8,
                    'lengthBits': 63,
                    'zero': 0,
                    'maxRecords': 1,
                    'currentRecords': 0,
                    'unknown2': 65535,
                    'numFields': 4,
                    'indexCount': 0,
                    'zero2': 0,
                    'zero3': 0,
                    'headerCrc': 2853884747
                });
            });

            describe('field definitions', () => {
                it('correct field length', () => {
                    const table = dbParser.file[tableName];
                    expect(table.fieldDefinitions.length).to.equal(4);
                });

                it('PGID', () => {
                    const table = dbParser.file[tableName];
                    const field = table.fieldDefinitions[0];

                    expect(field.type).to.equal(3);
                    expect(field.offset).to.equal(0);
                    expect(field.name).to.equal('PGID');
                    expect(field.bits).to.equal(15);
                });

                it('REST', () => {
                    const table = dbParser.file[tableName];
                    const field = table.fieldDefinitions[3];

                    expect(field.type).to.equal(3);
                    expect(field.offset).to.equal(26);
                    expect(field.name).to.equal('REST');
                    expect(field.bits).to.equal(6);
                });
            });
        });

        describe('PCKI', () => {
            const tableName = 'PCKI';

            it('header', () => {
                const table = dbParser.file[tableName];
                expect(table.header).to.eql({
                    'priorCrc': 1057093969,
                    'dataAllocationType': 2,
                    'lengthBytes': 36,
                    'lengthBits': 287,
                    'zero': 0,
                    'maxRecords': 352,
                    'currentRecords': 77,
                    'unknown2': 65535,
                    'numFields': 26,
                    'indexCount': 0,
                    'zero2': 0,
                    'zero3': 0,
                    'headerCrc': 605203516
                });
            });

            describe('field definitions', () => {
                it('correct field length', () => {
                    const table = dbParser.file[tableName];
                    expect(table.fieldDefinitions.length).to.equal(26);
                });

                it('cka0', () => {
                    const table = dbParser.file[tableName];
                    const field = table.fieldDefinitions[0];

                    expect(field.type).to.equal(3);
                    expect(field.offset).to.equal(8);
                    expect(field.name).to.equal('cka0');
                    expect(field.bits).to.equal(10);
                });

                it('cpya', () => {
                    const table = dbParser.file[tableName];
                    const field = table.fieldDefinitions[8];

                    expect(field.type).to.equal(2);
                    expect(field.offset).to.equal(75);
                    expect(field.name).to.equal('cpya');
                    expect(field.bits).to.equal(18);
                });
            });

            describe('records', () => {
                before((done) => {
                    dbParser.file[tableName].readRecords()
                        .then(() => { 
                            done(); 
                        });
                });

                it('correct record count', () => {
                    const records = dbParser.file[tableName].records;
                    expect(records.length).to.equal(77);
                });

                it('parses fifth record correctly', () => {
                    const record = dbParser.file[tableName].records[4];

                    expect(record.cka0).to.equal(0);
                    expect(record.PGID).to.equal(544);
                    expect(record.STKF).to.equal(0);
                    expect(record.ckfL).to.equal(0);
                    expect(record.cplN).to.equal(67);
                    expect(record.ckea).to.equal(0);
                    expect(record.ckfa).to.equal(0);
                    expect(record.ckma).to.equal(0);
                    expect(record.cpya).to.equal(31345);
                    expect(record.ckeb).to.equal(0);
                    expect(record.ckfb).to.equal(0);
                    expect(record.cktb).to.equal(1);
                    expect(record.cptb).to.equal(50);
                    expect(record.ckac).to.equal(0);
                    expect(record.ckmc).to.equal(0);
                    expect(record.ckad).to.equal(0);
                    expect(record.ckmd).to.equal(0);
                    expect(record.ckae).to.equal(0);
                    expect(record.ckme).to.equal(0);
                    expect(record.cknk).to.equal(8);
                    expect(record.cpbl).to.equal(1);
                    expect(record.ckem).to.equal(0);
                    expect(record.ckfm).to.equal(0);
                    expect(record.cpat).to.equal(727);
                    expect(record.cppt).to.equal(185);
                    expect(record.cpny).to.equal(2878);

                    expect(record.index).to.equal(4);
                    expect(record.isPopulated).to.be.true;
                });
            });
        });

        describe('PLAY', () => {
            const tableName = 'PLAY';

            describe('records', () => {
                before((done) => {
                    console.time('read PLAY records');
                    dbParser.file[tableName].readRecords()
                        .then(() => {
                            console.timeEnd('read PLAY records');
                            done(); 
                        });
                });
                
                it('correct record count', () => {
                    const records = dbParser.file[tableName].records;
                    expect(records.length).to.equal(2585);
                });

                it('correct definitions', () => {
                    const table = dbParser.file[tableName];
                    const field = table.fieldDefinitions[27];

                    expect(field.type).to.equal(0);
                    expect(field.offset).to.equal(144);
                    expect(field.name).to.equal('PLNA');
                    expect(field.bits).to.equal(112);
                    expect(field.maxLength).to.equal(14);
                });

                it('parses Charles Tillman', () => {
                    const record = dbParser.file[tableName].records[15];

                    expect(record.PSA0).to.equal(188);
                    expect(record.PSB0).to.equal(300);
                    expect(record.PFNA).to.equal('Charles');
                    expect(record.PLNA).to.equal('Tillman');
                    expect(record.PHTN).to.equal('Copperas Cove');

                    expect(record.index).to.equal(15);
                    expect(record.isPopulated).to.be.true;
                });

                it('can edit string to be shorter than original', () => {
                    const record = dbParser.file[tableName].records[15];

                    record.PFNA = 'Char';
                    expect(record.PFNA).to.eql('Char');
                });

                it('string field length will be cut if entered string is larger than definition allows', () => {
                    const record = dbParser.file[tableName].records[15];

                    record.PFNA = 'CharleyOKeefe';
                    expect(record.PFNA).to.eql('CharleyOKeef');
                    expect(record.PLNA).to.eql('Tillman')
                });

                it('can edit a number to be smaller than original', () => {
                    const record = dbParser.file[tableName].records[15];

                    record.PSA0 = 0;
                    expect(record.PSA0).to.eql(0);
                });
            });
        });

        describe('TEAM', () => {
            const tableName = 'TEAM';

            describe('records', () => {
                before((done) => {
                    dbParser.file[tableName].readRecords()
                        .then(() => {
                            done(); 
                        });
                });
                
                it('correct record count', () => {
                    const records = dbParser.file[tableName].records;
                    expect(records.length).to.equal(38);
                });

                it('parses binary field (JJNM)', () => {
                    const jjnm = dbParser.file[tableName].records[0].fields['JJNM'].value;
                    expect(jjnm).to.equal('0x1063edffff1ff19fbf5feefd0f');
                });

                it('can edit binary field (JJNM)', () => {
                    const newValue = '0xff63edffff1ff19fbf5feefdff';
                    dbParser.file[tableName].records[0].fields['JJNM'].value = newValue;
                    
                    const jjnm = dbParser.file[tableName].records[0].fields['JJNM'].value;
                    expect(jjnm).to.equal(newValue);
                });

                it('can set an integer field as string', () => {
                    dbParser.file[tableName].records[0].fields['SID1'].value = '44';

                    const sid1 = dbParser.file[tableName].records[0].fields['SID1'].value;
                    expect(sid1).to.equal(44);
                });
            });
        });
    });

    describe('can read huffman tables', () => {
        const streamedDataDbPath = path.join(__dirname, '../data/streameddata.DB');
        let newParser = new TDBParser();

        before(function (done) {
            pipeline(
                fs.createReadStream(streamedDataDbPath),
                newParser,
                (err) => {
                    if (err) {
                        console.error(err);
                        done();
                    }

                    newParser.file.LCLS.readRecords()
                        .then(() => {
                            newParser.file.LCSS.readRecords()
                                .then(() => {
                                    done();
                                });
                        });
                }
            )
        });

        it('can read the table successfully', () => {
            expect(newParser.file.LCLS.records[0].LCLT).to.eql("Dummy source text which is greater than 255 characters so that excel doesn't truncate strings on import. "
                + "Dummy source text which is greater than 255 characters so that excel doesn't truncate strings on import. Dummy source text which is greater than 255 "
                + "characters so that excel doesn't truncate strings on import. Dummy source text which is greater than 255 characters so that excel doesn't truncate strings "
                + "on import. Dummy source text which is greater than 255 characters so that excel doesn't truncate strings on import. Dummy source text which is greater than "
                + "255 characters so that excel doesn't truncate strings on import. Dummy source text which is greater than 255 characters so that excel doesn't truncate strings "
                + "on import. Dummy source text which is greater than 255 characters so that ex");
        });

        it('parses offset correctly', () => {
            expect(newParser.file.LCLS.records[0].fields.LCLT.offset).to.eql(0xF4);
        });

        it('reads middle string successfully', () => {
            expect(newParser.file.LCLS.records[5].LCLT).to.eql('You will need an EA Account to play online.  By pressing submit, you acknowledge that EA will send your '
                + 'Origin account info electronically to Electronic Arts in the U.S. to set up your EA Account.  This includes your email address and date of birth but '
                + 'does not include credit card number or other financial account information.');
        });

        it('reads last string successfully', () => {
            expect(newParser.file.LCLS.records[24].LCLT).to.eql('Your EA SPORTS Season Ticket was successfully purchased but there was an unexpected error updating '
                + 'the EA server.  You will not have Season Ticketholder privileges until we resolve the problem.  Please try signing in again later.  If the problem '
                + 'persists please contact EA Customer Support.  ');
        });

        it('reads smaller length string types successfully', () => {
            expect(newParser.file.LCSS.records[0].LCST).to.eql('Enter the $400,000 FIFA 12 online Challenge. Sign up and play now at EASPORTSARENA.COM. 6 wins gets you a seat at the live finals in NYC!');
        });

        it('reads smaller length string types successfully - 2nd test', () => {
            expect(newParser.file.LCSS.records[6].LCST).to.eql('Within <0> skill points');
        });

        it('can set huffman table value using existing characters', () => {
            const newText = "Dummy source text which is greater than 255 characters so that excel doesn't truncate strings on import.";
            newParser.file.LCLS.records[24].LCLT = newText;
            expect(newParser.file.LCLS.records[24].LCLT).to.eql(newText);
        });

        it('can set huffman table value using existing characters - for smaller field type', () => {
            const newText = "Test12";
            newParser.file.LCSS.records[24].LCST = newText;
            expect(newParser.file.LCSS.records[24].LCST).to.eql(newText);
        });

        it('will automatically remove characters that do not exist in the huffman tree', () => {
            const newText = "Air Jordan";
            newParser.file.LCLS.records[24].LCLT = newText;
            expect(newParser.file.LCLS.records[24].LCLT).to.eql("Air ordan");
        });
    });

    describe('can read data allocation type 34', () => {
        const tableName = 'EARE';

        before((done) => {
            dbParser.file[tableName].readRecords()
                .then(() => { 
                    done(); 
                });
        });

        it('has expected value for first record', () => {
            expect(dbParser.file[tableName].records[0].ENDN).to.eql('Agree');
            expect(dbParser.file[tableName].records[0].AGDE).to.eql('');
            expect(dbParser.file[tableName].records[0].ENSN).to.eql('');
            expect(dbParser.file[tableName].records[0].ENUV).to.eql(20);
        });

        it('has expected value for second record', () => {
            expect(dbParser.file[tableName].records[1].ENDN).to.eql('Bench');
            expect(dbParser.file[tableName].records[1].AGDE).to.eql('');
            expect(dbParser.file[tableName].records[1].ENSN).to.eql('');
            expect(dbParser.file[tableName].records[1].ENUV).to.eql(18);
        });

        it('can set value that already had one set', () => {
            dbParser.file[tableName].records[0].ENDN = 'Disagree';
            expect(dbParser.file[tableName].records[0].ENDN).to.eql('Disagree');
            expect(dbParser.file[tableName].records[1].ENDN).to.eql('Bench');
        });

        it('can set value for a field that did not have a value previously', () => {
            dbParser.file[tableName].records[0].AGDE = 'Testing123';
            expect(dbParser.file[tableName].records[0].AGDE).to.eql('Testing123');
            expect(dbParser.file[tableName].records[0].ENDN).to.eql('Disagree');    // because we changed it in the test above
            expect(dbParser.file[tableName].records[1].ENDN).to.eql('Bench');
        });
    });

    describe('can read little endian DB files', () => {
        before(function(done) {
            this.timeout(10000);
            console.time('parse');
            dbParser = new TDBParser();
    
            const stream = fs.createReadStream(littleEndianDbPath);
    
            stream.on('end', () => {
                console.timeEnd('parse');
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
            
            it('endian', () => {
                expect(dbParser.file.header.endian).to.eql(0);
            });

            it('unknown1', () => {
                expect(dbParser.file.header.unknown1).to.eql(0);
            });

            it('unknown2', () => {
                expect(dbParser.file.header.unknown1).to.eql(0);
            });
    
            it('dbSize', () => {
                expect(dbParser.file.header.dbSize).to.eql(1593228);
            });
    
            it('zero', () => {
                expect(dbParser.file.header.zero).to.eql(0);
            });
    
            it('numTables', () => {
                expect(dbParser.file.header.numTables).to.eql(6);
            });
    
            it('unknown2', () => {
                expect(dbParser.file.header.unknown3).to.eql(0x11C591FA);
            });
        });

        describe('definitions', () => {
            it('correct definition count', () => {
                expect(dbParser.file.definitions.length).to.equal(6);
            });
    
            it('DCHT', () => {
                expect(dbParser.file.definitions[0]).to.eql({
                    'name': 'DCHT',
                    'offset': 0
                });
            });
    
            it('INJY', () => {
                expect(dbParser.file.definitions[1]).to.eql({
                    'name': 'INJY',
                    'offset': 29544
                });
            });
    
            it('PLAY', () => {
                expect(dbParser.file.definitions[4]).to.eql({
                    'name': 'PLAY',
                    'offset': 538304
                });
            });
        });

        describe('EOF CRC', () => {
            it('expected EOF CRC', () => {
                expect(dbParser.file.eofCrcBuffer).to.eql(Buffer.from([0x1A, 0x86, 0x15, 0x4F]));
            });
        });

        describe('tables', () => {
            it('correct table count', () => {
                expect(dbParser.file.tables.length).to.eql(6);
            });
    
            describe('DCHT', () => {
                const tableName = 'DCHT';
    
                it('header', () => {
                    const table = dbParser.file[tableName];
                    expect(table.header).to.eql({
                        'priorCrc': 1299273868,
                        'dataAllocationType': 2,
                        'lengthBytes': 8,
                        'lengthBits': 63,
                        'zero': 0,
                        'maxRecords': 3680,
                        'currentRecords': 3020,
                        'unknown2': 4294901760,
                        'numFields': 4,
                        'indexCount': 0,
                        'zero2': 0,
                        'zero3': 0,
                        'headerCrc': 3903397829
                    });
                });
    
                describe('field definitions', () => {
                    it('correct field length', () => {
                        const table = dbParser.file[tableName];
                        expect(table.fieldDefinitions.length).to.equal(4);
                    });
    
                    it('PGID', () => {
                        const table = dbParser.file[tableName];
                        const field = table.fieldDefinitions[0];
    
                        expect(field.type).to.equal(3);
                        expect(field.offset).to.equal(0);
                        expect(field.name).to.equal('PGID');
                        expect(field.bits).to.equal(15);
                        expect(field.maxValue).to.equal(32767);
                    });
    
                    it('PPOS', () => {
                        const table = dbParser.file[tableName];
                        const field = table.fieldDefinitions[2];
    
                        expect(field.type).to.equal(3);
                        expect(field.offset).to.equal(25);
                        expect(field.name).to.equal('PPOS');
                        expect(field.bits).to.equal(6);
                        expect(field.maxValue).to.equal(63);
                    });
                });
    
                describe('records', () => {
                    before((done) => {
                        dbParser.file[tableName].readRecords()
                            .then(() => { 
                                done(); 
                            });
                    });
    
                    it('correct number of records', () => {
                        const table = dbParser.file[tableName];
                        expect(table.records.length).to.equal(3020);
                    });
    
                    it('parses first record correctly', () => {
                        const record = dbParser.file[tableName].records[0];
    
                        expect(record.PGID).to.equal(12552);
                        expect(record.TGID).to.equal(1);
                        expect(record.PPOS).to.equal(0);
                        expect(record.ddep).to.equal(0);
    
                        expect(record.index).to.equal(0);
                        expect(record.isPopulated).to.be.true;
                    });
    
                    describe('edit records', () => {
                        it('can edit integers', () => {
                            const record = dbParser.file[tableName].records[0];
                            record.PGID = 9876;
                            expect(record.PGID).to.equal(9876);
    
                            console.time('get integer');
                            record.fields['PGID'].value;
                            console.timeEnd('get integer');
    
                            console.time('set integer');
                            record.fields['PGID'].value = 25;
                            console.timeEnd('set integer');
    
                            expect(record.PGID).to.equal(25);
    
                            expect(record.index).to.equal(0);
                            expect(record.isPopulated).to.be.true;
                        });
    
                        it('can edit integers - method #2', () => {
                            const record = dbParser.file[tableName].records[0];
                            record.fields['PGID'].value = 20;
                            expect(record.PGID).to.equal(20);
                        });
                    });
                });
            });

            describe('TEAM', () => {
                const tableName = 'TEAM';

                before((done) => {
                    dbParser.file[tableName].readRecords()
                        .then(() => { 
                            done(); 
                        });
                });

                it('correct number of records', () => {
                    const table = dbParser.file[tableName];
                    expect(table.records.length).to.equal(33);
                });

                it('parses middle record correctly', () => {
                    const record = dbParser.file[tableName].records[24];

                    expect(record.TDNA).to.equal('Ravens');
                    expect(record.TLNA).to.equal('Baltimore');
                    expect(record.TGID).to.equal(25);

                    expect(record.index).to.equal(24);
                    expect(record.isPopulated).to.be.true;
                });

                it('can edit strings', () => {
                    const record = dbParser.file[tableName].records[24];
                    record.fields['TDNA'].value = 'OldBrowns';
                    expect(record.TDNA).to.equal('OldBrowns');
                });
            });
        });
    });
});