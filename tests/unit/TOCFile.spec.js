const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;

const tocPath = path.join(__dirname, '../data/layout.toc');
const tocRaw = fs.readFileSync(tocPath);

const TOCFile = require('../../filetypes/TOCFile');

describe('TOCFile unit tests', () => {
    let toc;

    beforeEach(() => {
        toc = new TOCFile(null, tocRaw);
    });

    describe('parses header correctly', () => {
        it('file type', () => {
            expect(toc.header.fileType).to.eql('NOT_ENCRYPTED_AND_HAS_SIGNATURE');
        });

        it('data start', () => {
            expect(toc.header.dataStart).to.eql(556);
        });
    });

    describe('parses file correctly', () => {
        it('parses entry metadata correctly', () => {
            expect(toc.entryMetadata[0]).to.eql({
                'type': 'normal',
                'size': 
            })
        });

        it('parses entries correctly', () => {
            expect(toc.superBundles).to.not.be.undefined;
        });
    });
});