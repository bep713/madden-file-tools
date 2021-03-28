const fs = require('fs');
const path = require('path');

// const NCAAB10Helper = require('../helpers/NCAAB10Helper');
const ncaaPath = 'D:\\Projects\\NCAAB 10\\eng_us - Copy.db';

const TDBHelper = require('../helpers/TDBHelper');
// const tdbFilePath = path.join(__dirname, './data/streameddata.db');
let done = false;

changeNCAAConferences(ncaaPath)
    .then(() => {
        done = true;
    });

checkDone();

function checkDone() {
    if (!done) {
        setTimeout(checkDone, 100);
    }
}

async function changeNCAAConferences(path) {
    const helper = new TDBHelper(path);
    helper.load(path)
        .then(() => {
            helper.file.vCJG.readRecords()
                .then(() => {
                    const pac10 = helper.file.vCJG.records.find((record) => {
                        return record.fields['ZbYb'].value === 'PAC-10';
                    });

                    pac10.fields['ZbYb'].value = 'PAC-12';

                    helper.save()
                        .then(() => {
                            return true;
                        })
                });
        })
};

// async function parseTDB(path) {
//     const helper = new TDBHelper();
//     helper.load(path)
//         .then(() => {
//             helper.file.LCSS.readRecords()
//                 .then(() => {
//                     console.log(helper.file.LCSS.records[0].LCST);
//                 })
//         });
// };