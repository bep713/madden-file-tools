const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const debug = require('debug')('mft');

const concat = require('concat-stream');
const DDSParser = require('../../streams/DDSParser');

const ddsTestPath = path.join(__dirname, '../data/test.dds');
let testRaw = fs.readFileSync(ddsTestPath);

let parser, test;

describe('DDS File unit tests', () => {
    before((done) => {
        parser = new DDSParser();
        
        const stream = fs.createReadStream(ddsTestPath);

        stream.on('end', () => {
            done();
        });

        stream
            .pipe(parser)
            .pipe(concat(function (buf) {
                
            }));
    });

    it('parses header correctly', () => {
        const file = parser._file;

        expect(file.header).to.not.be.undefined;
        expect(file.header.format).to.equal('dxt5');
        expect(file.header.height).to.equal(512);
        expect(file.header.width).to.equal(512);
        expect(file.header.images[0]).to.eql({
            'height': 512,
            'width': 512,
            'offset': 128,
            'length': 262144
        });
    });
});