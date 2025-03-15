const MaddenRosterHelper = require('../../helpers/MaddenRosterHelper');
const expect = require('chai').expect;

const m24Path = '../data/M24_ROSTER-Official';
const m25Path = '../data/M25_ROSTER-Official';

it('M24 Helper test', () => {
    const m24Helper = new MaddenRosterHelper();
    m24Helper.load(m24Path).then(() => {
        expect(m24Helper.file.CVPM.records[0].fields['ASNM'].value).to.equal('SmithGeno_112');

        const genoLoadouts = m24Helper.file.CVPM.records[0].fields['LOUT'].value;

        expect(genoLoadouts.records.length).to.equal(2);

        const equipmentLoadout = genoLoadouts.records[1];

        const equipmentLoadoutItems = equipmentLoadout.fields['PINS'].value;

        const armSleeve = equipmentLoadoutItems.records.find((record) => {
            return record.fields['SLOT'].value === 17;
        });

        armSleeve.fields['ITAN'].value = "GearArmSleeve_Full_sleeveLongUnderarmor_normal_White";

        m24Helper.save("tests/data/WriteTest_M24_ROSTER-Official").then(() => {
            const m24Helper2 = new MaddenRosterHelper();
            m24Helper2.load("tests/data/WriteTest_M24_ROSTER-Official").then(() => {
                const genoLoadouts2 = m24Helper2.file.CVPM.records[0].fields['LOUT'].value;

                const equipmentLoadout2 = genoLoadouts2.records.find((record) => {
                    return record.fields['LDTY']?.value === 1;
                });

                const equipmentLoadoutItems2 = equipmentLoadout2.fields['PINS'].value;

                const armSleeve2 = equipmentLoadoutItems2.records.find((record) => {
                    return record.fields['SLOT'].value === 17;
                });

                expect(armSleeve2.fields['ITAN'].value).to.equal("GearArmSleeve_Full_sleeveLongUnderarmor_normal_White");
            });
        });
    });
});

it('M24 Added Record Test', () => {
    const m24Helper = new MaddenRosterHelper();
    m24Helper.load(m24Path).then(() => {
        const newRecord = m24Helper.file.CVPM.records[0].deepCopyRecord();
        newRecord.index = 113;
        newRecord.fields['ASNM'].value = "SmithGeno_113";

        const originalTableLength = m24Helper.file.CVPM.numEntries;

        m24Helper.file.CVPM.addRecord(newRecord);

        m24Helper.save("tests/data/WriteTest_AddedRecordM24_ROSTER-Official").then(() => {
            const m24Helper2 = new MaddenRosterHelper();
            m24Helper2.load("tests/data/WriteTest_AddedRecordM24_ROSTER-Official").then(() => {
                // Ensure the new entry is present
                expect(m24Helper2.file.CVPM.records.numEntries).to.equal(originalTableLength + 1);
                expect(m24Helper2.file.CVPM.records.find((record) => {
                    return record.index === 113;
                }).fields['ASNM'].value).to.equal("SmithGeno_113");

                // Ensure that the original record remains intact
                expect(m24Helper2.file.CVPM.records[0].fields['ASNM'].value).to.equal('SmithGeno_112');
            });
        });
    });
});
 

it('M25 Helper test', () => {
    const m25Helper = new MaddenRosterHelper();
    m25Helper.load(m25Path).then(() => {
        expect(m25Helper.file.PLEX.records[0].fields['ASNM'].value).to.equal('SmithGeno_112');

        const genoLoadouts = m25Helper.file.PLEX.records[0].fields['LOUT'].value;

        expect(genoLoadouts.records.length).to.equal(2);

        const equipmentLoadout = genoLoadouts.records[1];

        const equipmentLoadoutItems = equipmentLoadout.fields['PINS'].value;

        const armSleeve = equipmentLoadoutItems.records.find((record) => {
            return record.fields['SLOT'].value === 17;
        });

        armSleeve.fields['ITAN'].value = "GearArmSleeve_Full_sleeveLongUnderarmor_normal_White";

        m25Helper.save("tests/data/WriteTest_M25_ROSTER-Official").then(() => {
            const m25Helper2 = new MaddenRosterHelper();
            m25Helper2.load("tests/data/WriteTest_M25_ROSTER-Official").then(() => {
                const genoLoadouts2 = m25Helper2.file.PLEX.records[0].fields['LOUT'].value;

                const equipmentLoadout2 = genoLoadouts2.records.find((record) => {
                    return record.fields['LDTY']?.value === 1;
                });

                const equipmentLoadoutItems2 = equipmentLoadout2.fields['PINS'].value;

                const armSleeve2 = equipmentLoadoutItems2.records.find((record) => {
                    return record.fields['SLOT'].value === 17;
                });

                expect(armSleeve2.fields['ITAN'].value).to.equal("GearArmSleeve_Full_sleeveLongUnderarmor_normal_White");
            });
        });
    });
});

it('M25 Added Record Test', () => {
    const m25Helper = new MaddenRosterHelper();
    m25Helper.load(m25Path).then(() => {
        const newRecord = m25Helper.file.PLEX.records[0].deepCopyRecord();
        newRecord.index = 113;
        newRecord.fields['ASNM'].value = "SmithGeno_113";

        const originalTableLength = m25Helper.file.PLEX.numEntries;

        m25Helper.file.PLEX.addRecord(newRecord);

        m25Helper.save("tests/data/WriteTest_AddedRecordM25_ROSTER-Official").then(() => {
            const m25Helper2 = new MaddenRosterHelper();
            m25Helper2.load("tests/data/WriteTest_AddedRecordM25_ROSTER-Official").then(() => {
                // Ensure the new entry is present
                expect(m25Helper2.file.PLEX.records.numEntries).to.equal(originalTableLength + 1);
                expect(m25Helper2.file.PLEX.records.find((record) => {
                    return record.index === 113;
                }).fields['ASNM'].value).to.equal("SmithGeno_113");

                // Ensure that the original record remains intact
                expect(m25Helper2.file.PLEX.records[0].fields['ASNM'].value).to.equal('SmithGeno_112');
            });
        });
    });
});