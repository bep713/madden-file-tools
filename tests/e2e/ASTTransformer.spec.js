const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { expect } = require('chai');
const { pipeline, Transform, Writable } = require('stream');
const ASTParser = require('../../streams/ASTParser');
const ASTTransformer = require('../../streams/ASTTransformer');

// const portraitASTFilePath = path.join(__dirname, '../data/coachportraits.AST')


let parser, transformer, result;

describe('AST Transformer end to end tests', () => {
    describe('no changes - performance benchmark', () => {
        const portraitASTFilePath = 'D:\\Media\\Games\\NFL Head Coach 09 [U] [BLUS-30128]\\PS3_GAME\\USRDIR\\qkl_fe2ig.ast'
        const portraitAST = fs.readFileSync(portraitASTFilePath);

        before(function (done) {
            this.timeout(10000);
            let results = [];
            parser = new ASTParser();

            console.time('read');
            pipeline(
                fs.createReadStream(portraitASTFilePath),
                parser,
                (err) => {
                    if (err) {
                        console.error('Error reading portrait AST');
                        done();
                    }
                    else {
                        console.timeEnd('read');

                        console.time('transform');
                        transformer = new ASTTransformer(parser.file);

                        pipeline(
                            fs.createReadStream(portraitASTFilePath),
                            transformer,
                            new Transform({
                                transform(chunk, enc, cb) {
                                    results.push(chunk);
                                    this.push(chunk);
                                    cb();
                                }
                            }),
                            new Writable({
                                write(chunk, enc, cb) {
                                    cb();
                                }
                            }),
                            // fs.createWriteStream(path.join(__dirname, '../data/AST/portraitResult.ast')),
                            (err) => {
                                if (err) {
                                    console.error('Error transforming AST:', err);
                                    done();
                                }
                                else {
                                    console.timeEnd('transform');
                                    result = Buffer.concat(results);
                                    done();
                                }
                            }
                        )
                    }
                }
            )
        });

        it('files are identical', function() {
            this.timeout(10000);
            testBufferHashes(result, portraitAST);
        });
    });

    describe('can replace one portrait with itself (should be identical)', () => {
        const coachASTFilePath = path.join(__dirname, '../data/coachportraits.AST');
        const coachASTFile = fs.readFileSync(coachASTFilePath);
        const coachPortraitFirstFile = fs.readFileSync(path.join(__dirname, '../data/AST/CoachPortrait_FirstFile.DDS'));
        const firstFileDeflated = zlib.deflateSync(coachPortraitFirstFile, {
            level: 9
        });

        before(function (done) {
            parseASTFile(coachASTFilePath)
                .then((parser) => {
                    const firstToc = parser.file.tocs.find((toc) => {
                        return toc.index === 0;
                    });

                    firstToc.data = firstFileDeflated;

                    transformer = new ASTTransformer(parser.file);
                    getTransformationResult(coachASTFilePath, transformer)
                        .then((results) => {
                            result = results;
                            done();
                        })
                })
        });

        it('expected result', () => {
            testBufferHashes(result, coachASTFile);
        });
    });

    describe('can replace one portrait (replace 4th with 5th)', () => {
        let fifthPortraitBuffer = [];
        let bufferAfterTransform = [];

        before(function (done) {
            const coachASTFilePath = path.join(__dirname, '../data/coachportraits.AST');
            const transformResultPath = path.join(__dirname, '../data/AST/replacePortraitTest.ast');

            let transformPromise;
            let postTransformPromise;

            parser = new ASTParser();
            parser.on('compressed-file', (astData) => {
                if (astData.toc.index === 4) {
                    transformPromise = new Promise((resolve, reject) => {
                        pipeline(
                            astData.stream,
                            new Transform({
                                transform(chunk, enc, cb) {
                                    fifthPortraitBuffer.push(chunk);
                                    cb();
                                }
                            }),
                            (err) => {
                                if (err) {
                                    console.error(err);
                                    reject(err);
                                }
                                else {
                                    fifthPortraitBuffer = Buffer.concat(fifthPortraitBuffer);
                                    resolve(fifthPortraitBuffer);
                                }
                            }
                        )
                    });
                }
            });

            parseASTFile(coachASTFilePath, parser)
                .then((parser) => {
                    transformPromise.then((fifthBuffer) => {
                        const fourthToc = parser.file.tocs.find((toc) => { return toc.index === 3; });
                        fourthToc.data = fifthPortraitBuffer;

                        transformer = new ASTTransformer(parser.file);
                        getTransformationResult(coachASTFilePath, transformer, transformResultPath)
                            .then((results) => {
                                const newParser = new ASTParser();
                                newParser.on('compressed-file', (astData) => {
                                    if (astData.toc.index === 3) {
                                        postTransformPromise = new Promise((resolve, reject) => {
                                            pipeline(
                                                astData.stream,
                                                new Transform({
                                                    transform(chunk, enc, cb) {
                                                        bufferAfterTransform.push(chunk);
                                                        cb();
                                                    }
                                                }),
                                                (err) => {
                                                    if (err) {
                                                        console.error(err);
                                                        reject(err);
                                                    }
                                                    bufferAfterTransform = Buffer.concat(bufferAfterTransform);
                                                    resolve(bufferAfterTransform);
                                                }
                                            )
                                        });
                                    }
                                })

                                parseASTFile(transformResultPath, newParser)
                                    .then((parser) => {
                                        postTransformPromise.then((bufferAfterTransform) => {
                                            done();
                                        });
                                    });
                            });
                    });
                });
        });

        it('expected result', () => {
            testBufferHashes(bufferAfterTransform, fifthPortraitBuffer);
        });
    })
});

function parseASTFile(inputFilePath, parser) {
    return new Promise((resolve, reject) => {
        if (!parser) {
            parser = new ASTParser();
        }
    
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