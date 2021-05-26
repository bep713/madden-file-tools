const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { expect } = require('chai');
const { pipeline, Transform } = require('stream');
const ASTParser = require('../../streams/ASTParser');
const ASTTransformer = require('../../streams/ASTTransformer');

let transformer, result = Buffer.from([]);

const astFileTest = path.join(__dirname, '../data/cafe2scriptpod.AST');
const astPadBetweenTocsPath = path.join(__dirname, '../data/AST/AST_PadBetweenTocs.ast');
const astAdditionalOffsetAfterTocPath = path.join(__dirname, '../data/AST/AST_AdditionalOffsetAfterToc.ast');
const astDescriptionsPath = path.join(__dirname, '../data/AST/AST_Descriptions.ast');
const cafeAST = fs.readFileSync(astFileTest);

const astPadBetweenTocs = fs.readFileSync(astPadBetweenTocsPath);
const astAdditionalOffsetAfterToc = fs.readFileSync(astAdditionalOffsetAfterTocPath);
const astOneChange = fs.readFileSync(path.join(__dirname, '../data/AST/AST_OneChange.ast'));
const astDescriptions = fs.readFileSync(path.join(__dirname, '../data/AST/AST_Descriptions.ast'));
const astAlterToc = fs.readFileSync(path.join(__dirname, '../data/AST/AST_OneChangeAlterToc.ast'));
const astOneChangeLessPad = fs.readFileSync(path.join(__dirname, '../data/AST/AST_OneChangeLessPad.ast'));
const astOneChangeLargerFile = fs.readFileSync(path.join(__dirname, '../data/AST/AST_OneChangeLargerFile.ast'));
const astOneChangeNextLinesUp = fs.readFileSync(path.join(__dirname, '../data/AST/AST_OneChangeNextLinesUp.ast'));
const astPadBetweenTocsLargerFile = fs.readFileSync(path.join(__dirname, '../data/AST/AST_PadBetweenTocsLargerFile.ast'));
const astOneChangeLargerFileMorePad = fs.readFileSync(path.join(__dirname, '../data/AST/AST_OneChangeLargerFileMorePad.ast'));

describe('AST Transformer unit tests', () => {
    describe('no change to file', () => {
        before((done) => {
            parseASTFile(astFileTest)
                .then(function (parser) {
                    transformer = new ASTTransformer(parser.file);
                    getTransformationResult(astFileTest, transformer)
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, cafeAST);
        });
    });

    describe('changing one file in the AST', () => {
        before((done) => {
            parseASTFile(astFileTest)
                .then(function (parser) {
                    const toc = parser.file.tocs.find((fileTocs) => { return fileTocs.index === 0; });
                    toc.data = Buffer.from([0x11, 0x22, 0x33, 0x44, 0x55]);

                    transformer = new ASTTransformer(parser.file);

                    getTransformationResult(astFileTest, transformer, path.join(__dirname, '../data/AST/ASTOneChangeResult.ast'))
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, astOneChange);
        });
    });

    describe('changing one file in the AST which requires modifying tocs', () => {
        before((done) => {
            parseASTFile(astFileTest)
                .then(function (parser) {
                    const toc = parser.file.tocs.find((fileTocs) => { return fileTocs.index === 1; });
                    toc.data = Buffer.from([0x11, 0x22, 0x33]);

                    transformer = new ASTTransformer(parser.file);

                    getTransformationResult(astFileTest, transformer, path.join(__dirname, '../data/AST/ASTOneChangeAlterTocResult.ast'))
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, astAlterToc);
        });
    });

    describe('changing one file in the AST which requires modifying tocs - and less padding than before', () => {
        before((done) => {
            parseASTFile(astFileTest)
                .then(function (parser) {
                    const toc = parser.file.tocs.find((fileTocs) => { return fileTocs.index === 1; });
                    toc.data = Buffer.from([0x11, 0x22, 0x33, 0x44, 0x55, 0x66]);

                    transformer = new ASTTransformer(parser.file);

                    getTransformationResult(astFileTest, transformer, path.join(__dirname, '../data/AST/ASTOneChangeLessPadResult.ast'))
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, astOneChangeLessPad);
        });
    });

    describe('changing one file to be larger than original in AST', () => {
        before((done) => {
            parseASTFile(astFileTest)
                .then(function (parser) {
                    const toc = parser.file.tocs.find((fileTocs) => { return fileTocs.index === 1; });
                    toc.data = Buffer.alloc(toc.fileSizeInt + 2, 0x11);

                    transformer = new ASTTransformer(parser.file);

                    getTransformationResult(astFileTest, transformer, path.join(__dirname, '../data/AST/ASTOneChangeLargerFileResult.ast'))
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, astOneChangeLargerFile);
        });
    });

    describe('changing one file to be larger than original in AST - more padding, new start position', () => {
        before((done) => {
            parseASTFile(astFileTest)
                .then(function (parser) {
                    const toc = parser.file.tocs.find((fileTocs) => { return fileTocs.index === 1; });
                    toc.data = Buffer.alloc(toc.fileSizeInt + 4, 0x11);

                    transformer = new ASTTransformer(parser.file);

                    getTransformationResult(astFileTest, transformer, path.join(__dirname, '../data/AST/ASTOneChangeLargerFileMorePadResult.ast'))
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, astOneChangeLargerFileMorePad);
        });
    });

    describe('handles large amounts of padding between TOCs', () => {
        before((done) => {
            parseASTFile(astPadBetweenTocsPath)
                .then(function (parser) {
                    transformer = new ASTTransformer(parser.file);

                    getTransformationResult(astPadBetweenTocsPath, transformer, path.join(__dirname, '../data/AST/ASTPadBetweenTocsResult.ast'))
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, astPadBetweenTocs);
        });
    });

    describe('handles large amounts of padding between TOCs and editing for a larger file', () => {
        before((done) => {
            parseASTFile(astPadBetweenTocsPath)
                .then(function (parser) {
                    const toc = parser.file.tocs.find((fileTocs) => { return fileTocs.index === 1; });
                    toc.data = Buffer.alloc(toc.fileSizeInt + 2, 0x11);
                    transformer = new ASTTransformer(parser.file);

                    getTransformationResult(astPadBetweenTocsPath, transformer, path.join(__dirname, '../data/AST/ASTPadBetweenTocsLargerFileResult.ast'))
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, astPadBetweenTocsLargerFile);
        });
    });

    describe('transforms correctly if next TOC does not need padding', () => {
        before((done) => {
            parseASTFile(astFileTest)
                .then(function (parser) {
                    const toc1 = parser.file.tocs.find((fileTocs) => { return fileTocs.index === 0; });
                    toc1.data = Buffer.from([0x11, 0x22, 0x33, 0x44, 0x55]);

                    const toc2 = parser.file.tocs.find((fileTocs) => { return fileTocs.index === 1; });
                    toc2.data = Buffer.alloc(toc2.fileSizeInt + 3, 0x11);
                    transformer = new ASTTransformer(parser.file);

                    getTransformationResult(astFileTest, transformer, path.join(__dirname, '../data/AST/ASTOneChangeNextLinesUpResult.ast'))
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, astOneChangeNextLinesUp);
        });
    });

    describe('transforms correctly if next TOC does not need padding', () => {
        before((done) => {
            parseASTFile(astAdditionalOffsetAfterTocPath)
                .then(function (parser) {
                    const transformer = new ASTTransformer(parser.file);
                    getTransformationResult(astAdditionalOffsetAfterTocPath, transformer, path.join(__dirname, '../data/AST/ASTAdditionalOffsetAfterTocResult.ast'))
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, astAdditionalOffsetAfterToc);
        });
    });

    describe('transforms correctly if AST file contains descriptions', () => {
        before((done) => {
            parseASTFile(astDescriptionsPath)
                .then(function (parser) {
                    const toc1 = parser.file.tocs.find((fileTocs) => { return fileTocs.index === 0; });
                    toc1.isChanged = true;

                    const transformer = new ASTTransformer(parser.file);
                    getTransformationResult(astDescriptionsPath, transformer, path.join(__dirname, '../data/AST/ASTDescriptionsResult.ast'))
                        .then(function (results) {
                            result = results;
                            done();
                        });
                });
        });

        it('contains expected result', () => {
            testBufferHashes(result, astDescriptions);
        });
    });
});

function parseASTFile(inputFilePath) {
    return new Promise((resolve, reject) => {
        const parser = new ASTParser();
    
        pipeline(
            fs.createReadStream(inputFilePath),
            parser,
            (err) => {
                if (err) {
                    console.error('Read pipeline failed: ', err);
                    reject(err);
                }
    
                resolve(parser);
            }
        );
    })
};

function getTransformationResult(inputFilePath, transformer, outputFilePath) {
    return new Promise((resolve, reject) => {
        let results = [];
        let writeStream;

        if (outputFilePath) {
            writeStream = fs.createWriteStream(outputFilePath);
        }
        else {
            writeStream = new Transform({
                transform(chunk, enc, cb) {
                    cb();
                }
            });
        }
    
        pipeline(
            fs.createReadStream(inputFilePath),
            transformer,
            new Transform({
                transform(chunk, enc, cb) {
                    results.push(chunk);
                    this.push(chunk);
                    cb();
                }
            }),
            writeStream,
            (err) => {
                if (err) {
                    console.error('Transform pipeline failed: ', err);
                    reject(err);
                }
    
                resolve(Buffer.concat(results));
            }
        )
    });
};

function testBufferHashes(bufferToTest, bufferToCompare) {
    let testHash = crypto.createHash('sha1');
    testHash.update(bufferToTest);

    let compareHash = crypto.createHash('sha1');
    compareHash.update(bufferToCompare);

    expect(testHash.digest('hex')).to.eql(compareHash.digest('hex'));
};