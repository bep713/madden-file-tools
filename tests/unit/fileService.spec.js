// const fs = require('fs');
// const path = require('path');
// const expect = require('chai').expect;
// const fileService = require('../../services/fileService');

// const pathToData = path.join(__dirname, 'data/');
// const astFile = fs.readFileSync(path.join(pathToData, 'awards.AST'));
// const ddsFile = fs.readFileSync(path.join(pathToData, 'test.DDS'));
// const pngFile = fs.readFileSync(path.join(pathToData, 'afc.png'));

// describe('file service unit tests', () => {
//     describe('can get a file type', () => {
//         it('DDS', () => {
//             const result = fileService.getFileType(ddsFile);
//             expect(result).to.eql('dds');
//         });

//         it('AST', () => {
//             const result = fileService.getFileType(astFile);
//             expect(result).to.eql('ast');
//         });

//         it('PNG', () => {
//             const result = fileService.getFileType(pngFile);
//             expect(result).to.eql('png');
//         });
//     });

//     describe('can create a madden file instance', () => { 
//         it('DDS', () => {
//             const result = fileService.createFile('dds', ddsFile);
//             expect(result).to.be.a('DDSFile');
//         });

//         it('AST', () => {
//             const result = fileService.createFile('ast', astFile);
//             expect(result).to.be.an('ASTFile');
//         });

//         it('PNG', () => {
//             const result = fileService.createFile('png', pngFile);
//             expect(result).to.be.a('PNGFile');
//         });
//     });

//     describe('can parse unknown file contents and return the correct madden file instance', () => {
//         it('DDS', () => {
//             const result = fileService.parseUnknownFile(ddsFile);
//             expect(result).to.be.a('DDSFile');
//         });

//         it('AST', () => {
//             const result = fileService.parseUnknownFile(astFile);
//             expect(result).to.be.an('ASTFile');
//         });

//         it('PNG', () => {
//             const result = fileService.parseUnknownFile(pngFile);
//             expect(result).to.be.a('PNGFile');
//         });
//     });

//     describe('can extract files from archives', () => {
//         it('can extract a single archived file', (done) => {
//             const ast = fileService.createFile('ast', astFile);
//             const firstArchivedFile = ast.archivedFiles[0];
//             fileService.extractArchivedFile(firstArchivedFile)
//                 .then((extractedFile) => {
//                     expect(extractedFile).to.be.a('DDSFile');
//                     expect(firstArchivedFile.uncompressedFile).to.eql(extractedFile);
//                     done();
//                 });
//         });

//         it('can extract all archived files', (done) => {
//             const ast = fileService.createFile('ast', astFile);
//             fileService.extractAllFromArchive(ast)
//                 .then((extractedFiles) => {
//                     expect(extractedFiles.length).to.equal(ast.archivedFiles.length);
//                     expect(ast.archivedFiles[0].uncompressedFile).to.eql(extractedFiles[0]);
                    
//                     const medal = fs.readFileSync(path.join(pathToData, 'medal.dds'));
//                     const medalArchivedFile = ast.archivedFiles.find((file) => {
//                         return file.archiveMetadata.index === 0;
//                     });

//                     expect(medalArchivedFile.uncompressedFile.rawContents).to.eql(medal);
//                     done();
//                 });
//         });
//     });

//     describe('can convert a file', () => {
//         it('DDS -> PNG', (done) => {
//             const dds = fileService.createFile('dds', ddsFile);
//             fileService.convertFile(dds, 'png')
//                 .then((png) => {
//                     const expectedPng = fs.readFileSync(path.join(pathToData, 'convertedPng.png'));

//                     expect(png).to.be.a('PNGFile');
//                     expect(png.rawContents).to.eql(expectedPng);
//                     done();
//                 })
//                 .catch((err) => {
//                     console.log(err);
//                     done();
//                 })
//         });
//     });
// });