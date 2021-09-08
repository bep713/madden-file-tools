const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');

const EBXParser = require('../../../streams/ebx/EBXParser');

const ebxPaddingPath = path.join(__dirname, '../../data/ebx/M22_EBX.ebx.uncompress.dat');
const helloTeamsPath = path.join(__dirname, '../../data/ebx/M22_HelloTeams.ebx.uncompress.dat');
const correctRunCommitSuperWinsPath = path.join(__dirname, '../../data/ebx/M22_Correct_Run_Commit_Super_Wins.ebx.uncompress.dat');

let parser;

describe('EBX Parser unit tests', () => {
    beforeEach(() => {
        parser = new EBXParser();
    });

    describe('M22', () => {
        let file;

        describe('can parse a simple EBX file correctly', () => {
            beforeEach((done) => {
                pipeline(
                    fs.createReadStream(helloTeamsPath),
                    parser,
                    (err) => {
                        if (err) {
                            done(err);
                        }
                        else {
                            file = parser.file;
                            done();
                        }

                    }
                );
            });

            describe('header', () => {
                it('magic', () => {
                    expect(file.header.magic).to.equal(0x46464952);
                });

                it('file size', () => {
                    expect(file.header.fileSize).to.equal(0x1FC);
                });
            });

            describe('EBX', () => {
                it('magic', () => {
                    expect(file.ebx.magic).to.equal(0x584245);
                });

                describe('EBXD', () => {
                    it('magic', () => {
                        expect(file.ebx.ebxd.magic).to.equal(0x44584245);
                    });

                    it('size', () => {
                        expect(file.ebx.ebxd.size).to.equal(0x10C);
                    });

                    it('file guid', () => {
                        expect(file.ebx.ebxd.fileGuid).to.equal('636D14B9-F8D9-A65A-7731-BD1CD74B9037'.toLowerCase());
                    });

                    it('raw', () => {
                        expect(file.ebx.ebxd.raw.length).to.equal(0x10C);
                    });

                    it('raw data block', () => {
                        expect(file.ebx.ebxd.rawDataBlock.length).to.equal(0xF0)
                    });
                });

                describe('EFIX', () => {
                    it('magic', () => {
                        expect(file.ebx.efix.magic).to.equal(0x58494645);
                    });

                    it('size', () => {
                        expect(file.ebx.efix.size).to.equal(0xBC);
                    });

                    it('file guid', () => {
                        expect(file.ebx.efix.fileGuidRaw).to.eql(Buffer.from([0x49, 0x40, 0xC7, 0x9C, 0x1B, 0xB2, 0xE8, 0x11, 0x89, 0xAA, 0xD0, 0x43, 0xF4, 0x5C, 0x8B, 0xEF]));
                        expect(file.ebx.efix.fileGuid).to.equal('9cc74049-b21b-11e8-89aa-d043f45c8bef');
                    });

                    it('class type count', () => {
                        expect(file.ebx.efix.classTypeCount).to.equal(2);
                    });

                    it('class types', () => {
                        expect(file.ebx.efix.classTypes.length).to.equal(2);
                        expect(file.ebx.efix.classTypes[0]).to.equal('d24ffedd-37bf-de24-ecdb-241dc6b0a4bd');
                        expect(file.ebx.efix.classTypes[1]).to.equal('3674ff5b-b2e8-25fb-2c50-366e53a8ca5d');
                    });

                    it('type info guid count', () => {
                        expect(file.ebx.efix.typeInfoGuidCount).to.equal(2);
                    });

                    it('type info guids', () => {
                        expect(file.ebx.efix.typeInfoGuids.length).to.equal(2);
                        expect(file.ebx.efix.typeInfoGuids[0]).to.equal('de2437bf-dbec-1d24-c6b0-a4bd13fabcae');
                        expect(file.ebx.efix.typeInfoGuids[1]).to.equal('25fbb2e8-502c-6e36-53a8-ca5dda991975');
                    });

                    it('data offset count', () => {
                        expect(file.ebx.efix.dataOffsetCount).to.equal(1);
                    });

                    it('unknown3 count', () => {
                        expect(file.ebx.efix.unk3Count).to.equal(1);
                    });

                    it('data offsets', () => {
                        expect(file.ebx.efix.dataOffsets.length).to.eql(1);
                        expect(file.ebx.efix.dataOffsets).to.eql([16]);
                    });

                    it('unk3 offsets', () => {
                        expect(file.ebx.efix.unk3Offsets.length).to.eql(0);
                        expect(file.ebx.efix.unk3Offsets).to.eql([]);
                    });

                    it('unk4 count', () => {
                        expect(file.ebx.efix.unk4Count).to.equal(2);
                    });

                    it('unk4s', () => {
                        expect(file.ebx.efix.unk4s.length).to.equal(2);
                        expect(file.ebx.efix.unk4s).to.eql([40, 48]);
                    });

                    it('unk5 count', () => {
                        expect(file.ebx.efix.unk5Count).to.equal(0);
                    });

                    it('import reference count', () => {
                        expect(file.ebx.efix.importReferenceCount).to.equal(2);
                    });

                    it('import references', () => {
                        expect(file.ebx.efix.importReferences.length).to.equal(2);

                        expect(file.ebx.efix.importReferences[0]).to.eql({
                            fileGuid: 'F3FD10F1-6218-11E1-9522-DAA1D3935CED'.toLowerCase(),
                            classGuid: '5D5F9820-2B9B-41DF-9A90-455E680E77DD'.toLowerCase()
                        });

                        expect(file.ebx.efix.importReferences[1]).to.eql({
                            fileGuid: 'F3FD10F1-6218-11E1-9522-DAA1D3935CED'.toLowerCase(),
                            classGuid: '17F43C65-1568-43C2-A632-5CD6A4E21F55'.toLowerCase()
                        });
                    });

                    it('unk6 count', () => {
                        expect(file.ebx.efix.unk6Count).to.equal(2);
                    });

                    it('unk6s', () => {
                        expect(file.ebx.efix.unk6s.length).to.equal(2);
                        expect(file.ebx.efix.unk6s).to.eql([56, 88]);
                    });

                    it('unk7 count', () => {
                        expect(file.ebx.efix.unk7Count).to.equal(0);
                    });

                    it('data size', () => {
                        expect(file.ebx.efix.dataSize).to.equal(128);
                    });

                    it('total ebx data size', () => {
                        expect(file.ebx.efix.totalEbxDataSize).to.equal(192);
                    });

                    it('total ebx data size2', () => {
                        expect(file.ebx.efix.totalEbxDataSize2).to.equal(192);
                    });
                });

                describe('EBXX', () => {
                    it('magic', () => {
                        expect(file.ebx.ebxx.magic).to.equal(0x58584245);
                    });

                    it('size', () => {
                        expect(file.ebx.ebxx.size).to.equal(0x18);
                    });

                    it('ebxx count', () => {
                        expect(file.ebx.ebxx.ebxxCount).to.equal(1);
                    });

                    it('zero', () => {
                        expect(file.ebx.ebxx.zero).to.equal(0);
                    });

                    it('ebxxs', () => {
                        expect(file.ebx.ebxx.ebxxs.length).to.equal(1);
                        expect(file.ebx.ebxx.ebxxs[0]).to.eql(Buffer.from([0xA4, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0xC7, 0xD3, 0x9F, 0x22, 0x48, 0x00, 0x01, 0x00]));
                    });
                });
            });
        });

        describe('can parse a complex ebx', () => {
            let efix, ebxx;

            beforeEach((done) => {
                pipeline(
                    fs.createReadStream(correctRunCommitSuperWinsPath),
                    parser,
                    (err) => {
                        if (err) {
                            done(err);
                        }
                        else {
                            file = parser.file;
                            efix = file.ebx.efix;
                            ebxx = file.ebx.ebxx;
                            done();
                        }

                    }
                );
            });

            describe('EFIX', () => {
                it('correct class types', () => {
                    expect(efix.classTypeCount).to.equal(19);
                    expect(efix.classTypes.length).to.equal(19);

                    expect(efix.classTypes[0]).to.eql('0FBE0EA1-E9A1-AB07-9B80-84E6E894A792'.toLowerCase())
                    expect(efix.classTypes[7]).to.eql('82D8433B-3530-C375-E7F7-02062B129905'.toLowerCase())
                    expect(efix.classTypes[18]).to.eql('041E0078-B1C0-6A4A-4063-B57B1CF32EE0'.toLowerCase())
                });

                it('correct type info guids', () => {
                    expect(efix.typeInfoGuidCount).to.equal(17);
                    expect(efix.typeInfoGuids.length).to.equal(17);

                    expect(efix.typeInfoGuids[0]).to.eql('AB07E9A1-809B-E684-E894-A792D0CEAB4A'.toLowerCase())
                    expect(efix.typeInfoGuids[7]).to.eql('C3753530-F7E7-0602-2B12-99058413C3FB'.toLowerCase())
                    expect(efix.typeInfoGuids[16]).to.eql('E389A779-CCD7-0AB6-2FAF-B882662854FB'.toLowerCase())
                });

                it('correct data offsets', () => {
                    expect(efix.dataOffsetCount).to.equal(18);
                    expect(efix.dataOffsets[0]).to.equal(16);
                    expect(efix.dataOffsets[11]).to.equal(864);
                    expect(efix.dataOffsets[17]).to.equal(1272);
                });

                it('correct unk3 offsets', () => {
                    expect(efix.unk3Count).to.equal(25);
                    expect(efix.unk3Offsets.length).to.equal(7);
                    expect(efix.unk3Offsets[0]).to.equal(1320);
                    expect(efix.unk3Offsets[5]).to.equal(1584);
                    expect(efix.unk3Offsets[6]).to.equal(1640);
                });

                it('correct unk7s', () => {
                    expect(efix.unk7Count).to.equal(2);
                    expect(efix.unk7s.length).to.equal(2);
                    expect(efix.unk7s).to.eql([208, 752]);
                });

                it('correct data sizes', () => {
                    expect(efix.dataSize).to.equal(1680); 
                    expect(efix.totalEbxDataSize).to.equal(6272); 
                    expect(efix.totalEbxDataSize2).to.equal(6272);
                });
            });

            describe('EBXX', () => {
                it('correct ebxxs', () => {
                    expect(ebxx.ebxxCount).to.equal(7);
                    expect(ebxx.ebxxs.length).to.equal(7);
                    expect(ebxx.ebxxs[4]).to.eql(Buffer.from([0xFC, 0x0F, 0x00, 0x00, 0x52, 0x00, 0x00, 0x00, 0x3F, 0xF6, 0xDF, 0xA6, 0x48, 0x00, 0x0F, 0x00]));
                });
            });
        });

        describe('can parse an ebx with padding between ebxd and efix', () => {
            let efix, ebxx;

            beforeEach((done) => {
                pipeline(
                    fs.createReadStream(ebxPaddingPath),
                    parser,
                    (err) => {
                        if (err) {
                            done(err);
                        }
                        else {
                            file = parser.file;
                            efix = file.ebx.efix;
                            ebxx = file.ebx.ebxx;
                            done();
                        }

                    }
                );
            });

            it('expected efix magic', () => {
                expect(efix.magic).to.equal(0x58494645);
            });
        });
    });
});