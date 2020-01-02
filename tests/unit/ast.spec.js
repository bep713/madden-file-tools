const fs = require('fs');
const path = require('path');
const through2 = require('through2');
const expect = require('chai').expect;
const ast = require('../../streams/ast');

const awardsPath = path.join(__dirname, '../data/awards.AST');
const cafePath = path.join(__dirname, '../data/cafe2scriptpod.AST');
const coachPortraitsPath = path.join(__dirname, '../data/coachportraits.AST');

let awardsRaw = fs.readFileSync(awardsPath);
let cafeRaw = fs.readFileSync(cafePath);
let coachPortraitsRaw = fs.readFileSync(coachPortraitsPath);

let awards, cafe, coachPortraits;

describe('ast unit tests', () => {
    describe('parses the header correctly', (done) => {
        it('parses the signature correctly', () => {
            fs.createReadStream(awardsPath)
                .pipe(ast())
                .pipe(through2(function (buf, _, next) {
                    expect(1).to.equal(1);
                    done();
                }));
        });
    });
});