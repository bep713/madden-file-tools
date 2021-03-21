const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Transform, pipeline } = require('stream');
const ASTParser = require('../streams/ASTParser');
const CASLegacyParser = require('../streams/CASLegacyParser');

const startingPath = 'D:\\Origin\\Madden NFL 21\\Data\\Win32\\superbundlelayout';
const astFilePath = 'D:\\GameRips\\Madden 21\\LegacyDump3\\04_1cb0e28.ast';

let rawAstPromises = [];
let done = false;

const astPath = 'D:\\Media\\Games\\NFL Head Coach 09 [U] [BLUS-30128]\\PS3_GAME\\USRDIR\\qkl_fe2ig.ast';
// const astPath = 'D:\\GameRips\\HC09\\fe2ig\\7 - 622f470.ast';
const destinationFolder = 'D:\\GameRips\\HC09\\fe2ig';

try {
    extractFilesFromHC09Recursive(astPath, destinationFolder);
}
catch (err) {
    console.error(err);
}

checkDone();

function checkDone() {
    if (!done) {
        setTimeout(checkDone, 100);
    }
}

// async function replacePortrait() {
//     const astParser = new ASTParser();

//     astParser.on('compressed-file', (astData) => {

//     });

//     done = true;
// }

// async function extractFilesFromHC09Recursive(astPath, destinationFolder) {
//     const astParser = new ASTParser();

//     astParser.on('compressed-file', (astData) => {
//         rawAstPromises.push(new Promise((resolve, reject) => {
//             let fileExtension = 'unknown';
//             const fileName = `${astData.toc.index} - ${astData.toc.startPositionInFile.toString(16)}`;
//             const newFilePath = path.join(destinationFolder, fileName);
            
//             const writeStream = fs.createWriteStream(newFilePath);
            
//             writeStream.on('close', () => {
//                 fs.renameSync(newFilePath, newFilePath + '.' + fileExtension);
//             });
            
//             const fileExtensionPicker = new Transform({
//                 transform(chunk, enc, cb) {
//                     if (fileExtension === 'unknown') {
//                         if (chunk[0] === 0x44 && chunk[1] === 0x44 && chunk[2] === 0x53) {
//                             fileExtension = 'dds';
//                         }
//                         else if (chunk[0] === 0x44 && chunk[1] === 0x42) {
//                             fileExtension = 'db';
//                         }
//                         else if (chunk[0] === 0x78 && chunk[1] === 0x9C) {
//                             fileExtension = 'ftc';
//                         }
//                         else if (chunk[0] === 0x46 && chunk[1] === 0x72 && chunk[2] === 0x54 && chunk[3] === 0x6B) {
//                             fileExtension = 'frt';
//                         }
//                         else if (chunk[0] === 0x42 && chunk[1] === 0x47 && chunk[2] === 0x46 && chunk[3] === 0x41 && chunk[4] === 0x31) {
//                             fileExtension = 'ast';
//                         }
//                         else if (chunk[0] === 0x1A && chunk[1] === 0x45 && chunk[2] === 0xDF && chunk[3] === 0xA3) {
//                             fileExtension = 'webm';
//                         }
//                         else if (chunk[0] === 0x3C || (chunk[0] === 0xEF && chunk[1] === 0xBB && chunk[2] === 0xBF && chunk[3] === 0x3C)) {
//                             fileExtension = 'xml';
//                         }
//                         else if (chunk[0] === 0x70 && chunk[1] === 0x33 && chunk[2] === 0x52) {
//                             fileExtension = 'p3r';
//                         }
//                         else if (chunk[0] === 0x41 && chunk[1] === 0x70 && chunk[2] === 0x74) {
//                             fileExtension = 'apt';
//                         }
//                         else if (chunk[0] === 0x52 && chunk[1] === 0x53 && chunk[2] === 0x46) {
//                             fileExtension = 'rsf';
//                         }
//                         else if (chunk[0] === 0x45 && chunk[1] === 0x42 && chunk[2] === 0x4F) {
//                             fileExtension = 'ebo';
//                         }
//                         else {
//                             fileExtension = 'unknown';
//                         }
//                     }
        
//                     this.push(chunk);
//                     cb();
//                 }
//             });

//             const isNotCompressed = astData.toc.uncompressedSizeInt === 0;
//             let pipes = [];

//             if (isNotCompressed) {
//                 pipes = [
//                     astData.stream,
//                     fileExtensionPicker,
//                     writeStream
//                 ];
//             }
//             else {
//                 pipes = [
//                     astData.stream,
//                     zlib.createInflate(),
//                     fileExtensionPicker,
//                     writeStream
//                 ];
//             }

//             pipeline(
//                 ...pipes,
//                 (err) => {
//                     if (err) { resolve(); }

//                     if (fileExtension === 'ast') {
//                         resolve(new Promise((resolve, reject) => {
//                             writeStream.on('close', () => {
//                                 const newDirPath = path.join(destinationFolder, fileName);
//                                 fs.mkdir(newDirPath, (err) => {
//                                     if (err) {
//                                         reject(err);
//                                     }
//                                     else {
//                                         resolve(extractFilesFromHC09Recursive(newFilePath + '.' + fileExtension, newDirPath));
//                                     }
//                                 })
//                             });
//                         }));
//                     }
//                     else {
//                         resolve();
//                     }
//                 }
//             );
//         }));
//     });

//     await new Promise((resolve, reject) => {
//         pipeline(
//             fs.createReadStream(astPath),
//             astParser,
//             (err) => {
//                 if (err) { console.log(err); }
//                 Promise.all(rawAstPromises)
//                     .then((data) => {
//                         console.log('all done');
//                         resolve();
//                     })
//                     .catch((err) => {
//                         console.error(err);
//                     })
//             }   
//         );
//     });

//     done = true;
};

// async function extractAST() {
//     const astBasePath = astFilePath.substring(0, astFilePath.lastIndexOf('\\'));
//     const astIndex = astFilePath.substring(astFilePath.lastIndexOf('\\'), astFilePath.indexOf('.'));
//     const newDir = path.join(astBasePath, astIndex);

//     astParser.on('compressed-file', (astData) => {
//         rawAstPromises.push(new Promise((resolve, reject) => {
//             pipeline(
//                 astData.stream,
//                 zlib.createInflate(),
//                 // fs.createWriteStream(path.join(newDir, astData.toc.index + '.dds')),
//                 (err) => {
//                     if (err) { resolve(); }
//                     resolve();
//                 }
//             );
//         }));
//     });
    
//     await fs.promises.mkdir(newDir)

//     await new Promise((resolve, reject) => {
//         pipeline(
//             fs.createReadStream(astFilePath),
//             astParser,
//             (err) => {
//                 if (err) { console.log(err); }
//                 Promise.all(rawAstPromises)
//                     .then((data) => {
//                         console.log('all done');
//                         resolve();
//                     });
//             }   
//         );
//     });

//     done = true;
// };

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

