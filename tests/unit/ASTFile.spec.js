const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream');
const expect = require('chai').expect;
const ASTParser = require('../../streams/ASTParser');

const awardsPath = path.join(__dirname, '../data/awards.AST');
const cafePath = path.join(__dirname, '../data/cafe2scriptpod.AST');
const coachPortraitsPath = path.join(__dirname, '../data/coachportraits.AST');
const descriptionsPath = path.join(__dirname, '../data/AST/AST_Descriptions.ast');
const additionalOffsetAfterTocPath = path.join(__dirname, '../data/AST/AST_AdditionalOffsetAfterToc.ast');

let awards, cafe, coachPortraits, additionalOffset, descriptions;
let awardsParser, cafeParser, coachPortraitsParser, additionalOffsetParser, descriptionsParser;

describe('AST File unit tests', () => {
    before(function (done) {
        awardsParser = new ASTParser();
        cafeParser = new ASTParser();
        coachPortraitsParser = new ASTParser();
        additionalOffsetParser = new ASTParser();
        descriptionsParser = new ASTParser();

        function parseFile (path, parser) {
            return new Promise((resolve, reject) => {
                let i = 0;
                pipeline(
                    fs.createReadStream(path),
                    parser,
                    (err) => {
                        if (err) { console.error('Pipeline failed', err); }
                    }
                );

                parser.on('done', function () {
                    resolve(parser.file);
                });

                // parser.on('compressed-file', function (buf) {
                //     buf.stream
                //         .pipe(zlib.createInflate())
                //         .pipe(fs.createWriteStream('D:\\Projects\\Madden 20\\test\\' + buf.toc.id.toString('hex') + '.dds'));
                // });
            });
        };

        let promises = [
            parseFile(awardsPath, awardsParser), 
            parseFile(cafePath, cafeParser), 
            parseFile(coachPortraitsPath, coachPortraitsParser),
            parseFile(additionalOffsetAfterTocPath, additionalOffsetParser),
            parseFile(descriptionsPath, descriptionsParser)
        ];

        Promise.all(promises)
            .then((results) => {
                awards = results[0];
                cafe = results[1];
                coachPortraits = results[2];
                additionalOffset = results[3];
                descriptions = results[4];

                done();
            })
            .catch((err) => {
                console.error(err);
            });
    });
    
    describe('parses the file header correctly', () => {
        function assertAllEqual(key, ...checks) {
            expect(byString(awards.header, key)).to.eql(checks[0]);
            expect(byString(cafe.header, key)).to.eql(checks[1]);
            expect(byString(coachPortraits.header, key)).to.eql(checks[2]);
            expect(byString(additionalOffset.header, key)).to.eql(checks[3]);
            expect(byString(descriptions.header, key)).to.eql(checks[4]);
        };

        function byString(o, s) {
            s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
            s = s.replace(/^\./, '');           // strip a leading dot
            var a = s.split('.');
            for (var i = 0, n = a.length; i < n; ++i) {
                var k = a[i];
                if (k in o) {
                    o = o[k];
                } else {
                    return;
                }
            }
            return o;
        };

        it('header is not empty', () => {
            expect(awards.header).to.not.be.undefined;
            expect(cafe.header).to.not.be.undefined;
        });

        it('parses the file signature correctly', () => {
            const astSignature = Buffer.from([0x42, 0x47, 0x46, 0x41, 0x31, 0x2E, 0x30, 0x35]);
            assertAllEqual('fileSignature', astSignature, astSignature, astSignature, astSignature, astSignature);
        });

        it('parses number of blocks correctly', () => {
            assertAllEqual('numberOfBlocks', 0x11, 0x3, 0x82, 0x3, 0x18BE6784);
        });

        it('parses number of files correctly', () => {
            assertAllEqual('numberOfFiles', 0x10, 0x2, 0x81, 0x2, 0x1);
        });

        it('parses TOC offset correctly', () => {
            assertAllEqual('tableOfContentsOffset', 0x40, 0x40, 0x40, 0x40, 0x40);
        });

        it('parses TOC length correctly', () => {
            assertAllEqual('tableOfContentsLength', 0xF4, 0x28, 0x895, 0x24, 0x3D);
        });

        it('parses unknown1 length correctly', () => {
            assertAllEqual('toc.unknown1.length', 0x0, 0x1, 0x0, 0x1, 0x0);
        });

        it('parses id length correctly', () => {
            assertAllEqual('toc.id.length', 0x8, 0x8, 0x8, 0x8, 0x8);
        });

        it('pases start position length correctly', () => {
            assertAllEqual('toc.startPosition.length', 0x2, 0x2, 0x3, 0x2, 0x1);
        });

        it('parses file size length correctly', () => {
            assertAllEqual('toc.fileSize.length', 0x2, 0x2, 0x2, 0x2, 0x2);
        });

        it('parses uncompressed length correctly', () => {
            assertAllEqual('toc.uncompressedSize.length', 0x2, 0x2, 0x3, 0x2, 0x2);
        });

        it('parses offset shift correctly', () => {
            assertAllEqual('offsetShift', 3, 3, 3, 3, 3);
        });

        it('parses TOC additional offset correctly', () => {
            assertAllEqual('tableOfContentsAdditionalOffset', 0x4, 0x8, 0x4, 0x4, 0x4);
        });

        it('parses TOC start correctly', () => {
            assertAllEqual('tableOfContentsStart', 0x40, 0x40, 0x40, 0x40, 0x40);
        });

        it('parses individual TOC length correctly', () => {
            assertAllEqual('individualTOCLength', 14, 15, 16, 15, 56);
        });

        it('parses additional offset after TOC', () => {
            assertAllEqual('offsetAfterToc', 4, 0, 3, 4, 3);
        });
    });

    describe('parses table of contents list correctly', () => {
        describe('awards AST parsed correctly', () => {
            it('parses correct number of tocs', () => {
                expect(awards.tocs.length).to.equal(awards.header.numberOfFiles);
            });

            it('first toc', () => {
                const firstToc = awards.tocs.find((toc) => {
                    return toc.index === 0;
                });

                expect(firstToc.id).to.eql(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]));
                expect(firstToc.startPositionInt).to.eql(0x2F8E);
                expect(firstToc.startPositionInFile).to.eql(0x17C70);
                expect(firstToc.fileSizeInt).to.eql(0x1986)
                expect(firstToc.index).to.eql(0);
                expect(firstToc.uncompressedSizeInt).to.eql(0x26FA);
                expect(firstToc.uncompressedSize).to.eql(Buffer.from([0xFA, 0x26]));
                expect(firstToc.isCompressed).to.be.true;
            });

            it('second toc', () => {
                const secondToc = awards.tocs.find((toc) => {
                    return toc.index === 1;
                });

                expect(secondToc.id).to.eql(Buffer.from([0x01, 0x00, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]));
                expect(secondToc.startPositionInt).to.eql(0x32BF);
                expect(secondToc.startPositionInFile).to.eql(0x195F8);
                expect(secondToc.fileSizeInt).to.eql(0x1818);
                expect(secondToc.index).to.eql(1);
                expect(secondToc.isCompressed).to.be.true;
            });

            it('empty tocs', () => {
                const emptyTocs = awards.tocs.filter((toc) => {
                    return !toc || toc === {};
                });

                expect(emptyTocs.length).to.equal(0);
            });
        });

        describe('cafe AST parsed correctly', () => {
            it('number of tocs', () => {
                expect(cafe.tocs.length).to.equal(cafe.header.numberOfFiles);
            });

            it('first toc', () => {
                const firstToc = cafe.tocs.find((toc) => {
                    return toc.index === 0;
                });

                expect(firstToc.id).to.eql(Buffer.from([0xFD, 0xFF, 0xC5, 0x81, 0xF9, 0x1B, 0x2B, 0x91]));
                expect(firstToc.startPositionInt).to.eql(0x2D7);
                expect(firstToc.startPositionInFile).to.eql(0x16B8);
                expect(firstToc.fileSizeInt).to.eql(0xD15);
                expect(firstToc.index).to.eql(0);
                expect(firstToc.isCompressed).to.be.true;
            });
        });

        describe('coach portrait AST parsed correctly', () => {
            it('number of files', () => {
                expect(coachPortraits.tocs.length).to.equal(coachPortraits.header.numberOfFiles);
            });

            it('first toc', () => {
                const firstToc = coachPortraits.tocs.find((toc) => {
                    return toc.index === 0;
                });

                expect(firstToc.id).to.eql(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x34, 0x3E, 0xF1, 0x69]));
                expect(firstToc.startPositionInt).to.eql(0x505);
                expect(firstToc.startPositionInFile).to.eql(0x2828);
                expect(firstToc.fileSizeInt).to.eql(0xACD0);
                expect(firstToc.index).to.eql(0);
                expect(firstToc.isCompressed).to.be.true;
            });
        });

        describe('descriptions AST parsed correctly', () => {
            it('number of files', () => {
                expect(descriptions.tocs.length).to.equal(descriptions.header.numberOfFiles);
            });

            it('first toc', () => {
                const firstToc = descriptions.tocs.find((toc) => {
                    return toc.index === 0;
                });

                expect(firstToc.id).to.eql(Buffer.from([0x86, 0x47, 0x85, 0xFD, 0xA1, 0x63, 0xDA, 0x9A]));
                expect(firstToc.startPositionInt).to.eql(0x10);
                expect(firstToc.startPositionInFile).to.eql(0x80);
                expect(firstToc.fileSizeInt).to.eql(0x24F);
                expect(firstToc.description.length).to.eql(0x2B);
                expect(firstToc.descriptionString).to.eql('COLTS_FIELD_GRASS');
                expect(firstToc.index).to.eql(0);
                expect(firstToc.isCompressed).to.be.true;
            });
        });
    });

    // describe('parses compressed data correctly', () => {
    //     it('awards AST parsed correctly', () => {
    //         expect(awards.archivedFiles.length).to.equal(awards.header.numberOfFiles);
            
    //         const firstArchivedFile = awards.archivedFiles[0];
    //         expect(firstArchivedFile.compressionMethod).to.equal('zlib');

    //         for (let i = 0; i < awards.archivedFiles.length; i++) {
    //             expect(awards.archivedFiles[i].compressionMethod).to.equal('zlib');
    //         }
    //     });

    //     it('archived files are in order based on start position', () => {
    //         awards.toc.forEach((toc, index) => {
    //             if (index > 0) {
    //                 expect(toc.startPosition).to.be.greaterThan(awards.toc[index-1].startPosition);
    //             }
    //         });
    //     });

    //     it('parses only certain files if specified', (done) => {
    //         const newParser = new ASTParser();
    //         newParser.extractByFileId(0xE8030000);

    //         newParser.on('done', function () {
    //             const file = newParser._file;

    //             expect(file.archivedFiles.length).to.equal(1);

    //             const archivedFile = file.archivedFiles[0];
    //             expect(archivedFile.archiveMetadata.id).to.eql(Buffer.from([0xE8, 0x03, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]));
    //             done();
    //         });

    //         fs.createReadStream(awardsPath)
    //             .pipe(newParser)
    //     });

    //     it('can accept buffer input and string input', (done) => {
    //         const newParser = new ASTParser();
    //         newParser.extractByFileId(Buffer.from([0xD1, 0x07, 0x00, 0x00]));
    //         newParser.extractByFileId('B90B0000');

    //         newParser.on('done', function () {
    //             const file = newParser._file;

    //             expect(file.archivedFiles.length).to.equal(2);
    //             expect(file.archivedFiles[0].archiveMetadata.id).to.eql(Buffer.from([0xD1, 0x07, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]));
    //             expect(file.archivedFiles[1].archiveMetadata.id).to.eql(Buffer.from([0xB9, 0x0B, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]));
    //             done();
    //         });

    //         fs.createReadStream(awardsPath)
    //             .pipe(newParser)
    //     });

    //     it('does not extract files if extract is set to false', (done) => {
    //         const parser = new ASTParser();
    //         parser.extract = false;

    //         parser.on('done', function () {
    //             expect(parser._file.archivedFiles.length).to.equal(0);
    //             done();
    //         });

    //         fs.createReadStream(awardsPath)
    //             .pipe(parser);
    //     });

        // it('can handle skipping over more bytes than file size if necessary', (done) => {
        //     const newParser = new ASTParser();
        //     newParser.extractByFileId('511d0000');
        //     newParser.extractByFileId('541d0000');
        //     newParser.extractByFileId('571d0000');

        //     newParser.on('done', function () {
        //         expect(newParser._file.archivedFiles.length).to.equal(3);
        //         done();
        //     });

        //     newParser.on('compressed-file', function (buf) {
        //         buf.stream
        //             .pipe(zlib.createInflate())
        //     });

        //     fs.createReadStream(portraitsPath)
        //         .pipe(newParser);
        // });
    // });
});