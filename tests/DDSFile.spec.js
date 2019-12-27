const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const DDSFile = require('../filetypes/DDSFile');

const ddsTestPath = path.join(__dirname, 'data/test.dds');
let testRaw = fs.readFileSync(ddsTestPath);

let test;

describe('DDS File unit tests', () => {
    beforeEach(() => {
        test = new DDSFile(ddsTestPath, testRaw);
        test.parse();
    });

    it('parses header correctly', () => {
        expect(test.header).to.not.be.undefined;
        expect(test.header.format).to.equal('dxt5');
        expect(test.header.shape).to.eql([512,512]);
        expect(test.header.images[0]).to.eql({
            'shape': [512,512],
            'offset': 128,
            'length': 262144
        })
    });

    it('can convert to a png', (done) => {
        test.convert('png')
            .then((obj) => {
                expect(obj).to.be.a('MaddenFile');
                expect(obj.rawContents.slice(0, 4)).to.eql(Buffer.from([0x89, 0x50, 0x4E, 0x47]))
                done();
            });
    });
});