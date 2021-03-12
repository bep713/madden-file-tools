const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const crypto = require('crypto');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');

let lz4Spy = {
    'decodeBlock': sinon.spy((data, buffer) => {
        buffer = Buffer.from([0x0])
        return 1;
    })
};

const CompressedLegacyFileReader = proxyquire('../../streams/CompressedLegacyFileReader', {
    'lz4': lz4Spy
});

const CASLegacyParser = require('../../streams/CASLegacyParser');
const lz4 = require('lz4');

const testCasPath = path.join(__dirname, '../data/CASLegacyParser/test.cas');
const expected71ASTFile = fs.readFileSync(path.join(__dirname, '../data/CASLegacyParser/compressed71Ast.cas'));

let casParser, legacyParser;

let uncompressedBuffers = [];
const numberOfStreams = 11;
let currentStream = 1;

describe('Legacy compressed file reader unit tests', () => {
    before(function (done) {
        this.timeout(10000);
        casParser = new CASLegacyParser();

        const readStream = fs.createReadStream(testCasPath);

        casParser.on('compressed-data', (data) => {
            let uncompressedBuffer = Buffer.from([]);
            const legacyParser = new CompressedLegacyFileReader();

            legacyParser.on('end', () => {
                uncompressedBuffers.push(uncompressedBuffer);
                currentStream += 1;

                if (currentStream === numberOfStreams) {
                    done();
                }
            });
    
            legacyParser.on('data', (buf) => {
                uncompressedBuffer = Buffer.concat([uncompressedBuffer, buf]);
            });

            data.stream
                .pipe(legacyParser);
        });

        readStream
            .pipe(casParser);
    });

    it('1st buffer', () => {
        testBufferHashes(uncompressedBuffers[0], Buffer.alloc(50));
    });

    it('2nd buffer', () => {
        testBufferHashes(uncompressedBuffers[1], Buffer.alloc(50));
    });

    it('3rd buffer', () => {
        testBufferHashes(uncompressedBuffers[2], Buffer.from([0x48, 0x00, 0x00, 0x0C, 0x16]))
    });

    it('11th buffer', () => {
        testBufferHashes(uncompressedBuffers[10], Buffer.concat([expected71ASTFile.slice(0, expected71ASTFile.length - 5), Buffer.from([0x0])]))
    });
});

function testBufferHashes(bufferToTest, bufferToCompare) {
    let testHash = crypto.createHash('sha1');
    testHash.update(bufferToTest);

    let compareHash = crypto.createHash('sha1');
    compareHash.update(bufferToCompare);

    expect(testHash.digest('hex')).to.eql(compareHash.digest('hex'));
};