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
            helper.file.LCLS.readRecords()
                .then(() => {
                    console.log(helper.file.LCLS.records[0].LCLT);
                })
        });
};