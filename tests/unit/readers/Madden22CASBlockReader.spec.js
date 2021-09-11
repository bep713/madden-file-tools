const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const M22CasBlockReader = require('../../../readers/m22/Madden22CASBlockReader');
const M22STDReader = require('../../../readers/m22/Madden22SharedTypeDescriptorReader');

const m22TypesPath = path.join(__dirname, '../../data/types/M22Types.json');
const sharedTypeDescriptorsM22Path = path.join(__dirname, '../../data/ebx/SharedTypeDescriptors.ebx_M22.dat');

const CAS_PATH = 'D:\\Games\\Madden NFL 22\\Data\\Win32\\superbundlelayout\\madden_installpackage_00\\cas_01.cas';

let stdReader, reader, ebxList;

describe('M22 CAS Block Reader unit tests', () => {
    before(async function () {
        this.timeout(20000);
        stdReader = new M22STDReader(fs.createReadStream(sharedTypeDescriptorsM22Path), m22TypesPath);
        let types = await stdReader.read();

        reader = new M22CasBlockReader(CAS_PATH, types);
        ebxList = await reader.read();
    });

    it('expected result', () => {
        expect(ebxList.length).to.equal(821);
    });
});