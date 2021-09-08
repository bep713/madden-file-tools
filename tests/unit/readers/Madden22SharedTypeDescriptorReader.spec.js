const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const STDReader = require('../../../readers/m22/Madden22SharedTypeDescriptorReader');

const m22TypesPath = path.join(__dirname, '../../data/types/M22Types.json');
const sharedTypeDescriptorsM22Path = path.join(__dirname, '../../data/ebx/SharedTypeDescriptors.ebx_M22.dat');

let reader, types;

describe('M22 STD Reader unit tests', () => {
    before(async () => {
        reader = new STDReader(fs.createReadStream(sharedTypeDescriptorsM22Path), m22TypesPath);
        types = await reader.read();
    });

    it('returns expected result', () => {
        expect(types).to.be.a('TypeDescriptorList');
        expect(types.types.length).to.equal(3233);
    });
});