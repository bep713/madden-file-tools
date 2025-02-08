const m24Path = 'data/M24_ROSTER-Official';
const m25Path = 'data/M25_ROSTER-Official';

const MaddenRosterHelper = require('../helpers/MaddenRosterHelper');
let done = false;

changeKeyedRecordData(m24Path, m25Path)
    .then(() => {
        done = true;
    });

checkDone();

function checkDone() {
    if (!done) {
        setTimeout(checkDone, 100);
    }
}

async function changeKeyedRecordData(m24Path, m25Path) {
    const m24Helper = new MaddenRosterHelper();
    const m25Helper = new MaddenRosterHelper();
    
    // These two tests change Geno Smith's right arm sleeve to all white in Madden 24 and Madden 25 respectively
    m24Helper.load(m24Path)
        .then(() => {

            // Find first CVPM record (should be Geno Smith)
            const geno = m24Helper.file.CVPM.records.find((record) => {
                return record.fields['ASNM'].value === "SmithGeno_112";
            });

            // Get the loadouts subtable
            const genoLoadouts = geno.fields['LOUT'].value;

            // Find the loadout containing equipment (LDTY = 1 [PlayerOnField])
            const equipmentLoadout = genoLoadouts.records.find((record) => {
                return record.fields['LDTY']?.value === 1;    
            });

            // Get the loadoutElements subtable
            const equipmentLoadoutItems = equipmentLoadout.fields['PINS'].value;

            // Find the right arm sleeve item
            const armSleeve = equipmentLoadoutItems.records.find((record) => {
                return record.fields['SLOT'].value === 17;
            });

            // Change the item asset name to a white arm sleeve
            armSleeve.fields['ITAN'].value = "GearArmSleeve_Full_sleeveLongUnderarmor_normal_White";

            m24Helper.save("data/WriteTest_M24_ROSTER-Official")
                .then(() => {
                    console.log("Completed M24 CVPM test. Saved file to data/WriteTest_M24_ROSTER-Official");
                    return true;
                });
        });
    
    m25Helper.load(m25Path)
        .then(() => {
            // Find first PLEX record (should be Geno Smith)
            const geno = m25Helper.file.PLEX.records.find((record) => {
                return record.fields['ASNM'].value === "SmithGeno_112";
            });

            // Get the loadouts subtable
            const genoLoadouts = geno.fields['LOUT'].value;

            // Find the loadout containing equipment (LDTY = 1 [PlayerOnField])
            const equipmentLoadout = genoLoadouts.records.find((record) => {
                return record.fields['LDTY']?.value === 1;    
            });

            // Get the loadoutElements subtable
            const equipmentLoadoutItems = equipmentLoadout.fields['PINS'].value;

            // Find the right arm sleeve item
            const armSleeve = equipmentLoadoutItems.records.find((record) => {
                return record.fields['SLOT'].value === 17;
            });

            // Change the item asset name to a white arm sleeve
            armSleeve.fields['ITAN'].value = "GearArmSleeve_Full_sleeveLongUnderarmor_normal_White";

            m25Helper.save("data/WriteTest_M25_ROSTER-Official")
                .then(() => {
                    console.log("Completed M25 PLEX test. Saved file to data/WriteTest_M25_ROSTER-Official");
                    return true;
                });
        });
};