const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Transform, pipeline } = require('stream');
const ASTParser = require('../streams/ASTParser');
const CASLegacyParser = require('../streams/CASLegacyParser');

const startingPath = 'D:\\Origin\\Madden NFL 21\\Data\\Win32\\superbundlelayout';
const astFilePath = 'D:\\GameRips\\Madden 21\\LegacyDump3\\04_30084648.ast';

const astParser = new ASTParser();
let rawAstPromises = [];
let done = false;

extractAST();
checkDone();

function checkDone() {
    if (!done) {
        setTimeout(checkDone, 100);
    }
}

async function extractAST() {
    const astBasePath = astFilePath.substring(0, astFilePath.lastIndexOf('\\'));
    const astIndex = astFilePath.substring(astFilePath.lastIndexOf('\\'), astFilePath.indexOf('.'));
    const newDir = path.join(astBasePath, astIndex);

    astParser.on('compressed-file', (astData) => {
        rawAstPromises.push(new Promise((resolve, reject) => {
            pipeline(
                astData.stream,
                zlib.createInflate(),
                fs.createWriteStream(path.join(newDir, astData.toc.index + '.dds')),
                (err) => {
                    if (err) { resolve(); }
                    resolve();
                }
            );
        }));
    });
    
    await fs.promises.mkdir(newDir)

    await new Promise((resolve, reject) => {
        pipeline(
            fs.createReadStream(astFilePath),
            astParser,
            (err) => {
                if (err) { console.log(err); }
                Promise.all(rawAstPromises)
                    .then((data) => {
                        console.log('all done');
                        resolve();
                    });
            }   
        );
    });

    done = true;
};

// fs.promises.readdir(startingPath)
//     .then((dirs) => {
//         const readSbDirFilesPromise = dirs.map((dir) => {
//             return new Promise((resolve, reject) => {
//                 resolve(fs.promises.readdir(path.join(startingPath, dir)));
//             });
//         })

//         Promise.all(readSbDirFilesPromise)
//             .then((sbFileArrays) => {
//                 const readSBCasPromise = sbFileArrays.map((sbFileArray, index) => {
//                     return new Promise((resolve, reject) => {
//                         resolve(sbFileArray.map((file) => {
//                             return new Promise((resolve, reject) => {
//                                 const filePath = path.join(dirs[index], file);
//                                 const readStream = fs.createReadStream(filePath);
//                                 const parser = new CASLegacyParser();
    
//                                 parser.on('compressed-data', (data) => {
//                                     if (data.compressionType === 0) {
//                                         const astParser = new ASTParser();

//                                         astParser.on('compressed-file', (astData) => {
//                                             // astData.stream
//                                             //     .pipe(zlib.)
//                                         });

//                                         data.stream
//                                             .pipe(astParser)
//                                     }
//                                 });
    
//                                 readStream
//                                     .pipe(parser);
//                             });
//                         }));
//                     });
//                 });

//                 Promise.all(readSBCasPromise)
//                     .then((sbCasFiles) => {
//                         console.log(sbCasFiles);
//                     })
//             })
//     });




// const TOCParser = require('../streams/TOCParser');

// let parser = new TOCParser();

// const stream = fs.createReadStream('D:\\Projects\\Madden 20\\ebx\\Animation\\Football.xml')

// stream
//     .pipe(zlib.createGzip())
//     .pipe(fs.createWriteStream('Football.gz'));

// stream.on('end', () => {
    // console.log('here');
// });

// stream
    // .pipe(parser);


// const ASTFileOld = require('../filetypes/ASTFile_Old');
// const ASTParser = require('../streams/ASTParser');
// const filePath = 'D:\\Projects\\Madden 20\\ASTs\\portraits.ast';
// const assert = require('assert');
// const zlib = require('zlib');
// const mft = require('../index');
// const concat = require('concat-stream');

// // const testFile = fs.readFileSync('D:\\Projects\\Madden 20\\test');
// // const contents = zlib.inflateSync(testFile);
// // console.log(contents);

// console.time('old - first file');
// console.time('old - all files');
// const contents = fs.readFileSync(filePath);
// const portraits = new ASTFileOld(null, contents);
// mft.extractAllFromArchive(portraits)
//     .then((ddsArray) => {
//         const numberOfFiles = ddsArray.length;
//         ddsArray.forEach((dds, index) => {
//             fs.writeFileSync('D:\\Projects\\Madden 20\\test\\' + index + '.dds', dds);
            
//             if (index === 0) {
//                 console.timeEnd('old - first file');
//             }

//             if (index === numberOfFiles-1) {
//                 console.timeEnd('old - all files');
//             }
//         });

        
//         // console.timeEnd('old');
//         console.time('new - first file');
//         console.time('new - all files');
//         let count = 0;
//         const parser = new ASTParser();

//         parser.on('done', function () {
//             // console.log('done');
//             // console.timeEnd('new - all files');
//             // assert.deepEqual(portraits.header, parser._file.header);
//         });

//         parser.on('compressed-file', function (buf) {
//             buf.stream
//                 .pipe(zlib.createInflate())
//                 .pipe(fs.createWriteStream('D:\\Projects\\Madden 20\\test\\' + buf.toc.id.toString('hex') + '.dds'));

//             buf.stream.on('end', () => {
//                 count += 1;
//                 if (count === 1) {
//                     console.timeEnd('new - first file');
//                 }

//                 if (count === numberOfFiles) {
//                     console.timeEnd('new - all files');
//                 }
//             })
//         });

//         fs.createReadStream(filePath)
//             .pipe(parser);
//     })

// // const mft = require('../index');

// // const portraitFile = fs.readFileSync('D:\\Projects\\Madden 20\\ASTs\\portraits.ast');
// // const portraits = mft.createFile('ast', portraitFile);
// // const mayfieldArchived = portraits.archivedFiles[8982];

// // mft.extractArchivedFile(mayfieldArchived)
// //     .then((dds) => {
// //         dds.save('D:\\Projects\\Madden 20\\testMayfield.dds')
// //     });

