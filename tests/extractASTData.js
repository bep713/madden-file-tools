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
// const astPath = 'D:\\Media\\Games\\NCAA.Football.14.PS3-PROTON\\BLUS31159-[NCAA Football 14]\\PS3_GAME\\USRDIR\\qkl_boot.ast';
// const astPath = 'D:\\GameRips\\HC09\\fe2ig\\7 - 622f470.ast';
const destinationFolder = 'D:\\GameRips\\NCAA 14\\boot';

try {
    extractFilesFromHC09Recursive(astPath, destinationFolder)
        .then(() => {
            done = true;
        })
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

async function extractFilesFromHC09Recursive(astPath, destinationFolder) {
    const astParser = new ASTParser();

    // astParser.on('compressed-file', (astData) => {
    //     rawAstPromises.push(new Promise((resolve, reject) => {
    //         let fileExtension = 'unknown';
    //         const fileName = `${astData.toc.index} - ${astData.toc.startPositionInFile.toString(16)}`;
    //         const newFilePath = path.join(destinationFolder, fileName);
            
    //         const writeStream = fs.createWriteStream(newFilePath);
            
    //         writeStream.on('close', () => {
    //             fs.renameSync(newFilePath, newFilePath + '.' + fileExtension);
    //         });
            
    //         const fileExtensionPicker = new Transform({
    //             transform(chunk, enc, cb) {
    //                 if (fileExtension === 'unknown') {
    //                     if (chunk[0] === 0x44 && chunk[1] === 0x44 && chunk[2] === 0x53) {
    //                         fileExtension = 'dds';
    //                     }
    //                     else if (chunk[0] === 0x44 && chunk[1] === 0x42) {
    //                         fileExtension = 'db';
    //                     }
    //                     else if (chunk[0] === 0x78 && chunk[1] === 0x9C) {
    //                         fileExtension = 'ftc';
    //                     }
    //                     else if (chunk[0] === 0x46 && chunk[1] === 0x72 && chunk[2] === 0x54 && chunk[3] === 0x6B) {
    //                         fileExtension = 'frt';
    //                     }
    //                     else if (chunk[0] === 0x42 && chunk[1] === 0x47 && chunk[2] === 0x46 && chunk[3] === 0x41 && chunk[4] === 0x31) {
    //                         fileExtension = 'ast';
    //                     }
    //                     else if (chunk[0] === 0x1A && chunk[1] === 0x45 && chunk[2] === 0xDF && chunk[3] === 0xA3) {
    //                         fileExtension = 'webm';
    //                     }
    //                     else if (chunk[0] === 0x3C || (chunk[0] === 0xEF && chunk[1] === 0xBB && chunk[2] === 0xBF && chunk[3] === 0x3C)) {
    //                         fileExtension = 'xml';
    //                     }
    //                     else if (chunk[0] === 0x70 && chunk[1] === 0x33 && chunk[2] === 0x52) {
    //                         fileExtension = 'p3r';
    //                     }
    //                     else if (chunk[0] === 0x41 && chunk[1] === 0x70 && chunk[2] === 0x74) {
    //                         fileExtension = 'apt';
    //                     }
    //                     else if (chunk[0] === 0x52 && chunk[1] === 0x53 && chunk[2] === 0x46) {
    //                         fileExtension = 'rsf';
    //                     }
    //                     else if (chunk[0] === 0x45 && chunk[1] === 0x42 && chunk[2] === 0x4F) {
    //                         fileExtension = 'ebo';
    //                     }
    //                     else if (chunk[0] === 0x53 && chunk[1] === 0x43 && chunk[2] === 0x48 && chunk[3] === 0x6C) {
    //                         fileExtension = 'schl';
    //                     }
    //                     else if (chunk[0] === 0x89 && chunk[1] === 0x50 && chunk[2] === 0x4E && chunk[3] === 0x47) {
    //                         fileExtension = 'png';
    //                     }
    //                     else {
    //                         fileExtension = 'unknown';
    //                     }
    //                 }
        
    //                 this.push(chunk);
    //                 cb();
    //             }
    //         });

    //         const isNotCompressed = astData.toc.uncompressedSize.length === 0 || astData.toc.uncompressedSizeInt === 0;
    //         let pipes = [];

    //         if (isNotCompressed) {
    //             pipes = [
    //                 astData.stream,
    //                 fileExtensionPicker,
    //                 writeStream
    //             ];
    //         }
    //         else {
    //             pipes = [
    //                 astData.stream,
    //                 zlib.createInflate(),
    //                 fileExtensionPicker,
    //                 writeStream
    //             ];
    //         }

    //         pipeline(
    //             ...pipes,
    //             (err) => {
    //                 if (err) { 
    //                     console.error(err);
    //                     resolve(); 
    //                 }

    //                 if (fileExtension === 'ast') {
    //                     resolve(new Promise((resolve, reject) => {
    //                         writeStream.on('close', () => {
    //                             const newDirPath = path.join(destinationFolder, fileName);
    //                             fs.mkdir(newDirPath, (err) => {
    //                                 if (err) {
    //                                     reject(err);
    //                                 }
    //                                 else {
    //                                     resolve(extractFilesFromHC09Recursive(newFilePath + '.' + fileExtension, newDirPath));
    //                                 }
    //                             })
    //                         });
    //                     }));
    //                 }
    //                 else {
    //                     resolve();
    //                 }
    //             }
    //         );
    //     }));
    // });

    await new Promise((resolve, reject) => {
        pipeline(
            fs.createReadStream(astPath),
            astParser,
            (err) => {
                if (err) { console.log(err); }
                // Promise.all(rawAstPromises)
                //     .then((data) => {
                //         console.log('all done');
                //         resolve();
                //     })
                //     .catch((err) => {
                //         console.error(err);
                //         reject(err);
                //     })

                resolve();
            }   
        );
    });
};
