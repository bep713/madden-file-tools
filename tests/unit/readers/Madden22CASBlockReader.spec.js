const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const { StaticPool } = require('node-worker-threads-pool');

const M22CasBlockReader = require('../../../readers/m22/Madden22CASBlockReader');
const M22STDReader = require('../../../readers/m22/Madden22SharedTypeDescriptorReader');
const { pipeline, Transform } = require('stream');

const m22TypesPath = path.join(__dirname, '../../data/types/M22Types.json');
const sharedTypeDescriptorsM22Path = path.join(__dirname, '../../data/ebx/SharedTypeDescriptors.ebx_M22.dat');

const CAS_PATH = 'D:\\Games\\Madden NFL 22\\Data\\Win32\\superbundlelayout\\madden_installpackage_00\\cas_01.cas';

let stdReader, reader, ebxList, types;

describe('M22 CAS Block Reader unit tests', () => {
    before(async function () {
        this.timeout(10000);
        stdReader = new M22STDReader(fs.createReadStream(sharedTypeDescriptorsM22Path), m22TypesPath);
        types = await stdReader.read();
    });

    describe('single CAS read', () => {
        before(async function () {
            this.timeout(40000);
            reader = new M22CasBlockReader(CAS_PATH, types);
            ebxList = await reader.read();
        });

        it('expected result', () => {
            expect(ebxList.length).to.equal(27651);
        });

        it('contains offset and name', () => {
            expect(ebxList[0].name).to.equal('content/common/textures/logosheets/YellowJackets_logosheet_COL');
            expect(ebxList[0].offset).to.equal(0x2DC);
            expect(ebxList[0].sizeInCas).to.equal(0xD8);
        });
    });

    describe('no CAS parsing - read stream', () => {
        before(function (done) {
            this.timeout(10000);
            pipeline(
                fs.createReadStream(CAS_PATH),
                new Transform({
                    transform(chunk, enc, cb) {
                        cb();
                    }
                }),
                (err) => {
                    done();
                }
            )
        });

        it('test', () => {

        })
    });

    describe('single chunk CAS read - without data', () => {
        before(async function () {
            this.timeout(40000);
            reader = new M22CasBlockReader(CAS_PATH, types, {
                start: 0x100D3,
                size: 0xD2
            });

            ebxList = await reader.read();
        });

        it('expected result', () => {
            expect(ebxList.length).to.equal(1);
        });

        it('contains offset and name', () => {
            expect(ebxList[0].name).to.equal('content/common/textures/logosheets/Wizards_logosheet_COL');
            expect(ebxList[0].offset).to.equal(0);
            expect(ebxList[0].sizeInCas).to.equal(0xD2);
            expect(ebxList[0].data).to.be.undefined;
        });
    });

    describe('single chunk CAS read - with data', () => {
        before(async function () {
            this.timeout(40000);
            reader = new M22CasBlockReader(CAS_PATH, types, {
                start: 0x100D3,
                size: 0xD2,
                readEbxData: true
            });

            ebxList = await reader.read();
        });

        it('expected result', () => {
            expect(ebxList.length).to.equal(1);
        });

        it('contains offset and name', () => {
            expect(ebxList[0].name).to.equal('content/common/textures/logosheets/Wizards_logosheet_COL');
            expect(ebxList[0].offset).to.equal(0);
            expect(ebxList[0].sizeInCas).to.equal(0xD2);
            expect(ebxList[0].data).not.be.undefined;
        });
    });

    describe('multiple CAS reads at once (without worker pool)', () => {
        let ebxLists = [];

        before(async function () {
            this.timeout(100000);

            let ebxReadPromises = [];
    
            for (let i = 1; i < 7; i++) {
                const casPath = `D:\\Games\\Madden NFL 22\\Data\\Win32\\superbundlelayout\\madden_installpackage_00\\cas_0${i}.cas`;
                let reader = new M22CasBlockReader(casPath, types);
                ebxReadPromises.push(reader.read());
            }

            ebxLists = await Promise.all(ebxReadPromises);
        });

        it('expected result', () => {
            expect(ebxLists.length).to.equal(6);
        });
    });

    describe('multiple CAS reads at once (using worker pool)', () => {
        let ebxLists = [];

        before(async function () {
            this.timeout(100000);

            const staticPool = new StaticPool({
                size: 6,
                task: async function (fileName, types) {
                    const M22CasBlockReader = require('./readers/m22/Madden22CASBlockReader');
                    const zstd = require('@fstnetwork/cppzst');
                    let reader = new M22CasBlockReader(fileName, types);
                    const ebxList = await reader.read();
                    return ebxList;
                }
            });

            let ebxReadPromises = [];
    
            for (let i = 1; i < 7; i++) {
                const casPath = `D:\\Games\\Madden NFL 22\\Data\\Win32\\superbundlelayout\\madden_installpackage_00\\cas_0${i}.cas`;
                ebxReadPromises.push(staticPool.exec(casPath, types));
            }

            ebxLists = await Promise.all(ebxReadPromises);
        });

        it('expected result', () => {
            expect(ebxLists.length).to.equal(6);
        });
    });
});