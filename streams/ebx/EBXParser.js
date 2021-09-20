const utilService = require('../../services/utilService');
const FileParser = require('../../filetypes/abstract/FileParser');
const { readGuid } = require('../../services/utilService');

class EBXParser extends FileParser {
    constructor() {
        super();
        this._file = {};

        this.bytes(0x8, this._onFileHeader);
    };

    _onFileHeader(buf) {
        this._file.header = {
            magic: buf.readUInt32LE(0),
            fileSize: buf.readUInt32LE(4)
        }

        this.bytes(0xC, this._onEbxStart);
    };

    _onEbxStart(buf) {
        this._file.ebx = {
            magic: buf.readUInt32LE(0),
            ebxd: {
                magic: buf.readUInt32LE(4),
                size: buf.readUInt32LE(8)
            }
        }

        this.bytes(this._file.ebx.ebxd.size, this._onEbxdData);
    };

    _onEbxdData(buf) {
        this._file.ebx.ebxd.fileGuid = readGuid(buf, 0xC);
        this._file.ebx.ebxd.raw = buf;
        this._file.ebx.ebxd.rawDataBlock = buf.slice(0x1C);
        this._file.ebx.ebxd.stringOffset = buf.readUInt32LE(0x34);
        this._file.name = readCString(buf, (this._file.ebx.ebxd.stringOffset + 0x34));

        if (this.currentBufferIndex % 2 != 0) {
            this.bytes(0x9, (buf) => {
                return this._onEfixStart(buf.slice(1));
            });
        }
        else {
            this.bytes(0x8, this._onEfixStart);
        }
    };

    _onEfixStart(buf) {
        this._file.ebx.efix = {
            magic: buf.readUInt32LE(0),
            size: buf.readUInt32LE(4)
        };

        this.bytes(this._file.ebx.efix.size, this._onEfixData);
    };

    _onEfixData(buf) {
        this._file.ebx.efix.fileGuidRaw = buf.slice(0, 16);
        this._file.ebx.efix.fileGuid = utilService.readGuid(buf, 0);

        this._file.ebx.efix.classTypeCount = buf.readUInt32LE(16);
        this._file.ebx.efix.classTypes = [];
        this._file.ebx.efix.classTypesRaw = [];
        let currentPos = 20;

        for (let i = 0; i < this._file.ebx.efix.classTypeCount; i++) {
            this._file.ebx.efix.classTypesRaw.push(buf.slice(currentPos, currentPos + 16));
            this._file.ebx.efix.classTypes.push(utilService.readGuid(buf, currentPos));
            currentPos += 16;
        }

        this._file.ebx.efix.typeInfoGuidCount = buf.readUInt32LE(currentPos);
        this._file.ebx.efix.typeInfoGuids = [];

        currentPos += 4;

        for (let i = 0; i < this._file.ebx.efix.typeInfoGuidCount; i++) {
            const lastFourBytes = buf.slice(currentPos, currentPos + 4);
            const classTypeGuid = this._file.ebx.efix.classTypesRaw[i].slice(4);

            this._file.ebx.efix.typeInfoGuids.push(utilService.parseGuid(Buffer.concat([classTypeGuid, lastFourBytes])));
            currentPos += 4;
        }

        this._file.ebx.efix.dataOffsetCount = buf.readUInt32LE(currentPos);
        this._file.ebx.efix.unk3Count = buf.readUInt32LE(currentPos + 4);

        this._file.ebx.efix.dataOffsets = [];
        this._file.ebx.efix.unk3Offsets = [];
        
        currentPos += 8;

        for (let i = 0; i < this._file.ebx.efix.dataOffsetCount; i++) {
            this._file.ebx.efix.dataOffsets.push(buf.readUInt32LE(currentPos));
            currentPos += 4;
        }

        for (let i = 0; i < this._file.ebx.efix.unk3Count - this._file.ebx.efix.dataOffsetCount; i++) {
            this._file.ebx.efix.unk3Offsets.push(buf.readUInt32LE(currentPos));
            currentPos += 4;
        }

        this._file.ebx.efix.unk4Count = buf.readUInt32LE(currentPos);
        this._file.ebx.efix.unk4s = [];

        currentPos += 4;

        for (let i = 0; i < this._file.ebx.efix.unk4Count; i++) {
            this._file.ebx.efix.unk4s.push(buf.readUInt32LE(currentPos));
            currentPos += 4;
        }

        this._file.ebx.efix.unk5Count = buf.readUInt32LE(currentPos);
        this._file.ebx.efix.unk5s = [];

        currentPos += 4;

        for (let i = 0; i < this._file.ebx.efix.unk5Count; i++) {
            this._file.ebx.efix.unk5s.push(buf.readUInt32LE(currentPos));
            currentPos += 4;
        }

        this._file.ebx.efix.importReferenceCount = buf.readUInt32LE(currentPos);
        this._file.ebx.efix.importReferences = [];
        
        currentPos += 4;

        for (let i = 0; i < this._file.ebx.efix.importReferenceCount; i++) {
            this._file.ebx.efix.importReferences.push({
                fileGuid: utilService.readGuid(buf, currentPos),
                classGuid: utilService.readGuid(buf, currentPos + 16)
            });

            currentPos += 32;
        }

        this._file.ebx.efix.unk6Count = buf.readUInt32LE(currentPos);
        this._file.ebx.efix.unk6s = [];

        currentPos += 4;

        for (let i = 0; i < this._file.ebx.efix.unk6Count; i++) {
            this._file.ebx.efix.unk6s.push(buf.readUInt32LE(currentPos));
            currentPos += 4;
        }

        this._file.ebx.efix.unk7Count = buf.readUInt32LE(currentPos);
        this._file.ebx.efix.unk7s = [];

        currentPos += 4;

        for (let i = 0; i < this._file.ebx.efix.unk7Count; i++) {
            this._file.ebx.efix.unk7s.push(buf.readUInt32LE(currentPos));
            currentPos += 4;
        }

        this._file.ebx.efix.dataSize = buf.readUInt32LE(currentPos);
        this._file.ebx.efix.totalEbxDataSize = buf.readUInt32LE(currentPos + 4);
        this._file.ebx.efix.totalEbxDataSize2 = buf.readUInt32LE(currentPos + 8);

        this.bytes(0x8, this._onEbxxStart);
    };

    _onEbxxStart(buf) {
        this._file.ebx.ebxx = {
            magic: buf.readUInt32LE(0),
            size: buf.readUInt32LE(4)
        };
        
        this.bytes(this._file.ebx.ebxx.size, this._onEbxxData);
    };

    _onEbxxData(buf) {
        this._file.ebx.ebxx.ebxxCount = buf.readUInt32LE(0);
        this._file.ebx.ebxx.zero = buf.readUInt32LE(4);

        this._file.ebx.ebxx.ebxxs = [];
        let currentPos = 8;

        for (let i = 0; i < this._file.ebx.ebxx.ebxxCount; i++) {
            this._file.ebx.ebxx.ebxxs.push(buf.slice(currentPos, currentPos + 16));
            currentPos += 16;
        }
    };
};

module.exports = EBXParser;

function readCString(buf, offset) {
    let currentPosition = offset;
    let currentByte = buf.readUInt8(currentPosition);

    while (currentByte != 0) {
        currentPosition += 1;
        currentByte = buf.readUInt8(currentPosition);
    }

    return buf.toString('utf8', offset, currentPosition);
};