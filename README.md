# madden-file-tools
JS API for reading and extracting EA/Madden files.

## Usage
This package is useful for parsing the following files:
- TDB files: used by legacy Madden, NCAA, and Head Coach games. (Can Read and write)
- AST files: used by many games. (Note: Read only as of now)
  - Contain other resource files such as DDS files.

### EA TDB Files (Legacy Madden, NCAA 14)
    const TDBHelper = require('madden-file-tools/helpers/TDBHelper');
    const tdbPath = [path to file];

    const helper = new TDBHelper();
    helper.load(tdbPath)
        .then((file) => {
            // You have access to all the tables and records here.
        
            // Access individual table
            const awplTable = file.AWPL;
                // Alternative: file.tables[0];
                // `tables` is just an array.


            // Access field values
            const firstStc1Field = file.AWPL.records[0].fields['STC1'].value;
                // Or file.AWPL.records[0].fields.STC1.value;

                // Alternative: file.AWPL.records[0].STC1;
                // The alternative is nicer to use, but less performant.


            // Set field values
            file.AWPL.records[0].fields['STC1'].value = 20;

                // Alternative: file.AWPL.records[0].STC1 = 20;
                // Again, this way is a little slower, but is nicer to write.
            });

            // Save the file
            helper.save([optional new file here, otherwise overwrite])
                .then(() => {
                    // File has been saved here.
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

## Documentation
