const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const through2 = require('through2');

const CASLegacyParser = require('../../streams/CASLegacyParser');
const CompressedLegacyFileReader = require('../../streams/CompressedLegacyFileReader');

const casIndex = '06';
const testCasPath = 'D:\\Games\\Madden NFL 22\\Data\\Win32\\superbundlelayout\\madden_installpackage_00\\cas_' + casIndex + '.cas';
const expectedCompressedFile = fs.readFileSync(path.join(__dirname, '../data/CASLegacyParser/compressed.cas'));

let legacyParser, emittedStreams = [];

describe('CAS Legacy Parser e2e performance test', () => {
    before(function (done) {
        this.timeout(60000);
        console.time('parse');
        legacyParser = new CASLegacyParser();

        const stream = fs.createReadStream(testCasPath);

        stream.on('end', () => {
            console.timeEnd('parse');
            done();
        });

        legacyParser.on('compressed-data', (data) => {
            const casHexIndex = data.startIndex.toString(16);
            const compressionType = data.compressionType;
            const fileName = 'D:\\GameRips\\Madden 22\\LegacyDump_10_16_21\\00\\' + casIndex + '_' + casHexIndex;
            let fileExtension = '';

            const fileExtensionDetector = through2(function(chunk, enc, cb) {
                if (fileExtension === '') {
                    if (chunk[0] === 0x44 && chunk[1] === 0x44 && chunk[2] === 0x53) {
                        fileExtension = 'dds';
                        subtype = getCompressionSubtype(chunk);
                    }
                    else if (chunk[0] === 0x44 && chunk[1] === 0x42) {
                        fileExtension = 'db';
                    }
                    else if (chunk[0] === 0x78 && chunk[1] === 0x9C) {
                        fileExtension = 'ftc';
                    }
                    else if (chunk[0] === 0x46 && chunk[1] === 0x72 && chunk[2] === 0x54 && chunk[3] === 0x6B) {
                        fileExtension = 'frt';
                    }
                    else if (chunk[0] === 0x42 && chunk[1] === 0x47 && chunk[2] === 0x46 && chunk[3] === 0x41 && chunk[4] === 0x31) {
                        fileExtension = 'ast';
                    }
                    else if (chunk[0] === 0x1A && chunk[1] === 0x45 && chunk[2] === 0xDF && chunk[3] === 0xA3) {
                        fileExtension = 'webm';
                    }
                    else if (chunk[0] === 0x3C || (chunk[0] === 0xEF && chunk[1] === 0xBB && chunk[2] === 0xBF && chunk[3] === 0x3C)) {
                        fileExtension = 'xml';
                    }
                    else if (chunk[0] === 0x70 && chunk[1] === 0x33 && chunk[2] === 0x52) {
                        fileExtension = 'p3r';
                        subtype = getCompressionSubtype(chunk);
                    }
                    else if (chunk[0] === 0x41 && chunk[1] === 0x70 && chunk[2] === 0x74) {
                        fileExtension = 'apt';
                    }
                    else if (chunk[0] === 0x52 && chunk[1] === 0x53 && chunk[2] === 0x46) {
                        fileExtension = 'rsf';
                    }
                    else if (chunk[0] === 0x45 && chunk[1] === 0x42 && chunk[2] === 0x4F) {
                        fileExtension = 'ebo';
                    }
                    else if (chunk[0] === 0x53 && chunk[1] === 0x43 && chunk[2] === 0x48 && chunk[3] === 0x6C) {
                        fileExtension = 'schl';
                    }
                    else if (chunk[0] === 0x89 && chunk[1] === 0x50 && chunk[2] === 0x4E && chunk[3] === 0x47) {
                        fileExtension = 'png';
                    }
                    else if (chunk[0] === 0x54 && chunk[1] === 0x45 && chunk[2] === 0x52 && chunk[3] === 0x46) {
                        fileExtension = 'terf';
                    }
                    else if (chunk[0] === 0x43 && chunk[1] === 0x53 && chunk[2] === 0x4E && chunk[3] === 0x41) {
                        fileExtension = 'csna';
                    }
                    else if (chunk[0] === 0x4C && chunk[1] === 0x4F && chunk[2] === 0x43 && chunk[3] === 0x48) {
                        fileExtension = 'loch';
                    }
                    else if (chunk[0] === 0x53 && chunk[1] === 0x45 && chunk[2] === 0x56 && chunk[3] === 0x54) {
                        fileExtension = 'sevt';
                    }
                    else if (chunk[0] === 0x72 && chunk[1] === 0x62 && chunk[2] === 0x61 && chunk[3] === 0x73) {
                        fileExtension = 'rbas';
                    }
                    else if (chunk[0] === 0x4D && chunk[1] === 0x56 && chunk[2] === 0x68 && chunk[3] === 0x64) {
                        fileExtension = 'mvhd';
                    }
                    else if (chunk.length > 16 && (chunk.readUInt32BE(0xC) === 0x47444546 || chunk.readUInt32BE(0xC) === 0x4C545348 
                        || chunk.readUInt32BE(0xC) === 0x44534947)) {
                        fileExtension = 'otf';
                    }
                    else if (chunk.length > 4 && chunk.readUInt32BE(0) === 0x58464E52) {
                        fileExtension = 'xfnr';
                    }
                    else if (chunk[0] === 0x7B && chunk[1] === 0x0D) {
                        fileExtension = 'json';
                    }
                    else if (chunk[0] === 0x22) {
                        fileExtension = 'csv';
                    }
                    else if (chunk[0] === 0x69 && chunk[1] === 0x72 && chunk[2] === 0x66 && chunk[3] === 0x31) {
                        fileExtension = 'irfl';
                    }
                    else {
                        fileExtension = 'dat';
                    }

                    function getCompressionSubtype(chunk) {                                
                        switch(chunk[0x57]) {
                            case 0x31:
                                return 'DXT1';
                            case 0x33:
                                return 'DXT3';
                            case 0x35:
                                return 'DXT5';
                            default:
                                return 'NONE';
                        }
                    }
                }

                this.push(chunk);
                cb();
            });

            const writeStream = fs.createWriteStream(fileName);

            writeStream.on('close', () => {
                fs.renameSync(fileName, fileName + '.' + fileExtension);
            });

            data.stream
                .pipe(new CompressedLegacyFileReader())
                .pipe(fileExtensionDetector)
                .pipe(writeStream);
        });

        stream
            .pipe(legacyParser);
    });

    it('emits all compressed files', () => {
        expect(emittedStreams.length).to.equal(2);
    });

    // it('emits expected compressed buffer (1st)', () => {
    //     testBufferHashes(emittedStreams[0].compressedFile.getCompressedBuffer(), expectedCompressedFile);
    // });

    // it('emits expected compressed buffer (2nd)', () => {
    //     testBufferHashes(emittedStreams[1].compressedFile.getCompressedBuffer(), expectedCompressedFile);
    // });
});

function testBufferHashes(bufferToTest, bufferToCompare) {
    let testHash = crypto.createHash('sha1');
    testHash.update(bufferToTest);

    let compareHash = crypto.createHash('sha1');
    compareHash.update(bufferToCompare);

    expect(testHash.digest('hex')).to.eql(compareHash.digest('hex'));
};