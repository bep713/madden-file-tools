const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const CASBlockParser = require('../../streams/CASBlockParser');

// This uses an external CAS file to test. Comment out if you don't have this file :)
const CAS_FILE_PATH = 'D:\\Games\\Madden NFL 22\\Data\\Win32\\superbundlelayout\\madden_installpackage_lcu\\cas_01.cas';

let parser;

describe('CAS Block Parser unit tests', () => {
    let blocks = [];

    before(function (done) {
        this.timeout(20000);

        parser = new CASBlockParser();

        parser.on('block', (block) => {
            blocks.push(block);
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

    it('emits an event for each CAS block parsed', () => {
        expect(blocks.length).to.equal(712)
    });

    it('block contains expected data', () => {
        expect(blocks[0].meta).to.eql({
            size: 32,
            offset: 0,
            type: 0xD68E799D,
            isCompressed: false
        });

        expect(blocks[0].data.length).to.equal(32);
    });

    it('compressed block contains expected data', () => {
        expect(blocks[2].meta).to.eql({
            size: 540,
            offset: 0x720C,
            isCompressed: true,
            compressionIndicator: 0x700F,
            compressionType: CASBlockParser.COMPRESSION_TYPE.ZSTD,
            compressedSize: 373
        });

        expect(blocks[2].data.length).to.equal(373);
    });
});