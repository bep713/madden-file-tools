# madden-file-tools
JS API for reading and extracting EA/Madden files.

## Usage
This package is useful for parsing the following files:
- TDB files: used by legacy Madden, NCAA, and Head Coach games. (Can Read and write)
- TDB2 files: used by Madden 21 and newer for roster files. (Can Read and Write)
- AST files: used by many games. (Note: Read only as of now)
  - Contain other resource files such as DDS files.

### EA TDB Files (Legacy Madden, NCAA 14)
    const TDBHelper = require('madden-file-tools/helpers/TDBHelper');
    const tdbPath = [path to file];

    const helper = new TDBHelper();
    helper.load(tdbPath)
        .then((file) => {
            // You have access to all the tables here.
            
            // Access individual table
            const awplTable = file.AWPL;
                // Alternative: file.tables[0];
                // `tables` is just an array.

            // To get access to the records, you need to read them in by each table. Tables are not automatically read due to memory constraints.
            file.AWPL.readRecords()
                .then(() => {
                    // Here you have access to all the AWPL records and data.
                    
                    // Access field values
                    const firstStc1Field = file.AWPL.records[0].fields['STC1'].value;
                        // Or file.AWPL.records[0].fields.STC1.value;

                        // Alternative: file.AWPL.records[0].STC1;
                        // The alternative is nicer to use, but less performant.


                    // Set field values
                    file.AWPL.records[0].fields['STC1'].value = 20;

                        // Alternative: file.AWPL.records[0].STC1 = 20;
                        // Again, this way is a little slower, but is nicer to write.

                    // Save the file
                    helper.save([optional new file here, otherwise overwrite])
                        .then(() => {
                            // File has been saved here.
                        });
                });
        });

### Read HC09 Files
The Head Coach 09 save is a little different from the others. It does not contain the DB file at the very beginning, so I've included a nice helper to load and save.

    const HeadCoach09Helper = require('madden-file-tools/helpers/HeadCoach09Helper');
    const headCoachSaveFilePath = [path to file];

    const helper = new HeadCoach09Helper();
    helper.load(headCoachSaveFilePath)
        .then((file) => {
            // Same TDB file API as above. You have access to all the tables here.

            // Make changes here

            // Save the file
            helper.save([optional new file here, otherwise overwrite])
                .then(() => {
                    // File has been saved here.
                });
        });

### Read Madden Roster Files (Madden 19+)
Similar to Head Coach 09 saves, Madden 19+ roster files are a bit special and have a header before the DB file containing a CRC checksum and other information. M19 and M20 roster files use the same TDB format as the legacy games for the DB file, but M21 and newer rosters store the DB file compressed, and the decompressed file is in a different format called TDB2. This package includes a helper that handles all this for you.

    const MaddenRosterHelper = require('madden-file-tools/helpers/MaddenRosterHelper');
    const rosterFilePath = [path to file];

    const helper = new MaddenRosterHelper();
    helper.load(rosterFilePath)
        .then((file) => {
            // This largely works the same as the TDB file API mentioned above. You have access to all the tables here.

            // M19-20 rosters using the legacy TDB format will require you to read the table's records before you can access them
            if(file.PLAY.records.length === 0) {
                file.PLAY.readRecords()
                    .then(() => {
                        // Make changes here
                    });
            }

            // Otherwise, M21+ rosters using the TDB2 format will have the records already read in.
            // Make changes here
            
            // Save the file
            helper.save([optional new file here, otherwise overwrite])
                .then(() => {
                    // File has been saved here.
                });
        });
        

### Generic TDB Reader/Writer Usage
    const fs = require('fs');
    const TDBParser = require('madden-file-tools/streams/TDBParser');
    const TDBWriter = require('madden-file-tools/streams/TDBWriter');

    const parser = new TDBParser();
    const readStream = fs.createReadStream([file path here]);

    stream.on('end', function () {
        const file = parser.file;

        // Make changes here

        // Save
        const writeStream = fs.createWriteStream([path to write]);
        const writer = new TDBWriter(file);

        writeStream.on('end', () => {
            // File has been saved here.
        });

        writer
            .pipe(writeStream);
    });

    stream
        .pipe(parser);