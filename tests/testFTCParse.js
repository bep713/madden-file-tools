const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const CASLegacyParser = require('../streams/CASLegacyParser');
const LegacyCompressedFileReader = require('../streams/LegacyCompressedFileReader');
// const casPath = 'D:\\Origin\\Madden NFL 21\\Data\\Win32\\superbundlelayout\\madden_installpackage_00\\cas_03.cas';
// const casPath = path.join(__dirname, './data/CASLegacyParser/testFTC2.cas');
const casPath = 'D:\\GameRips\\Madden 21\\LegacyDump3\\FTCs\\lz4ExtractMe.cas';

fs.createReadStream(casPath)
    .pipe(new LegacyCompressedFileReader())
    .pipe(fs.createWriteStream('D:\\GameRips\\Madden 21\\LegacyDump3\\FTCs\\lz4Extracted.cas'))

// const casParser = new CASLegacyParser();

// casParser.on('compressed-data', (data) => {
//     var dataEnded = true;

//     if (data.startIndex === 314118943) {
//         data.stream
//             .pipe(new Transform({
//                 transform(chunk, enc, cb) {
//                     if (dataEnded) {
//                         if (chunk.readUInt32BE(0) === 0x106B8151) {
//                             dataEnded = false;
//                         }
//                     }

//                     if (!dataEnded) {
//                         this.push(chunk);
//                     }

//                     cb();
//                 }
//             }))
//             // .pipe(new LegacyCompressedFileReader())
//             .pipe(fs.createWriteStream(path.join(__dirname, './data/CASLegacyParser/testFTC2.cas')))
//     }
// });

// fs.createReadStream(casPath)
//     .pipe(casParser);