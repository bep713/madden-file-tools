const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const { pipeline, Writable } = require('stream');
const CASBlockTransformer = require('../../streams/CASBlockTransformer');
const CASBlockParser = require('../../streams/CASBlockParser');

describe('CAS block writer unit tests', () => {
    describe('no compression', () => {
        it('expected result - 1 block', async () => {        
            const FILE_TO_TEST = path.join(__dirname, '../data/AST/AST_Descriptions.ast');
            const blocks = await runTransformFromFile(FILE_TO_TEST);
            expect(blocks.length).to.equal(1);

            const result = blocks[0];
    
            expect(result.readUInt32BE(0)).to.equal(0x2CF);
            expect(result.readUInt16LE(4)).to.equal(0x7000);
            expect(result.readUInt16BE(6)).to.equal(0x2CF);
            expect(result.length).to.equal(0x2CF + 8);
        });
        
        it('expected result - multi-block', async () => {        
            const FILE_TO_TEST = path.join(__dirname, '../data/AST/replacePortraitTest.ast');
            const blocks = await runTransformFromFile(FILE_TO_TEST);
            expect(blocks.length).to.equal(73);

            const result = blocks[0];
    
            expect(result.readUInt32BE(0)).to.equal(0x10000);
            expect(result.readUInt16LE(4)).to.equal(0x7100);
            expect(result.readUInt16BE(6)).to.equal(0x0);
            expect(result.length).to.equal(0x10008);

            const lastBlock = blocks[blocks.length - 1];

            expect(lastBlock.readUInt32BE(0)).to.equal(0x777F);
            expect(lastBlock.readUInt16LE(4)).to.equal(0x7000);
            expect(lastBlock.readUInt16BE(6)).to.equal(0x777F);
            expect(lastBlock.length).to.equal(0x777F + 8);
        });
    });

    describe('zlib compression', () => {
        it('expected result - 1 block', async () => {
            const FILE_TO_TEST = path.join(__dirname, '../data/ebx/M22_ballrules_simulation.ebx.uncompressed.dat');
            const blocks = await runTransformFromFile(FILE_TO_TEST, CASBlockParser.COMPRESSION_TYPE.ZSTD);
            expect(blocks.length).to.equal(1);

            const result = blocks[0];
    
            expect(result.readUInt32BE(0)).to.equal(0x1E84);
            expect(result.readUInt16LE(4)).to.equal(0x700F);
            expect(result.readUInt16BE(6)).to.equal(0xA54);
            expect(result.length).to.equal(0xA54 + 8);
        });
    });
});

async function runTransformFromFile(path, compression) {
    let result, bufferArrays = [];

    await new Promise((resolve, reject) => {
        pipeline(
            fs.createReadStream(path),
            new CASBlockTransformer({
                compressionType: compression
            }),
            new Writable({
                write(chunk, enc, cb) {
                    bufferArrays.push(chunk);
                    cb();
                }
            }),
            (err) => {
                if (err) reject(err);
                resolve();
            }
        );
    });

    return bufferArrays;
}