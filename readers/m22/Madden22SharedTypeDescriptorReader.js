const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');

const maddenTypeService = require('../../services/maddenTypeService'); 
const SharedTypeDescriptorParser = require('../../streams/ebx/SharedTypeDescriptorParser');

const M22_TYPES_PATH = path.join(__dirname, '../../tests/data/types/M22Types.json');
const sharedTypeDescriptorsM22Path = path.join(__dirname, '../../tests/data/ebx/SharedTypeDescriptors.ebx_M22.dat');

class Madden22SharedTypeDescriptorReader {
    constructor(typeDescriptorFileStream, m22ClassDefinitionFilePath) {
        this._typeDescriptorFileStream = typeDescriptorFileStream;
        this._classDefinitionFilePath = m22ClassDefinitionFilePath;

        this._sharedTypeParser = new SharedTypeDescriptorParser();
    };

    read() {
        return new Promise((resolve, reject) => {
            pipeline(
                this._typeDescriptorFileStream,
                this._sharedTypeParser,
                (err) => {
                    if (err) {
                        reject(err);
                    }
        
                    // maddenTypeService.loadTypesFromFile(this._classDefinitionFilePath);
                    maddenTypeService.types = JSON.parse(fs.readFileSync(this._classDefinitionFilePath));
                    maddenTypeService.mergeTypes(this._sharedTypeParser._file.types);
                    resolve(this._sharedTypeParser._file.types);
                }
            );
        });
    };
};

module.exports = Madden22SharedTypeDescriptorReader;