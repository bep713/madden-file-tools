const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const CASBlockParser = require('../../streams/CASBlockParser');

// This uses an external CAS file to test. Comment out if you don't have this file :)
const CAS_FILE_PATH = 'E:\\Games\\Madden\\Madden NFL 25\\Data\\Win32\\superbundlelayout\\football_installpackage_00\\cas_01.cas';

let parser;

describe('CAS Block Parser unit tests', () => {
    let blocks = [];
    let chunks = [];

    before(function (done) {
        this.timeout(20000);

        parser = new CASBlockParser();

        parser.on('block', (block) => {
            blocks.push(block);
        });

        parser.on('chunk', (chunk) => {
            chunks.push(chunk);
        });

        pipeline(
            fs.createReadStream(CAS_FILE_PATH),
            parser,
            (err) => {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            }
        );
    });

    it('emits an event for each CAS chunk parsed', () => {
        expect(chunks.length).to.equal(50389);
    });

    it('chunk contains expected data', () => {
        expect(chunks[0].blocks.length).to.equal(6);
        expect(chunks[0].offset).to.equal(0);
        expect(chunks[0].sizeInCas).to.equal(0x16E);

        expect(chunks[1].offset).to.equal(0x16E);
        expect(chunks[1].sizeInCas).to.equal(0x16E);

        expect(chunks[2].offset).to.equal(0x2DC);
        expect(chunks[2].sizeInCas).to.equal(0xD8);
    });

    it('block contains expected data', () => {
        const block = chunks[0].blocks[0];

        expect(block.meta).to.eql({
            size: 0x10000,
            offset: 0,
            isCompressed: true,
            compressionType: CASBlockParser.COMPRESSION_TYPE.OODLE,
            compressedSize: 0x35,
            compressionIndicator: 0x7011
        });
    });
});