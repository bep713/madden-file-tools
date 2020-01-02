const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream');
const expect = require('chai').expect;
const ASTParser = require('../../streams/ASTParser');

const awardsPath = path.join(__dirname, '../data/awards.AST');
const cafePath = path.join(__dirname, '../data/cafe2scriptpod.AST');
const coachPortraitsPath = path.join(__dirname, '../data/coachportraits.AST');
const portraitsPath = path.join(__dirname, '../data/portraits.AST');

let awards, cafe, coachPortraits;
let awardsParser, cafeParser, coachPortraitsParser;

describe('AST File unit tests', () => {
    before(function (done) {
        awardsParser = new ASTParser();
        cafeParser = new ASTParser();
        coachPortraitsParser = new ASTParser();

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
            parseFile(coachPortraitsPath, coachPortraitsParser)
        ];

        Promise.all(promises)
            .then((results) => {
                awards = results[0];
                cafe = results[1];
                coachPortraits = results[2];

                done();
            });
    });
    
    describe('parses the file header correctly', () => {
        function assertAllEqual(key, ...checks) {
            expect(byString(awards.header, key)).to.eql(checks[0]);
            expect(byString(cafe.header, key)).to.eql(checks[1]);
            expect(byString(coachPortraits.header, key)).to.eql(checks[2]);
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
            assertAllEqual('fileSignature', astSignature, astSignature, astSignature);
        });

        it('parses number of blocks correctly', () => {
            assertAllEqual('numberOfBlocks', 0x11, 0x3, 0x82);
        });

        it('parses number of files correctly', () => {
            assertAllEqual('numberOfFiles', 0x10, 0x2, 0x81);
        });

        it('parses TOC offset correctly', () => {
            assertAllEqual('tableOfContentsOffset', 0x40, 0x40, 0x40);
        });

        it('parses TOC length correctly', () => {
            assertAllEqual('tableOfContentsLength', 0xF4, 0x28, 0x895);
        });

        it('parses unknown1 length correctly', () => {
            assertAllEqual('toc.unknown1.length', 0x0, 0x1, 0x0);
        });

        it('parses id length correctly', () => {
            assertAllEqual('toc.id.length', 0x8, 0x8, 0x8);
        });

        it('pases start position length correctly', () => {
            assertAllEqual('toc.startPosition.length', 0x2, 0x2, 0x3);
        });

        it('parses file size length correctly', () => {
            assertAllEqual('toc.fileSize.length', 0x2, 0x2, 0x2);
        });

        it('parses unknown2 length correctly', () => {
            assertAllEqual('toc.unknown2.length', 0x2, 0x2, 0x3);
        });

        it('parses TOC additional offset correctly', () => {
            assertAllEqual('tableOfContentsAdditionalOffset', 0x5, 0x9, 0x5);
        });

        it('parses TOC start correctly', () => {
            assertAllEqual('tableOfContentsStart', 0x45, 0x49, 0x45);
        });

        it('parses individual TOC length correctly', () => {
            assertAllEqual('individualTOCLength', 14, 15, 16)
        });
    });

    describe('parses table of contents list correctly', () => {
        it ('awards AST parsed correctly', () => {
            expect(awards.toc.length).to.equal(awards.header.numberOfFiles);

            const firstToc = awards.toc.find((toc) => {
                return toc.index === 0;
            });

            const secondToc = awards.toc.find((toc) => {
                return toc.index === 1;
            });

            const emptyTocs = awards.toc.filter((toc) => {
                return !toc || toc === {};
            });

            expect(firstToc).to.eql({
                'unknown1': null,
                'id': Buffer.from([0x00, 0x00, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]),
                'startPosition': 0x17C70,
                'fileSize': 0x1986,
                'unknown2': Buffer.from([0xFA, 0x26]),
                'index': 0
            });

            expect(secondToc).to.eql({
                'unknown1': null,
                'id': Buffer.from([0x01, 0x00, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]),
                'startPosition': 0x195F8,
                'fileSize': 0x1818,
                'unknown2': Buffer.from([0x68, 0x28]),
                'index': 1
            });

            expect(emptyTocs.length).to.equal(0);
        });

        it('cafe AST parsed correctly', (done) => {
            expect(cafe.toc.length).to.equal(cafe.header.numberOfFiles);

            const firstToc = cafe.toc.find((toc) => {
                return toc.index === 0;
            });

            expect(firstToc).to.eql({
                'unknown1': Buffer.from([0x0]),
                'id': Buffer.from([0xFD, 0xFF, 0xC5, 0x81, 0xF9, 0x1B, 0x2B, 0x91]),
                'startPosition': 0x16B8,
                'fileSize': 0xD15,
                'unknown2': Buffer.from([0xF9, 0x26]),
                'index': 0
            });

            done();
        });

        it('coach portrait AST parsed correctly', () => {
            expect(coachPortraits.toc.length).to.equal(coachPortraits.header.numberOfFiles);

            const firstToc = coachPortraits.toc.find((toc) => {
                return toc.index === 0;
            });

            expect(firstToc).to.eql({
                'unknown1': null,
                'id': Buffer.from([0x00, 0x00, 0x00, 0x00, 0x34, 0x3E, 0xF1, 0x69]),
                'startPosition': 0x2828,
                'fileSize': 0xACD0,
                'unknown2': Buffer.from([0xB0, 0x53, 0x03]),
                'index': 0
            });
        });
    });

    describe('parses compressed data correctly', () => {
        it('awards AST parsed correctly', () => {
            expect(awards.archivedFiles.length).to.equal(awards.header.numberOfFiles);
            
            const firstArchivedFile = awards.archivedFiles[0];
            expect(firstArchivedFile.compressionMethod).to.equal('zlib');

            for (let i = 0; i < awards.archivedFiles.length; i++) {
                expect(awards.archivedFiles[i].compressionMethod).to.equal('zlib');
            }
        });

        it('archived files are in order based on start position', () => {
            awards.toc.forEach((toc, index) => {
                if (index > 0) {
                    expect(toc.startPosition).to.be.greaterThan(awards.toc[index-1].startPosition);
                }
            });
        });

        it('parses only certain files if specified', (done) => {
            const newParser = new ASTParser();
            newParser.extractByFileId(0xE8030000);

            newParser.on('done', function () {
                const file = newParser._file;

                expect(file.archivedFiles.length).to.equal(1);

                const archivedFile = file.archivedFiles[0];
                expect(archivedFile.archiveMetadata.id).to.eql(Buffer.from([0xE8, 0x03, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]));
                done();
            });

            fs.createReadStream(awardsPath)
                .pipe(newParser)
        });

        it('can accept buffer input and string input', (done) => {
            const newParser = new ASTParser();
            newParser.extractByFileId(Buffer.from([0xD1, 0x07, 0x00, 0x00]));
            newParser.extractByFileId('B90B0000');

            newParser.on('done', function () {
                const file = newParser._file;

                expect(file.archivedFiles.length).to.equal(2);
                expect(file.archivedFiles[0].archiveMetadata.id).to.eql(Buffer.from([0xD1, 0x07, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]));
                expect(file.archivedFiles[1].archiveMetadata.id).to.eql(Buffer.from([0xB9, 0x0B, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]));
                done();
            });

            fs.createReadStream(awardsPath)
                .pipe(newParser)
        });

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
    });
});