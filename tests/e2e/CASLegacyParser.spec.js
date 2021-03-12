const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const through2 = require('through2');

const CASLegacyParser = require('../../streams/CASLegacyParser');
const CompressedLegacyFileReader = require('../../streams/CompressedLegacyFileReader');

const casIndex = '02';
const testCasPath = 'D:\\Origin\\Madden NFL 21\\Data\\Win32\\superbundlelayout\\madden_installpackage_00\\cas_' + casIndex + '.cas';
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
            const fileName = 'D:\\GameRips\\Madden 21\\LegacyDump3\\' + casIndex + '_' + casHexIndex;
            let fileExtension = '';

            const fileExtensionDetector = through2(function(chunk, enc, cb) {
                if (fileExtension === '') {
                    if (chunk[0] === 0x44 && chunk[1] === 0x42) {
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
                    else {
                        fileExtension = 'unknown';
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