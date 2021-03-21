const { expect } = require('chai');
const ASTEntry = require('../../filetypes/AST/ASTEntry');

describe('ASTEntry unit tests', () => {
    let entry;
    const testSchema = {
        'unknown1': {
            'type': 'buffer',
            'length': 0,
            'offset': 0
        },
        'id': {
            'type': 'buffer',
            'length': 8,
            'offset': 0
        },
        'startPosition': {
            'type': 'integer',
            'length': 3,
            'offset': 8
        },
        'fileSize': {
            'type': 'integer',
            'length': 2,
            'offset': 11
        },
        'unknown2': {
            'type': 'buffer',
            'length': 2,
            'offset': 13
        }
    };

    beforeEach(() => {
        entry = new ASTEntry(testSchema);
    });

    describe('id', () => {
        it('can get id as a buffer', () => {
            const buffer = Buffer.from([0x38, 0x0A, 0x00, 0x00, 0x10, 0xBF, 0x0C, 0x00]);
            entry.id = buffer;
            expect(entry.id).to.eql(buffer);
            expect(entry.isChanged).to.be.true;
        });
    
        it('can get full id as an integer', () => {
            entry.id = Buffer.from([0x38, 0x0A, 0x00, 0x00, 0x10, 0xBF, 0x0C, 0x00]);
            expect(entry.fullId.toString()).to.eql(0xCBF1000000A38.toString());
            expect(entry.isChanged).to.be.true;
        });
    
        it('can get short id as an integer', () => {
            entry.id = Buffer.from([0x38, 0x0A, 0x00, 0x00, 0x10, 0xBF, 0x0C, 0x00]);
            expect(entry.shortId).to.eql(0xA38);
            expect(entry.isChanged).to.be.true;
        });
    
        it('can set short id', () => {
            entry.shortId = 0xA48;
            expect(entry.shortId).to.eql(0xA48);
            expect(entry.id).to.eql(Buffer.from([0x48, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
            expect(entry.isChanged).to.be.true;
        });
    
        it('can set short id after already setting full id', () => {
            entry.id = Buffer.from([0x38, 0x0A, 0x00, 0x00, 0x10, 0xBF, 0x0C, 0x00]);
            entry.shortId = 0xA58;
            expect(entry.shortId).to.eql(0xA58);
            expect(entry.id).to.eql(Buffer.from([0x58, 0x0A, 0x00, 0x00, 0x10, 0xBF, 0x0C, 0x00]));
            expect(entry.isChanged).to.be.true;
        });

        it('can set full id using a big int', () => {
            entry.fullId = BigInt(0xCBF1000000A38);
            expect(entry.id).to.eql(Buffer.from([0x38, 0x0A, 0x00, 0x00, 0x10, 0xBF, 0x0C, 0x00]));
            expect(entry.isChanged).to.be.true;
        });

        it('can set full id using a number', () => {
            entry.fullId = 0xCBF1000000A38;
            expect(entry.id).to.eql(Buffer.from([0x38, 0x0A, 0x00, 0x00, 0x10, 0xBF, 0x0C, 0x00]));
            expect(entry.isChanged).to.be.true;
        });
    });

    describe('startPosition', () => {
        const buffer = Buffer.from([0xB8, 0x61, 0x4E]);

        it('can set start position from a buffer', () => {
            entry.startPosition = buffer
            expect(entry.startPosition).to.eql(buffer);
            expect(entry.isChanged).to.be.true;
        });

        it('can get start position as an integer', () => {
            entry.startPosition = buffer;
            expect(entry.startPositionInt).to.eql(0x4E61B8);
            expect(entry.isChanged).to.be.true;
        });

        it('can set start position as an integer', () => {
            entry.startPositionInt = 0x4E5020;
            expect(entry.startPositionInt).to.eql(0x4E5020);
            expect(entry.startPosition).to.eql(Buffer.from([0x20, 0x50, 0x4E]));
            expect(entry.isChanged).to.be.true;
        });

        it('can get start position in file', () => {
            entry.startPosition = buffer;
            entry.offsetShift = 8;
            expect(entry.startPositionInFile).to.eql(0x4E61B8 * 8)
            expect(entry.isChanged).to.be.true;
        });
    });

    describe('fileSize', () => {
        const buffer = Buffer.from([0x11, 0x3D]);

        it('can set file size from a buffer', () => {
            entry.fileSize = buffer
            expect(entry.fileSize).to.eql(buffer);
            expect(entry.isChanged).to.be.true;
        });

        it('can get file size as an integer', () => {
            entry.fileSize = buffer;
            expect(entry.fileSizeInt).to.eql(0x3D11);
            expect(entry.isChanged).to.be.true;
        });

        it('can set file size as an integer', () => {
            entry.fileSizeInt = 0x3D15;
            expect(entry.fileSizeInt).to.eql(0x3D15);
            expect(entry.fileSize).to.eql(Buffer.from([0x15, 0x3D]));
            expect(entry.isChanged).to.be.true;
        });
    });

    describe('data', () => {
        it('can set data to a buffer', () => {
            const buffer = Buffer.from([0x11, 0x22, 0x33]);
            entry.data = buffer
            expect(entry.data).to.eql(buffer);
        });

        it('updates file size length when data is assigned', () => {
            const buffer = Buffer.from([0x11, 0x22, 0x33]);
            entry.data = buffer
            expect(entry.fileSizeInt).to.eql(3);
        });

        it('sets change indicator', () => {
            const buffer = Buffer.from([0x11, 0x22, 0x33]);
            entry.data = buffer
            expect(entry.isChanged).to.be.true;
        });
    });
});