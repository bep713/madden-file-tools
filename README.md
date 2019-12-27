# madden-file-tools
JS API for reading and extracting Madden files.

## Usage
    const mft = require('madden-file-tools');
    
    // to create a file from unknown contents
    //     the returned object will be an instance of an inheriting class
    //     (ex: AST, DDS, PNG, etc...)

    const file = mft.parseUnknownFile(unknownContents);


    // to create a known file
    //     the returned object will be of type ASTFile in this case.

    const ast = mft.createFile('ast', astFileContents);


    // to extract an archive
    //    the promise will return a list of inheriting classes

    mft.extractAllFromArchive(ast)
        .then((uncompressedFiles) => {
            console.log(uncompressedFiles[0]);
        });


    // to convert a file
    //    the promise will return an inheriting class.
    //    in this case, it is a PNGFile.

    const ddsFile = ast.archivedFiles[0].uncompressedFile;
    mft.convertFile(ddsFile, 'png')
        .then((pngFile) => {
            pngFile.save('output-filepath-goes-here');
        });


## Documentation

### Diagram
![class diagram](https://github.com/bep713/madden-file-tools/blob/master/docs/class.png?raw=true)

### Main package
These are the set of methods you'll get when you require the module. See usage for method details.

### Base classes
You usually won't instantiate these clases. See the Implementing classes section for normal usage.

#### File
The file class is the base class of most file types. It contains attributes common to all files.

Note: the parse() method is automatically called IF it is required by the inheriting files.

    // instantiate a new File.
    //     fileContents should be a Node buffer

    const file = new File(fileContents, 'optional-path-to-file');


    let fileContents = file.rawContents;
    let filePath = file.filePath;
    

    // save a file
    //    If no output path is passed, the filename passed above will be
    //    used and the file will be overwritten.

    file.save('optional-output-path')
        .then(() => {
            console.log('File saved');
        });

More coming soon!