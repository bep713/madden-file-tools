const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const { pipeline } = require('stream');
const maddenTypeService = require('../../services/maddenTypeService');
const SharedTypeDescriptorParser = require('../../streams/ebx/SharedTypeDescriptorParser');

const M22_TYPES_PATH = path.join(__dirname, '../data/types/M22Types.json');
const sharedTypeDescriptorsM22Path = path.join(__dirname, '../data/ebx/SharedTypeDescriptors.ebx_M22.dat');

describe('Madden type service unit tests', () => {
    let typeMapping;

    before(() => {
        maddenTypeService.loadTypesFromFile(M22_TYPES_PATH);
    });

    // describe('can load types (requires the game process running)', () => {
    //     before(async function () {
    //         this.timeout(10000);
    //         typeMapping = await maddenTypeService.parseTypes('Madden21.exe');
    //     });
    
    //     it('returns expected number of types', () => {
    //         expect(typeMapping.length).to.eql(21123);
    //     });
    // });

    describe('can load types from a file', () => {
        it('method exists', () => {
            expect(maddenTypeService.loadTypesFromFile).to.exist;
        });

        it('loads types correctly', () => {
            expect(maddenTypeService.types.length).to.equal(22680);
        });
    });

    describe('can get a type by name', () => {
        it('method exists', () => {
            expect(maddenTypeService.getTypeByName).to.exist;
        });

        it('can get the localized wave asset type', () => {
            const name = 'LocalizedWaveAsset';
            const type = maddenTypeService.getTypeByName(name);
            expect(type.name).to.equal(name);
        });
    });

    describe('can get a type by hash', () => {
        it('method exists', () => {
            expect(maddenTypeService.getTypeByHash).to.exist;
        });

        it('can get the football team data type', () => {
            const hash = 375108694;
            const type = maddenTypeService.getTypeByHash(hash);
            expect(type.name).to.equal('FootballTeamData');
        });
    });

    describe('can get a field by hash', () => {
        it('method exists', () => {
            expect(maddenTypeService.getFieldByHash).to.exist;
        });

        it('can get the TeamTerniaryColorRGBA field', () => {
            const hash = 4215162517;
            const field = maddenTypeService.getFieldByHash(hash);
            expect(field.name).to.equal('TeamTerniaryColorRGBA');
        });
    });

    describe('can merge shared type descriptors with game types', () => {
        let types;
        let parser = new SharedTypeDescriptorParser();

        before((done) => {
            pipeline(
                fs.createReadStream(sharedTypeDescriptorsM22Path),
                parser,
                (err) => {
                    if (err) {
                        done(err);
                    }
                    else {
                        types = parser._file.types;
                        done();
                    }
                }
            )
        });

        it('method exists', () => {
            expect(maddenTypeService.mergeTypes).to.exist;
        });

        it('returns expected result', () => {
            maddenTypeService.mergeTypes(types);
            expect(types.getTypeByName('LocalizedWaveAsset')).to.exist;
            expect(types.getTypeByName('NewWaveAsset').getFieldByName('ParentInstanceGuid')).to.exist;
        });
    });
});