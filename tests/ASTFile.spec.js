const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const ASTFile = require('../filetypes/ASTFile');

const awardsPath = path.join(__dirname, 'data/awards.AST');
const cafePath = path.join(__dirname, 'data/cafe2scriptpod.AST');
const coachPortraitsPath = path.join(__dirname, 'data/coachportraits.AST');

let awardsRaw = fs.readFileSync(awardsPath);
let cafeRaw = fs.readFileSync(cafePath);
let coachPortraitsRaw = fs.readFileSync(coachPortraitsPath);

let awards, cafe, coachPortraits;

describe('AST File unit tests', () => {
    describe('parses the file header correctly', () => {
        beforeEach(() => {
            awards = new ASTFile(awardsPath, awardsRaw);
            cafe = new ASTFile(cafePath, cafeRaw);
            coachPortraits = new ASTFile(coachPortraitsPath, coachPortraitsRaw);
        });

        function assertAllEqual(key, ...checks) {
            expect(awards.header[key]).to.eql(checks[0]);
            expect(cafe.header[key]).to.eql(checks[1]);
            expect(coachPortraits.header[key]).to.eql(checks[2]);
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
            assertAllEqual('unknown1Length', 0x0, 0x1, 0x0);
        });

        it('parses id length correctly', () => {
            assertAllEqual('idLength', 0x8, 0x8, 0x8);
        });

        it('pases start position length correctly', () => {
            assertAllEqual('startPositionLength', 0x2, 0x2, 0x3);
        });

        it('parses file size length correctly', () => {
            assertAllEqual('fileSizeLength', 0x2, 0x2, 0x2);
        });

        it('parses unknown2 length correctly', () => {
            assertAllEqual('unknown2Length', 0x2, 0x2, 0x3);
        });

        it('parses TOC additional offset correctly', () => {
            assertAllEqual('tableOfContentsAdditionalOffset', 0x1, 0x2, 0x1);
        });

        it('parses TOC start correctly', () => {
            assertAllEqual('tableOfContentsStart', 0x44, 0x48, 0x44);
        });

        it('parses individual TOC length correctly', () => {
            assertAllEqual('individualTOCLength', 14, 15, 16)
        });
    });

    describe('parses table of contents list correctly', () => {
        it ('awards AST parsed correctly', () => {
            expect(awards._toc.length).to.equal(awards.header.numberOfFiles);

            expect(awards._toc[0]).to.eql({
                'unknown1': null,
                'id': Buffer.from([0x00, 0x00, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]),
                'startPosition': 0x17C70,
                'fileSize': 0x1986,
                'unknown2': Buffer.from([0xFA, 0x26])
            });

            expect(awards._toc[1]).to.eql({
                'unknown1': null,
                'id': Buffer.from([0x01, 0x00, 0x00, 0x00, 0x6A, 0x03, 0xD0, 0xBC]),
                'startPosition': 0x195F8,
                'fileSize': 0x1818,
                'unknown2': Buffer.from([0x68, 0x28])
            });
        });

        it('cafe AST parsed correctly', () => {
            expect(cafe._toc.length).to.equal(cafe.header.numberOfFiles);

            expect(cafe._toc[0]).to.eql({
                'unknown1': 0,
                'id': Buffer.from([0xFD, 0xFF, 0xC5, 0x81, 0xF9, 0x1B, 0x2B, 0x91]),
                'startPosition': 0x16B8,
                'fileSize': 0xD15,
                'unknown2': Buffer.from([0xF9, 0x26])
            });
        });

        it('coach portrait AST parsed correctly', () => {
            expect(coachPortraits._toc.length).to.equal(coachPortraits.header.numberOfFiles);

            expect(coachPortraits._toc[0]).to.eql({
                'unknown1': null,
                'id': Buffer.from([0x00, 0x00, 0x00, 0x00, 0x34, 0x3E, 0xF1, 0x69]),
                'startPosition': 0x2828,
                'fileSize': 0xACD0,
                'unknown2': Buffer.from([0xB0, 0x53, 0x03])
            });
        });
    });

    describe('parses compressed data correctly', () => {
        it('awards AST parsed correctly', () => {
            expect(awards.archivedFiles.length).to.equal(awards.header.numberOfFiles);
            
            const firstArchivedFile = awards.archivedFiles[0];
            expect(firstArchivedFile.compressionMethod).to.equal('zlib');
        });
    });
});