const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;

const CASLegacyParser = require('../../streams/CASLegacyParser');
const testCasPath = path.join(__dirname, '../data/CASLegacyParser/test.cas');
const expected71ASTFile = fs.readFileSync(path.join(__dirname, '../data/CASLegacyParser/compressed71Ast.cas'));
const expectedCompressedFile = fs.readFileSync(path.join(__dirname, '../data/CASLegacyParser/compressed.cas'));

let legacyParser, emittedStreamsRawData = [], emittedObjectStreams = [];

describe('CAS Legacy Parser unit tests', () => {
    before(function (done) {
        this.timeout(10000);
        console.time('parse');
        legacyParser = new CASLegacyParser();

        const stream = fs.createReadStream(testCasPath);

        stream.on('end', () => {
            console.timeEnd('parse');
            done();
        });

        legacyParser.on('compressed-data', (data) => {
            let streamData = Buffer.from([]);
            let objectStreams = [];

            data.stream.on('end', () => {
                emittedStreamsRawData.push(streamData);
                emittedObjectStreams.push(objectStreams);
            });

            data.stream.on('data', (buf) => {
                streamData = Buffer.concat([streamData, buf.data]);
                objectStreams.push(buf);
            });
        });

        stream
            .pipe(legacyParser);
    });

    it('emits all compressed files', () => {
        expect(emittedStreamsRawData.length).to.equal(11);
    });

    describe('1st buffer', () => {
        it('emits expected compressed buffer', () => {
            testBufferHashes(emittedStreamsRawData[0], expectedCompressedFile);
        });

        it('emits correct uncompressed size', () => {
            const objectStreams = emittedObjectStreams[0];
            const allButLastStream = objectStreams.slice(0, objectStreams.length - 2);

            allButLastStream.forEach((objectStream) => {
                expect(objectStream.uncompressedSize).to.eql(0x10000);
            });

            expect(objectStreams[objectStreams.length - 1].uncompressedSize).to.eql(0xDC6E);
        });

        it('emits correct compression types', () => {
            const objectStreams = emittedObjectStreams[0];

            objectStreams.forEach((objectStream) => {
                expect(objectStream.compressionType).to.equal(9);
            });
        });
    });

    describe('2nd buffer', () => {
        const bufferIndex = 1;

        it('emits expected compressed buffer', () => {
            testBufferHashes(emittedStreamsRawData[bufferIndex], expectedCompressedFile);
        });

        it('emits correct uncompressed size', () => {
            const objectStreams = emittedObjectStreams[bufferIndex];
            const allButLastStream = objectStreams.slice(0, objectStreams.length - 2);

            allButLastStream.forEach((objectStream) => {
                expect(objectStream.uncompressedSize).to.eql(0x10000);
            });

            expect(objectStreams[objectStreams.length - 1].uncompressedSize).to.eql(0xDC6E);
        });

        it('emits correct compression types', () => {
            const objectStreams = emittedObjectStreams[bufferIndex];

            objectStreams.forEach((objectStream) => {
                expect(objectStream.compressionType).to.equal(9);
            });
        });
    });

    describe('3rd buffer', () => {
        const bufferIndex = 2;

        it('emits expected compressed buffer (3rd)', () => {
            testBufferHashes(emittedStreamsRawData[bufferIndex], Buffer.from([0x48, 0x00, 0x00, 0x0C, 0x16]));
        });

        it('correct compression type', () => {
            const objectStreams = emittedObjectStreams[bufferIndex];

            objectStreams.forEach((objectStream) => {
                expect(objectStream.compressionType).to.equal(0);
            });
        });

        it('correct uncompressed size', () => {
            expect(emittedObjectStreams[bufferIndex][0].uncompressedSize).to.eql(0x5);
        });
    });

    it('emits expected compressed buffer (4th)', () => {
        testBufferHashes(emittedStreamsRawData[3], Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF]));
    });

    it('emits expected compressed buffer (5th)', () => {
        testBufferHashes(emittedStreamsRawData[4], Buffer.from([0xFF, 0xFF, 0xFF]));
    });

    it('emits expected compressed buffer (6th)', () => {
        testBufferHashes(emittedStreamsRawData[5], Buffer.from([0xAA, 0xAA, 0xAA]));
    });

    it('emits expected compressed buffer (7th)', () => {
        testBufferHashes(emittedStreamsRawData[6], Buffer.from([0xBB, 0xBB, 0xBB]));
    });

    it('emits expected compressed buffer (8th)', () => {
        testBufferHashes(emittedStreamsRawData[7], Buffer.from([0xCC, 0xCC, 0xCC]));
    });

    it('emits expected compressed buffer (9th)', () => {
        testBufferHashes(emittedStreamsRawData[8], Buffer.from([0x42, 0x47, 0x46, 0x41, 0x31, 0x2E, 0x30, 0x35]));
    });

    it('emits expected compressed buffer (10th)', () => {
        testBufferHashes(emittedStreamsRawData[9], Buffer.from([0xDD, 0xDD, 0xDD]));
    });

    describe('11th buffer', () => {
        const bufferIndex = 10;

        it('emits expected compressed buffer (11th)', () => {
            testBufferHashes(emittedStreamsRawData[bufferIndex], expected71ASTFile);
        });

        it('emits correct compression types', () => {
            expect(emittedObjectStreams[bufferIndex][0].compressionType).to.equal(0);
            expect(emittedObjectStreams[bufferIndex][1].compressionType).to.equal(9);
        });

        it('emits correct uncompressed size', () => {
            expect(emittedObjectStreams[bufferIndex][0].uncompressedSize).to.equal(0x10000);
            expect(emittedObjectStreams[bufferIndex][1].uncompressedSize).to.equal(0x5);
        });
    });
});

function testBufferHashes(bufferToTest, bufferToCompare) {
    let testHash = crypto.createHash('sha1');
    testHash.update(bufferToTest);

    let compareHash = crypto.createHash('sha1');
    compareHash.update(bufferToCompare);

    expect(testHash.digest('hex')).to.eql(compareHash.digest('hex'));
};