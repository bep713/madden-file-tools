const fs = require('fs');
const path = require('path');

const TDBHelper = require('../helpers/TDBHelper');
const tdbFilePath = path.join(__dirname, './data/streameddata.db');
let done = false;

parseTDB(tdbFilePath)
    .then(() => {
        done = true;
    });

checkDone();

function checkDone() {
    if (!done) {
        setTimeout(checkDone, 100);
    }
}

async function parseTDB(path) {
    const helper = new TDBHelper();
    helper.load(path)
        .then(() => {
            helper.file.LCSS.readRecords()
                .then(() => {
                    console.log(helper.file.LCSS.records[0].LCST);
                })
        });
};