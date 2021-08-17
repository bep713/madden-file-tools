const { expect } = require('chai');
const utilService = require('../../services/utilService');

describe('util service unit tests', () => {
    describe('can get text from six bit character compression', () => {
        it('function exists', () => {
            expect(utilService.getUncompressedTextFromSixBitCompression).to.exist;
        });

        it('returns expected value', () => {
            const value = utilService.getUncompressedTextFromSixBitCompression(Buffer.from([0x92, 0x3A, 0x34]));
            expect(value).to.equal('DCHT');
        });
    });

    describe('can read an LEB modified compressed integer', () => {
        it('returns expected value (single digit)', () => {
            const value = utilService.readModifiedLebCompressedInteger(Buffer.from([0x20]));
            expect(value).to.equal(0x20);
        });

        it('returns expected value (two digits)', () => {
            const value = utilService.readModifiedLebCompressedInteger(Buffer.from([0xA5, 0x31]));
            expect(value).to.equal(3173);
        });

        it('returns expected value (three digits)', () => {
            const value = utilService.readModifiedLebCompressedInteger(Buffer.from([0x87, 0xA3, 0x01]));
            expect(value).to.equal(10439);
        });
    });

    describe('can write an LEB modified compressed integer', () => {
        it('returns expected value (single digit)', () => {
            const value = utilService.writeModifiedLebCompressedInteger(32);
            expect(value).to.eql(Buffer.from([0x20]));
        });

        it('63', () => {
            const value = utilService.writeModifiedLebCompressedInteger(63);
            expect(value).to.eql(Buffer.from([0x3F]));
        });

        it('64', () => {
            const value = utilService.writeModifiedLebCompressedInteger(64);
            expect(value).to.eql(Buffer.from([0x80, 0x01]));
        });

        it('returns expected value (two digits)', () => {
            const value = utilService.writeModifiedLebCompressedInteger(3173);
            expect(value).to.eql(Buffer.from([0xA5, 0x31]));
        });

        it('returns expected value (three digits)', () => {
            const value = utilService.writeModifiedLebCompressedInteger(10439);
            expect(value).to.eql(Buffer.from([0x87, 0xA3, 0x01]));
        });
    });
});