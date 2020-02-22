const expect = require('chai').expect;
const through2 = require('through2');

const installPath = 'D:\\Origin\\Madden NFL 20';
const MaddenParser = require('../../streams/MaddenParser');

let maddenParser = new MaddenParser();

describe('MaddenParser unit tests', () => {
    it('can instantiate the parser', () => {
        expect(maddenParser).to.not.be.undefined;
    });

    it('can pipe things from it', () => {
        expect(maddenParser.pipe).to.be.a('function');
    });

    
});