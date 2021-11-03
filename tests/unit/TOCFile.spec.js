const fs = require('fs');
const path = require('path');
// const debug = require('debug')('mft');
const concat = require('concat-stream');
const expect = require('chai').expect;

const tocPath = path.join(__dirname, '../data/layout.toc');
const fsPath = path.join(__dirname, '../data/initfs_Win32');
const decryptedFsPath = path.join(__dirname, '../data/decrypted_initfs_data');

const TOCParser = require('../../streams/TOCParser');

let layoutParser, fsParser, decryptedFsParser;

describe('TOCFile unit tests', () => {
    before((done) => {
        layoutParser = new TOCParser();
        fsParser = new TOCParser();
        decryptedFsParser = new TOCParser();

        const stream = fs.createReadStream(tocPath);
        const stream2 = fs.createReadStream(fsPath);
        const stream3 = fs.createReadStream(decryptedFsPath);

        stream.on('end', () => {
            stream2
                .pipe(fsParser);
        });

        stream2.on('end', () => {
            stream3
                .pipe(decryptedFsParser);
        });

        stream3.on('end', () => {
            done();
        });

        stream
            .pipe(layoutParser);

    });

    describe('parses header correctly', () => {
        it('file type', () => {
            expect(layoutParser._file.header.fileType).to.eql('NOT_ENCRYPTED_AND_HAS_SIGNATURE');
        });

        it('data start', () => {
            expect(layoutParser._file.header.dataStart).to.eql(556);
        });
    });

    describe('parses file correctly', () => {
        it('parses entries correctly', () => {
            expect(layoutParser._file._entries[0]).to.not.be.undefined;
        });

        it('parses list correctly', () => {
            expect(layoutParser._file._entries[0].startIndex).to.eql(0x22F);
            expect(layoutParser._file._entries[0]._fields[0].name).to.not.be.undefined;
            expect(layoutParser._file._entries[0]._fields[0].startIndex).to.equal(0x23F);
            expect(layoutParser._file._entries[0]._fields[0].endIndex).to.equal(0xC14);

            expect(layoutParser._file._entries[0]._fields[0].name).to.equal('superBundles');
            expect(layoutParser._file._entries[0]._fields[0].value).to.be.an('array');
        });

        it('parses first field - subitem 1 - subsubitem 1', () => {
            expect(layoutParser._file._entries[0]._fields[0].value[0]).to.not.be.undefined;
            expect(layoutParser._file._entries[0]._fields[0].value[0]._fields.length).to.equal(1);
            expect(layoutParser._file._entries[0]._fields[0].value[0]._fields[0].startIndex).to.equal(0x241);
            expect(layoutParser._file._entries[0]._fields[0].value[0]._fields[0].name).to.equal('name');
            expect(layoutParser._file._entries[0]._fields[0].value[0]._fields[0].value).to.equal('Win32/_debug_/globals');
        });

        it('parses first field - subitem 2', () => {
            expect(layoutParser._file._entries[0]._fields[0].value[1]).to.not.be.undefined;
            expect(layoutParser._file._entries[0]._fields[0].value[1]._fields[0].startIndex).to.equal(0x261);

            expect(layoutParser._file._entries[0]._fields[0].value[1]._fields[0].name).to.equal('name');
            expect(layoutParser._file._entries[0]._fields[0].value[1]._fields[0].value).to.equal('Win32/coachcontent_sb');

            expect(layoutParser._file._entries[0]._fields[0].value[1]._fields[1].name).to.equal('tocPath');
            expect(layoutParser._file._entries[0]._fields[0].value[1]._fields[1].value).to.equal('/native_data/Data/Win32/coachcontent_sb.toc');
        });

        it('parses second field (list)', () => {
            expect(layoutParser._file._entries[0]._fields[1].name).to.equal('fs');
            expect(layoutParser._file._entries[0]._fields[1].value).to.be.an('array');
        });

        it('parses second field - subitem 1', () => {
            expect(layoutParser._file._entries[0]._fields[1].value[0]._type87Data).to.eql(
                Buffer.from([0x69, 0x6E, 0x69, 0x74, 0x66, 0x73, 0x5F, 0x57, 0x69, 0x6E, 0x33, 0x32, 0x00])
            );
        });

        it('parses unsinged int (third field)', () => {
            expect(layoutParser._file._entries[0]._fields[2].name).to.equal('head');
            expect(layoutParser._file._entries[0]._fields[2].value).to.equal(594493);
        });

        it('parses x02 entity type', () => {
            expect(layoutParser._file._entries[0]._fields[3].name).to.equal('installManifest');
            expect(layoutParser._file._entries[0]._fields[3].value._fields[0].name).to.equal('installChunks');
            expect(layoutParser._file._entries[0]._fields[3].value._fields[0].value).to.be.an('array');
            expect(layoutParser._file._entries[0]._fields[3].value._fields[0].value[0]._fields[0].name).to.equal('id');
            expect(layoutParser._file._entries[0]._fields[3].value._fields[0].value[0]._fields[0].value).to.eql(
                Buffer.from([0x00, 0xD9, 0xAE, 0x6D, 0x8A, 0xCF, 0x97, 0x3E, 0xC3, 0x6F, 0x52, 0xBF, 0x2B, 0xF9, 0x1C, 0xEF,])
            );

            expect(layoutParser._file._entries[0]._fields[3].value._fields[0].value[0]._fields[1].name).to.eql('name');
            expect(layoutParser._file._entries[0]._fields[3].value._fields[0].value[0]._fields[1].value).to.eql('superbundlelayout/madden_installpackage_lcu');
        });

        it('parses boolean field with true value', () => {
            const alwaysInstalled = layoutParser._file._entries[0]._fields[3].value._fields[0].value[0]._fields[3];
            expect(alwaysInstalled.name).to.eql('alwaysInstalled');
            expect(alwaysInstalled.value).to.be.true;
        });

        it('parses boolean field with false value', () => {
            const alwaysInstalled = layoutParser._file._entries[0]._fields[3].value._fields[0].value[0]._fields[4];
            expect(alwaysInstalled.name).to.eql('mandatoryDLC');
            expect(alwaysInstalled.value).to.be.false;
        });

        it('parses long', () => {
            const estimatedSize =  layoutParser._file._entries[0]._fields[3].value._fields[0].value[0]._fields[8];
            expect(estimatedSize.name).to.eql('estimatedSize');
            expect(estimatedSize.value).to.eql(1890064n);
        });

        it('parses 0x8F entity type', () => {
            const requiredChunks = layoutParser._file._entries[0]._fields[3].value._fields[0].value[2]._fields[10];

            expect(requiredChunks.name).to.eql('requiredChunks');
            expect(requiredChunks.value[0]._type8FData).to.eql(
                Buffer.from([0x80, 0xA6, 0x9B, 0xC0, 0x5F, 0x5B, 0xD2, 0x70, 0x76, 0x06, 0x5A, 0xCD, 0x0A, 0x5F, 0x2C, 0xC5,])
            );
        });

        it('current buffer index keeps up', () => {
            expect(layoutParser._currentBufferIndex).to.eql(0x2FE0);
        });

        it('can access fields with normal `.` operator', () => {
            const superBundles = layoutParser._file.root.superBundles;
            expect(superBundles.length).to.equal(30)
            expect(superBundles[0].name).to.eql('Win32/_debug_/globals');
            expect(superBundles[29].name).to.eql('Win32/worldssb');

            const installChunks = layoutParser._file.root.installManifest.installChunks;
            expect(installChunks.length).to.equal(11);
        });

        it('parses SHA1 fields', (done) => {
            const chunks0Path = path.join(__dirname, '../data/chunks0.toc');

            const parser = new TOCParser();
            const stream = fs.createReadStream(chunks0Path);
            
            stream.on('end', () => {
                const id = parser._file._entries[0]._fields[1].value[0].fields[1];
                expect(id.name).to.eql('sha1');
                expect(id.value).to.eql(
                    Buffer.from([0x3B, 0xC0, 0x63, 0xAA, 0xC9, 0x02, 0xF8, 0x24, 0xE3, 0xF3, 
                        0x93, 0x49, 0xEF, 0x1A, 0x1F, 0xEB, 0x03, 0xAE, 0xC5, 0xD3,])
                );
                
                done();
            });

            stream
                .pipe(parser);
        });

        it('parses blob fields', () => {
            expect(fsParser._file.root.encrypted).to.not.be.undefined;
        });

        it('parses lists as the root element', () => {
            expect(decryptedFsParser._file._entries[0]._entries.length).to.equal(264);
            expect(decryptedFsParser._file.root._entries[0]['$file'].name).to.equal('SharedTypeDescriptors.ebx');
            expect(decryptedFsParser._file.root._entries[0]['$file'].payload.length).to.equal(474024);
        });
    });
});