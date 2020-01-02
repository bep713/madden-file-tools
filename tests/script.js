const fs = require('fs');
const ASTFileOld = require('../filetypes/ASTFile_Old');
const ASTParser = require('../streams/ASTParser');
const filePath = 'D:\\Projects\\Madden 20\\ASTs\\portraits.ast';
const assert = require('assert');
const zlib = require('zlib');
const mft = require('../index');
const concat = require('concat-stream');

// const testFile = fs.readFileSync('D:\\Projects\\Madden 20\\test');
// const contents = zlib.inflateSync(testFile);
// console.log(contents);

console.time('old - first file');
console.time('old - all files');
const contents = fs.readFileSync(filePath);
const portraits = new ASTFileOld(null, contents);
mft.extractAllFromArchive(portraits)
    .then((ddsArray) => {
        const numberOfFiles = ddsArray.length;
        ddsArray.forEach((dds, index) => {
            fs.writeFileSync('D:\\Projects\\Madden 20\\test\\' + index + '.dds', dds);
            
            if (index === 0) {
                console.timeEnd('old - first file');
            }

            if (index === numberOfFiles-1) {
                console.timeEnd('old - all files');
            }
        });

        
        // console.timeEnd('old');
        console.time('new - first file');
        console.time('new - all files');
        let count = 0;
        const parser = new ASTParser();

        parser.on('done', function () {
            // console.log('done');
            // console.timeEnd('new - all files');
            // assert.deepEqual(portraits.header, parser._file.header);
        });

        parser.on('compressed-file', function (buf) {
            buf.stream
                .pipe(zlib.createInflate())
                .pipe(fs.createWriteStream('D:\\Projects\\Madden 20\\test\\' + buf.toc.id.toString('hex') + '.dds'));

            buf.stream.on('end', () => {
                count += 1;
                if (count === 1) {
                    console.timeEnd('new - first file');
                }

                if (count === numberOfFiles) {
                    console.timeEnd('new - all files');
                }
            })
        });

        fs.createReadStream(filePath)
            .pipe(parser);
    })

// const mft = require('../index');

// const portraitFile = fs.readFileSync('D:\\Projects\\Madden 20\\ASTs\\portraits.ast');
// const portraits = mft.createFile('ast', portraitFile);
// const mayfieldArchived = portraits.archivedFiles[8982];

// mft.extractArchivedFile(mayfieldArchived)
//     .then((dds) => {
//         dds.save('D:\\Projects\\Madden 20\\testMayfield.dds')
//     });

