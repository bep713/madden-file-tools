const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const TDBHelper = require('../../helpers/TDBHelper');
const HC09Helper = require('../../helpers/HC09Helper');
const DBHelperFactory = require('../../helpers/DBHelperFactory');
const hc09FilePath = path.join(__dirname, '../data/HC09_TDB.db');
const testWritePath = path.join(__dirname, '../data/HC09USRDATA');

describe('DB Helper Factory unit tests', () => {
    describe('can read in a file', async () => {
        it('returns a TDBHelper if the file is a normal DB file', async () => {
            let helper = await DBHelperFactory.createHelper(hc09FilePath);
            expect(helper).to.be.an.instanceof(TDBHelper);
        });

        it('returns a HC09Helper if the file is a normal DB file', async () => {
            let helper = await DBHelperFactory.createHelper(testWritePath);
            expect(helper).to.be.an.instanceof(HC09Helper);
        });

        it('can read records after using the factory', async () => {
            let helper = await DBHelperFactory.createHelper(testWritePath);
            const file = await helper.load(testWritePath);
            await file.TEAM.readRecords();
            expect(file.TEAM.records[0].TDNA).to.eql('Bears');
        });
    });
});