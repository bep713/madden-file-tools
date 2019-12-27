# madden-file-tools
JS API for reading and extracting Madden files.

## Usage
    const mft = require('madden-file-tools');
    
    // to create a file from unknown contents
    const file = mft.parseUnknownFile(unknownContents);

    // to create a known file
    const ast = mft.createFile('ast', astFileContents);

    // to extract an archive
    mft.extractAllFromArchive(ast)
        .then((uncompressedFiles) => {
            console.log(uncompressedFiles[0]);
        });

    // to convert a file
    const ddsFile = ast.archivedFiles[0].uncompressedFile;
    mft.convertFile(ddsFile, 'png')
        .then((pngFile) => {
            console.log(pngFile);
        });


## Documentation

### Structure


Supported File Types
- AST
- DDS
- PNG