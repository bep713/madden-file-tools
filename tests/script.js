const fs = require('fs');
const mft = require('../index');

const portraitFile = fs.readFileSync('D:\\Projects\\Madden 20\\ASTs\\portraits.ast');
const portraits = mft.createFile('ast', portraitFile);
const mayfieldArchived = portraits.archivedFiles[8982];

mft.extractArchivedFile(mayfieldArchived)
    .then((dds) => {
        dds.save('D:\\Projects\\Madden 20\\testMayfield.dds')
    });
