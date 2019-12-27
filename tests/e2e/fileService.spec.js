const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;

const mft = require('../../index');

const portraitFile = fs.readFileSync('D:\\Projects\\Madden 20\\ASTs\\portraits.ast');

describe('file service e2e tests', () => {
    it('parse portrait file', (done) => {
        const portraits = mft.createFile('ast', portraitFile);
        const odellArchived = portraits.archivedFiles.find((file) => {
            return file.archiveMetadata.id.indexOf('D43F0000A5A59ABD', 'hex') > -1;
        });

        mft.extractArchivedFile(odellArchived)
            .then((dds) => {
                dds.save(path.join(__dirname, '../data/save-test/odell.dds'));

                const expected = fs.readFileSync(path.join(__dirname, '../data/odell.DDS'));
                expect(dds.rawContents).to.eql(expected);
                done();
            });
    });
});