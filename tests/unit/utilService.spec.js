const { expect } = require('chai');
const utilService = require('../../services/utilService');

describe('util service unit tests', () => {
    it('can write guids to a buffer', () => {
        const bytes = utilService.guidStringToBuf('880ADF28-EF94-E815-6832-04372343FF58');
        expect(bytes.readUInt32BE(0)).to.equal(0x28DF0A88);
        expect(bytes.readUInt32BE(4)).to.equal(0x94EF15E8);
        expect(bytes.readUInt32BE(8)).to.equal(0x68320437);
        expect(bytes.readUInt32BE(12)).to.equal(0x2343FF58);
    });

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

        it('8191', () => {
            const value = utilService.readModifiedLebCompressedInteger(Buffer.from([0xBF, 0x7F]));
            expect(value).to.eql(8191);
        });

        it('8192', () => {
            const value = utilService.readModifiedLebCompressedInteger(Buffer.from([0x80, 0x80, 0x01]));
            expect(value).to.eql(8192);
        });

        it('8193', () => {
            const value = utilService.readModifiedLebCompressedInteger(Buffer.from([0x81, 0x80, 0x01]));
            expect(value).to.eql(8193);
        });

        it('returns expected value (three digits)', () => {
            const value = utilService.readModifiedLebCompressedInteger(Buffer.from([0x87, 0xA3, 0x01]));
            expect(value).to.equal(10439);
        });

        it('returns expected value (negative)', () => {
            const value = utilService.readModifiedLebCompressedInteger(Buffer.from([0x5F]));
            expect(value).to.equal(-31);
        });

        it('returns expected value (negative, two digits)', () => {
            const value = utilService.readModifiedLebCompressedInteger(Buffer.from([0xC0, 0x01]));
            expect(value).to.equal(-64);
        });

        it('returns expected value (negative, three digits)', () => {
            const value = utilService.readModifiedLebCompressedInteger(Buffer.from([0xC7, 0xA3, 0x01]));
            expect(value).to.equal(-10439);
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

        it('65', () => {
            const value = utilService.writeModifiedLebCompressedInteger(65);
            expect(value).to.eql(Buffer.from([0x81, 0x01]));
        });

        it('returns expected value (two digits)', () => {
            const value = utilService.writeModifiedLebCompressedInteger(3173);
            expect(value).to.eql(Buffer.from([0xA5, 0x31]));
        });

        it('8191', () => {
            const value = utilService.writeModifiedLebCompressedInteger(8191);
            expect(value).to.eql(Buffer.from([0xBF, 0x7F]));
        });

        it('8192', () => {
            const value = utilService.writeModifiedLebCompressedInteger(8192);
            expect(value).to.eql(Buffer.from([0x80, 0x80, 0x01]));
        });

        it('8193', () => {
            const value = utilService.writeModifiedLebCompressedInteger(8193);
            expect(value).to.eql(Buffer.from([0x81, 0x80, 0x01]));
        });

        it('returns expected value (three digits)', () => {
            const value = utilService.writeModifiedLebCompressedInteger(10439);
            expect(value).to.eql(Buffer.from([0x87, 0xA3, 0x01]));
        });

        it('returns expected value (negative)', () => {
            const value = utilService.writeModifiedLebCompressedInteger(-31);
            expect(value).to.eql(Buffer.from([0x5F]));
        });

        it('returns expected value (negative, two digits)', () => {
            const value = utilService.writeModifiedLebCompressedInteger(-64);
            expect(value).to.eql(Buffer.from([0xC0, 0x01]));
        });

        it('returns expected value (negative, three digits)', () => {
            const value = utilService.writeModifiedLebCompressedInteger(-10439);
            expect(value).to.eql(Buffer.from([0xC7, 0xA3, 0x01]));
        });
    });
});