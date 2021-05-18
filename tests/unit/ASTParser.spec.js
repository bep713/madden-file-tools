const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const { pipeline, Transform } = require('stream');
const ASTParser = require('../../streams/ASTParser');

describe('AST Parser unit tests', () => {
    it('outputs an event when parsing compressed files', (done) => {
        const parser = new ASTParser();
        let compressedFileCounter = 0;

        parser.on('compressed-file', (astData) => {
            compressedFileCounter += 1;
        });

        pipeline(
            fs.createReadStream(path.join(__dirname, '../data/awards.AST')),
            parser,
            (err) => {
                expect(compressedFileCounter).to.equal(parser.file.tocs.length);
                done();
            }
        )
    });

    it('outputs expected object', (done) => {
        const parser = new ASTParser();

        parser.on('compressed-file', (astData) => {
            if (astData.toc.index === 0) {
                expect(astData.stream).to.not.be.null;
    
                expect(astData.toc.id).to.eql(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]));
                expect(astData.toc.startPositionInt).to.eql(0x2F8E);
                expect(astData.toc.startPositionInFile).to.eql(0x17C70);
                expect(astData.toc.fileSizeInt).to.eql(0x1986)
                expect(astData.toc.index).to.eql(0);
                expect(astData.toc.uncompressedSizeInt).to.eql(0x26FA);
                expect(astData.toc.uncompressedSize).to.eql(Buffer.from([0xFA, 0x26]));
                expect(astData.toc.isCompressed).to.be.true;
    
                done();
            }

        });

        pipeline(
            fs.createReadStream(path.join(__dirname, '../data/awards.AST')),
            parser,
            (err) => {
                if(err) {
                    console.error(err);
                    done(err);
                }
            }
        )
    });

    it('outputs expected buffer sizes', function (done) {
        this.timeout(10000);

        const parser = new ASTParser();
        let promises = [];

        parser.on('compressed-file', (astData) => {
            promises.push(new Promise((resolve, reject) => {
                let tempBufs = [];
    
                pipeline(
                    astData.stream,
                    new Transform({
                        transform(chunk, enc, cb) {
                            tempBufs.push(chunk);
                            cb();
                        }
                    }),
                    (err) => {
                        if (err) {
                            console.error(err);
                            reject(err);
                        }
                        else {
                            const completeBuf = Buffer.concat(tempBufs);
                            expect(completeBuf.length).to.eql(astData.toc.fileSizeInt);
                            resolve();
                        }
                    }
                )
            }));
        });

        pipeline(
            fs.createReadStream(path.join(__dirname, '../data/awards.AST')),
            parser,
            (err) => {
                if(err) {
                    console.error(err);
                    done(err);
                }

                Promise.all(promises)
                    .then(() => {
                        done();
                    })
                    .catch((err) => {
                        console.error(err);
                        done(err);
                    });
            }
        )
    });

    // Disabled as file reference is outside project - the file size is too large to include
    
    // it('outputs expected buffer sizes - highWaterMark hit', function (done) {
    //     this.timeout(10000);

    //     const parser = new ASTParser();
    //     let promises = [];

    //     parser.on('compressed-file', (astData) => {
    //         promises.push(new Promise((resolve, reject) => {
    //             let tempBufs = [];
    
    //             pipeline(
    //                 astData.stream,
    //                 new Transform({
    //                     transform(chunk, enc, cb) {
    //                         tempBufs.push(chunk);
    //                         cb();
    //                     }
    //                 }),
    //                 (err) => {
    //                     if (err) {
    //                         console.error(err);
    //                         reject(err);
    //                     }
    //                     else {
    //                         const completeBuf = Buffer.concat(tempBufs);
    //                         expect(completeBuf.length).to.eql(astData.toc.fileSizeInt);
    //                         resolve();
    //                     }
    //                 }
    //             )
    //         }));
    //     });

    //     pipeline(
    //         fs.createReadStream('D:\\Media\\Games\\NFL Head Coach 09 [U] [BLUS-30128]\\PS3_GAME\\USRDIR\\qkl_fe2ig.ast'),
    //         parser,
    //         (err) => {
    //             if(err) {
    //                 console.error(err);
    //                 done(err);
    //             }

    //             Promise.all(promises)
    //                 .then(() => {
    //                     done();
    //                 })
    //                 .catch((err) => {
    //                     console.error(err);
    //                     done(err);
    //                 });
    //         }
    //     )
    // });
});