const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const { pipeline } = require('stream');

const SharedTypeDescriptorParser = require('../../../streams/ebx/SharedTypeDescriptorParser');

const m22Types = require('../../data/types/M22Types.json');
const sharedTypeDescriptorsM22Path = path.join(__dirname, '../../data/ebx/SharedTypeDescriptors.ebx_M22.dat');

describe('Shared type descriptor unit tests', () => {
    let parser, file, refl, types;

    before(() => {
        parser = new SharedTypeDescriptorParser();
    });

    describe('M22', () => {
        before((done) => {
            pipeline(
                fs.createReadStream(sharedTypeDescriptorsM22Path),
                parser,
                (err) => {
                    if (err) {
                        done(err);
                    }
                    else {
                        file = parser._file;
                        refl = file.ebxt.refl;
                        done();
                    }
                }
            )
        });

        describe('header', () => {
            it('magic', () => {
                expect(file.header.magic).to.equal(0x46464952);
            });

            it('file size', () => {
                expect(file.header.fileSize).to.equal(0x679F4);
            });
        });

        describe('EBXT', () => {
            it('magic', () => {
                expect(file.ebxt.magic).to.equal(0x54584245);
            });

            describe('REFL', () => {
                it('magic', () => {
                    expect(refl.magic).to.equal(0x4C464552);
                });

                it('size', () => {
                    expect(refl.size).to.equal(0x679E8);
                });

                it('class guid count', () => {
                    expect(refl.classGuidCount).to.equal(0xCA1);
                });

                describe('class guids', () => {
                    it('correct length', () => {
                        expect(refl.classGuids.length).to.equal(0xCA1);
                    });

                    it('0th', () => {
                        expect(refl.classGuids[0]).to.eql({
                            classGuid: 'D24FFEDD-37BF-DE24-ECDB-241DC6B0A4BD'.toLowerCase(),
                            typeInfoGuid: 'DE2437BF-DBEC-1D24-C6B0-A4BD13FABCAE'.toLowerCase()
                        });
                    });

                    it('30th', () => {
                        expect(refl.classGuids[30]).to.eql({
                            classGuid: 'CF84A188-5A65-0B1C-63B2-D48A7AA39BDA'.toLowerCase(),
                            typeInfoGuid: '0B1C5A65-B263-8AD4-7AA3-9BDA03E0B917'.toLowerCase()
                        });
                    });

                    it('310th', () => {
                        expect(refl.classGuids[310]).to.eql({
                            classGuid: '9133A93D-E315-5ADF-A62D-0CDF38BDFF33'.toLowerCase(),
                            typeInfoGuid: '5ADFE315-2DA6-DF0C-38BD-FF338EA08E60'.toLowerCase()
                        });
                    });

                    it('310th', () => {
                        expect(refl.classGuids[310]).to.eql({
                            classGuid: '9133A93D-E315-5ADF-A62D-0CDF38BDFF33'.toLowerCase(),
                            typeInfoGuid: '5ADFE315-2DA6-DF0C-38BD-FF338EA08E60'.toLowerCase()
                        });
                    });

                    it('1129th', () => {
                        expect(refl.classGuids[1129]).to.eql({
                            classGuid: '1E58B642-E094-F979-F168-53238C26E973'.toLowerCase(),
                            typeInfoGuid: 'F979E094-68F1-2353-8C26-E9730CB11626'.toLowerCase()
                        });
                    });

                    it('3232nd', () => {
                        expect(refl.classGuids[3232]).to.eql({
                            classGuid: '7884BD29-41D8-A821-FB44-6C7C446BE945'.toLowerCase(),
                            typeInfoGuid: 'A82141D8-44FB-7C6C-446B-E94587F25BD9'.toLowerCase()
                        });
                    });
                });

                it('class count', () => {
                    expect(refl.classCount).to.equal(0xCA1);
                });

                describe('classes', () => {
                    it('correct length', () => {
                        expect(refl.classes.length).to.equal(0xCA1);
                    });

                    it('0th', () => {
                        expect(refl.classes[0]).to.eql({
                            nameHash: 0x535383F5,
                            fieldStartIndex: 0,
                            fieldCount: 1,
                            alignment: 0,
                            type: 99,
                            size: 104,
                            headerSize: 8
                        });
                    });

                    it('25th', () => {
                        expect(refl.classes[25]).to.eql({
                            nameHash: 0x1C54790,
                            fieldStartIndex: 79,
                            fieldCount: 2,
                            alignment: 0,
                            type: 99,
                            size: 40,
                            headerSize: 8
                        });
                    });

                    it('326th', () => {
                        expect(refl.classes[326]).to.eql({
                            nameHash: 0xB34C2B4B,
                            fieldStartIndex: 5656,
                            fieldCount: 6,
                            alignment: 0,
                            type: 99,
                            size: 112,
                            headerSize: 16
                        });
                    });

                    it('1542nd', () => {
                        expect(refl.classes[1542]).to.eql({
                            nameHash: 0x49DBDF70,
                            fieldStartIndex: 13239,
                            fieldCount: 2,
                            alignment: 0,
                            type: 99,
                            size: 40,
                            headerSize: 8
                        });
                    });

                    it('3232nd', () => {
                        expect(refl.classes[3232]).to.eql({
                            nameHash: 0x2351C06,
                            fieldStartIndex: 23210,
                            fieldCount: 1,
                            alignment: 0,
                            type: 69,
                            size: 8,
                            headerSize: 8
                        });
                    });
                });

                it('field count', () => {
                    expect(refl.fieldCount).to.equal(0x5AAB);
                });

                describe('fields', () => {
                    it('correct length', () => {
                        expect(refl.fields.length).to.equal(0x5AAB);
                    });

                    it('0th', () => {
                        expect(refl.fields[0]).to.eql({
                            nameHash: 0x6FF17EE5,
                            offset: 0,
                            fieldType: 2,
                            fieldClassRef: 1
                        });
                    });

                    it('78th', () => {
                        expect(refl.fields[78]).to.eql({
                            nameHash: 0xF18F9E6F,
                            offset: 1,
                            fieldType: 0,
                            fieldClassRef: 21
                        });
                    });

                    it('860th', () => {
                        expect(refl.fields[860]).to.eql({
                            nameHash: 0x13D5C103,
                            offset: 516,
                            fieldType: 615,
                            fieldClassRef: 65535
                        });
                    });

                    it('2345th', () => {
                        expect(refl.fields[2345]).to.eql({
                            nameHash: 0xC5AFA118,
                            offset: 600,
                            fieldType: 231,
                            fieldClassRef: 65535
                        });
                    });

                    it('6604th', () => {
                        expect(refl.fields[6604]).to.eql({
                            nameHash: 0xEA8AA799,
                            offset: 118,
                            fieldType: 327,
                            fieldClassRef: 65535
                        });
                    });

                    it('23210th', () => {
                        expect(refl.fields[23210]).to.eql({
                            nameHash: 0xE4889AE0,
                            offset: 0,
                            fieldType: 521,
                            fieldClassRef: 65535
                        });
                    });
                });

                it('field2 count', () => {
                    expect(refl.field2Count).to.equal(1407);
                });

                describe('field2s', () => {
                    it('correct length', () => {
                        expect(refl.field2s.length).to.equal(1407);
                    });

                    it('0th', () => {
                        expect(refl.field2s[0]).to.eql({
                            nameHash: 0x20F54D,
                            unk1: 1,
                            unk2: 852
                        });
                    });

                    it('1406th', () => {
                        expect(refl.field2s[1406]).to.eql({
                            nameHash: 0xFFF9A355,
                            unk1: 1,
                            unk2: 382
                        });
                    });
                });

                it('field3 count', () => {
                    expect(refl.field3Count).to.equal(1575);
                });

                describe('field3s', () => {
                    it('correct length', () => {
                        expect(refl.field3s.length).to.equal(1575);
                    });

                    it('0th', () => {
                        expect(refl.field3s[0]).to.eql({
                            nameHash: 0x24677569,
                            offset: 0
                        });
                    });

                    it('1574th', () => {
                        expect(refl.field3s[1574]).to.eql({
                            nameHash: 0xE6F9124E,
                            offset: 3231
                        });
                    });
                });
            });
        });

        describe('builds formatted object', () => {
            it('object exists', () => {
                expect(file.types).to.exist;
            });

            it('builds LocalizedWaveAsset correctly', () => {
                const lwa = file.types.getTypeByHash(1397982197);
                expect(lwa).to.exist;

                const lwaType = m22Types.find((type) => { return type.type.nameHash === 1397982197; });

                expect(lwa.classGuid).to.equal('D24FFEDD-37BF-DE24-ECDB-241DC6B0A4BD'.toLowerCase());
                expect(lwa.fields.length).to.equal(1);

                const unkField = lwa.getFieldByHash(1878097637);
                expect(unkField).to.exist;

                expect(unkField.offset).to.equal(0);
                expect(unkField.type).to.equal(0);
                expect(unkField.isArray).to.be.false;
            });

            it('correctly identifies lists', () => {
                const penalties = file.types.getTypeByHash(1778821050);
                expect(penalties).to.exist;

                const randomPenalty = penalties.getFieldByHash(1303948470);
                expect(randomPenalty.isArray).to.be.true;
                expect(randomPenalty.type).to.equal(10);

                const falseStartPenalties = penalties.getFieldByHash(2985009847);
                expect(falseStartPenalties.isArray).to.be.false;
                expect(falseStartPenalties.type).to.equal(16);
            });

            it('correctly identifies lists #2', () => {
                const mathEntityInstructions = file.types.getTypeByHash(2039526052);
                expect(mathEntityInstructions).to.exist;

                const code = mathEntityInstructions.getFieldByHash(1554589476);
                expect(code.isArray).to.be.false;
                expect(code.type).to.equal(8);
            });
        });
    });
});