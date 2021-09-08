const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');

const EBXParser = require('../../../streams/ebx/EBXParser');
const EBXPointer = require('../../../filetypes/EBX/EBXPointer');
const EBXDataReader = require('../../../readers/m22/EBXDataReader');
const SharedTypeDescriptorParser = require('../../../streams/ebx/SharedTypeDescriptorParser');

const maddenTypeService = require('../../../services/maddenTypeService');
const { expect } = require('chai');

const M22_TYPES_PATH = path.join(__dirname, '../../data/types/M22Types.json');
const SIMPLE_EBX_PATH = path.join(__dirname, '../../data/ebx/M22_HelloTeams.ebx.uncompress.dat');
const MODERATE_EBX_PATH = path.join(__dirname, '../../data/ebx/M22_gamestyle_yard.ebx.uncompress.dat');
const HIGH_EBX_PATH = path.join(__dirname, '../../data/ebx/M22_Correct_Run_Commit_Super_Wins.ebx.uncompress.dat');
const POINTERS_EBX_PATH = path.join(__dirname, '../../data/ebx/M22_DRAFTContextSystem.ebx.uncompress.dat');
const RESOURCE_REF_PATH = path.join(__dirname, '../../data/ebx/M22_NewEraLogo.ebx.uncompress.dat');

const sharedTypeDescriptorsM22Path = path.join(__dirname, '../../data/ebx/SharedTypeDescriptors.ebx_M22.dat');

describe('ebx data reader unit tests', () => {
    let reader, types = null;
    let parser = new EBXParser();
    let sharedTypeParser = new SharedTypeDescriptorParser();

    before((done) => {
        pipeline(
            fs.createReadStream(sharedTypeDescriptorsM22Path),
            sharedTypeParser,
            (err) => {
                if (err) {
                    reject(err);
                }

                types = sharedTypeParser._file.types;

                maddenTypeService.loadTypesFromFile(M22_TYPES_PATH);
                maddenTypeService.mergeTypes(sharedTypeParser._file.types);
                done();
            }
        );
    })

    describe('can read a simple EBX file\'s data section', () => {
        let ebxFile, types = null;

        before(async () => {
            let readEbxPromise = new Promise((resolve, reject) => {
                pipeline(
                    fs.createReadStream(SIMPLE_EBX_PATH),
                    parser,
                    (err) => {
                        if (err) {
                            reject(err);
                        }
    
                        resolve(parser._file);    
                    }       
                );
            });

            await Promise.all([readEbxPromise]);

            ebxFile = parser._file;
            types = sharedTypeParser._file.types;
            reader = new EBXDataReader(types);
        });

        it('method exists', () => {
            expect(reader.readEbxData).to.exist;
        });

        it('returns the expected result', () => {
            const ebxData = reader.readEbxData(ebxFile);

            expect(ebxData.mainObject.ChannelCount).to.equal(1);
            expect(ebxData.mainObject.ControlParameterCount).to.equal(0);
            expect(ebxData.mainObject.IsSeekable).to.equal(false);
            expect(ebxData.mainObject.Name).to.equal('Sound/Speech/TV/SoundWaves/secondary_LCU/bLCU_INTRO_HELLO_TEAMS');
            expect(ebxData.mainObject.ParentInstanceGuid).to.equal('b57c1dec-2b78-4dc4-8be5-b9cc80627cb0');
            expect(ebxData.mainObject.PreferAvailableVariations).to.equal(false);
            expect(ebxData.mainObject.PrimePriority).to.equal(0);
            expect(ebxData.mainObject.RequestPriority).to.equal(0);
            expect(ebxData.mainObject.SelectionParameterCount).to.equal(2);
            expect(ebxData.mainObject.StreamingMode).to.equal(0);
            expect(ebxData.mainObject.VoicePriority).to.equal(2);

            expect(ebxData.mainObject.DefaultSelectionBehavior.type).to.eql(EBXPointer.TYPES.UNKNOWN);
            expect(ebxData.mainObject.DefaultSelectionBehavior.ref).to.eql(null);

            expect(ebxData.mainObject.Policy.type).to.eql(EBXPointer.TYPES.EXTERNAL);
            expect(ebxData.mainObject.Policy.ref.classGuid).to.eql('17F43C65-1568-43C2-A632-5CD6A4E21F55'.toLowerCase());

            expect(ebxData.mainObject.StreamPool.type).to.eql(EBXPointer.TYPES.EXTERNAL);
            expect(ebxData.mainObject.StreamPool.ref.classGuid).to.eql('5D5F9820-2B9B-41DF-9A90-455E680E77DD'.toLowerCase());

            expect(ebxData.mainObject.Chunks[0].ChunkId).to.equal('af389ad1-3d06-53cf-985c-7f7636bb807c')
            expect(ebxData.mainObject.Chunks[0].ChunkSize).to.equal(6300)
        });
    });

    describe('Moderate EBX complexity', () => {
        before(async () => {
            parser = new EBXParser();
            let readEbxPromise = new Promise((resolve, reject) => {
                pipeline(
                    fs.createReadStream(MODERATE_EBX_PATH),
                    parser,
                    (err) => {
                        if (err) {
                            reject(err);
                        }
    
                        resolve(parser._file);    
                    }       
                );
            });
    
            await Promise.all([readEbxPromise]);
    
            ebxFile = parser._file;
            reader = new EBXDataReader(types);
        });

        it('returns expected result', () => {
            const ebxData = reader.readEbxData(ebxFile);
            expect(ebxData.mainObject['defHolding_penalties_number_desired_per_game']).to.equal(0.9);
            expect(ebxData.mainObject['defholding_penalties_opportunities_per_madden_play']).to.equal(0.5);
            expect(ebxData.mainObject['false_start_penalties_num_fake_snaps_to_enable_repeat']).to.equal(99);
            expect(ebxData.mainObject['random_penalty_can_occur_in_online_game']).to.eql([false, true, true, true]);
            expect(ebxData.mainObject['random_penalty_max_per_game_cpu_team']).to.eql([2, 4, 6, 6]);
        });
    });

    describe('High EBX complexity', () => {
        before(async () => {
            parser = new EBXParser();
            let readEbxPromise = new Promise((resolve, reject) => {
                pipeline(
                    fs.createReadStream(HIGH_EBX_PATH),
                    parser,
                    (err) => {
                        if (err) {
                            reject(err);
                        }
    
                        resolve(parser._file);    
                    }       
                );
            });
    
            await Promise.all([readEbxPromise]);
    
            ebxFile = parser._file;
            reader = new EBXDataReader(types);
        });

        it('returns expected result', () => {
            const ebxData = reader.readEbxData(ebxFile);

            expect(ebxData.mainObject.Name).to.equal('global/DSub/InGame/FootballAbilitiesDSub/[046]_Correct_Run_Commit_Super_Wins');
            expect(ebxData.mainObject.Flags).to.equal(0);
            expect(ebxData.mainObject.PropertyConnections).to.eql([]);
            expect(ebxData.mainObject.LinkConnections).to.eql([]);
            expect(ebxData.mainObject.EventConnections).to.eql([]);
            expect(ebxData.mainObject.SchematicsBusFieldOffset).to.eql(0);
            expect(ebxData.mainObject.TimeDeltaType).to.eql(0);
            expect(ebxData.mainObject.Enabled).to.eql(true);
            expect(ebxData.mainObject.HackToSolveRealTimeTweakingIssue).to.eql('00000000-0000-0000-0000-000000000000');

            expect(ebxData.mainObject.Interface.type).to.eql(EBXPointer.TYPES.UNKNOWN);
            expect(ebxData.mainObject.Interface.ref).to.eql(null);

            expect(ebxData.mainObject.ClientSchematics.type).to.eql(EBXPointer.TYPES.UNKNOWN);
            expect(ebxData.mainObject.Interface.ref).to.eql(null);

            expect(ebxData.mainObject.ServerSchematics.type).to.eql(EBXPointer.TYPES.UNKNOWN);
            expect(ebxData.mainObject.Interface.ref).to.eql(null);

            expect(ebxData.mainObject.Objects.length).to.eql(17);

            expect(ebxData.mainObject.Objects[0].type).to.eql(EBXPointer.TYPES.INTERNAL);
            expect(ebxData.mainObject.Objects[0].ref).to.eql(17);

            expect(ebxData.objects.length).to.equal(18);

            expect(ebxData.objects[17].Flags).to.equal(16807165);
            expect(ebxData.objects[17].Realm).to.equal(0);
            expect(ebxData.objects[17].DefaultString).to.equal('Dominant rush wins when correctly guessing a run play');

            expect(ebxData.objects[1].EnumTypeTypeInfoRef.TypeInfo).to.equal(70);
        });
    });

    // describe('Resource and Type references', () => {
    //     before(async () => {
    //         parser = new EBXParser();
    //         let readEbxPromise = new Promise((resolve, reject) => {
    //             pipeline(
    //                 fs.createReadStream(RESOURCE_REF_PATH),
    //                 parser,
    //                 (err) => {
    //                     if (err) {
    //                         reject(err);
    //                     }
    
    //                     resolve(parser._file);    
    //                 }       
    //             );
    //         });
    
    //         await Promise.all([readEbxPromise]);
    
    //         ebxFile = parser._file;
    //         reader = new EBXDataReader(types);
    //     });

    //     it('returns expected result', () => {
    //         const ebxData = reader.readEbxData(ebxFile);

    //         expect(ebxData.mainObject.Name).to.equal('content/common/textures/logos/NewEraLogo01_TRAN');
    //         expect(ebxData.mainObject.Resource.resourceId.toString()).to.be.equal(17754181949446070057n.toString());
    //     });
    // });
});