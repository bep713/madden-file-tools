const utilService = require('../../services/utilService');
const FileParser = require('../../filetypes/abstract/FileParser');
const TypeDescriptorList = require('../../filetypes/EBX/types/TypeDescriptorList');
const Type = require('../../filetypes/EBX/types/Type');
const Field = require('../../filetypes/EBX/types/Field');

const MAX_STREAM_LENGTH = 0x10000;
let streamLengthRemaining = 0;

class SharedTypeDescriptorParser extends FileParser {
    constructor() {
        super();
        this._file = {};

        this.bytes(0x18, this._onFileHeader);
    };

    _onFileHeader(buf) {
        this._file.header = {
            magic: buf.readUInt32LE(0),
            fileSize: buf.readUInt32LE(4)
        };

        this._file.ebxt = {
            magic: buf.readUInt32LE(8),
            refl: {
                magic: buf.readUInt32LE(12),
                size: buf.readUInt32LE(16),
                classGuidCount: buf.readUInt32LE(20),
                classGuids: []
            }
        };

        this.bytes(this._file.ebxt.refl.classGuidCount * 0x14, this._onClassGuidData);
    };

    _onClassGuidData(buf) {
        let currentPosition = 0;

        for (let i = 0; i < this._file.ebxt.refl.classGuidCount; i++) {
            this._file.ebxt.refl.classGuids.push({
                classGuid: utilService.readGuid(buf, currentPosition),
                typeInfoGuid: utilService.readGuid(buf, currentPosition + 4)
            });

            currentPosition += 0x14;
        }

        this.bytes(0x4, this._onClassStart);
    };

    _onClassStart(buf) {
        this._file.ebxt.refl.classCount = buf.readUInt32LE(0);
        this._file.ebxt.refl.classes = [];
        this.bytes(this._file.ebxt.refl.classCount * 0x10, this._onClassData);
    };

    _onClassData(buf) {
        let currentPosition = 0;

        for (let i = 0; i < this._file.ebxt.refl.classCount; i++) {
            this._file.ebxt.refl.classes.push({
                nameHash: buf.readUInt32LE(currentPosition),
                fieldStartIndex: buf.readUInt32LE(currentPosition + 4),
                fieldCount: buf.readUInt8(currentPosition + 8),
                alignment: buf.readUInt8(currentPosition + 9),
                type: buf.readUInt16LE(currentPosition + 10),
                size: buf.readUInt16LE(currentPosition + 12),
                headerSize: buf.readUInt16LE(currentPosition + 14)
            });

            currentPosition += 0x10;
        }

        this.bytes(4, this._onFieldsStart);
    };

    _onFieldsStart(buf) {
        this._file.ebxt.refl.fieldCount = buf.readUInt32LE(0);
        this._file.ebxt.refl.fields = [];

        streamLengthRemaining = (this._file.ebxt.refl.fieldCount * 0xC) - 65532;    // 65532, because each field is 12 bytes and that will ensure we don't split a field into two buffers.
        this.bytes(65532, this._onFieldData);
    };

    _onFieldData(buf) {
        let currentPosition = 0;

        for (let i = 0; i < (buf.length / 0xC); i++) {
            this._file.ebxt.refl.fields.push({
                nameHash: buf.readUInt32LE(currentPosition),
                offset: buf.readUInt32LE(currentPosition + 4),
                fieldType: buf.readUInt16LE(currentPosition + 8),
                fieldClassRef: buf.readUInt16LE(currentPosition + 10)
            });

            currentPosition += 0xC;
        }

        if (streamLengthRemaining > 0) {
            let bytesToRead = streamLengthRemaining > 65532 ? 65532 : streamLengthRemaining;
            streamLengthRemaining -= bytesToRead;

            this.bytes(bytesToRead, this._onFieldData);
        }
        else {
            this.bytes(0x4, this._onField2Start);
        }
    };

    _onField2Start(buf) {
        this._file.ebxt.refl.field2Count = buf.readUInt32LE(0);
        this._file.ebxt.refl.field2s = [];
        this.bytes(this._file.ebxt.refl.field2Count * 0xC, this._onField2Data);
    };

    _onField2Data(buf) {
        let currentPosition = 0;

        for (let i = 0; i < this._file.ebxt.refl.field2Count; i++) {
            this._file.ebxt.refl.field2s.push({
                nameHash: buf.readUInt32LE(currentPosition),
                unk1: buf.readUInt32LE(currentPosition + 4),
                unk2: buf.readUInt32LE(currentPosition + 8)
            });

            currentPosition += 12;
        }

        this.bytes(0x4, this._onField3Start);
    };

    _onField3Start(buf) {
        this._file.ebxt.refl.field3Count = buf.readUInt32LE(0);
        this._file.ebxt.refl.field3s = [];
        this.bytes(this._file.ebxt.refl.field3Count * 8, this._onField3Data);
    };

    _onField3Data(buf) {
        let currentPosition = 0;

        for (let i = 0; i < this._file.ebxt.refl.field3Count; i++) {
            this._file.ebxt.refl.field3s.push({
                nameHash: buf.readUInt32LE(currentPosition),
                offset: buf.readUInt32LE(currentPosition + 4)
            });

            currentPosition += 8;
        }

        this._parseFileObjects();
    };

    _parseFileObjects() {
        const refl = this.file.ebxt.refl;

        let list = new TypeDescriptorList();
        
        refl.classes.forEach((classEntry, index) => {
            const guidEntry = refl.classGuids[index];
            let type = new Type(classEntry.nameHash, classEntry.alignment, classEntry.type, classEntry.size, 
                classEntry.headerSize, guidEntry.classGuid, guidEntry.typeInfoGuid, index);

            for (let i = classEntry.fieldStartIndex; i < classEntry.fieldStartIndex + classEntry.fieldCount; i++) {
                const fieldEntry = refl.fields[i];

                let field = new Field(fieldEntry.nameHash, fieldEntry.offset, fieldEntry.fieldType, fieldEntry.fieldClassRef, i);
                type.addField(field);
            }

            list.addType(type);
        });
        
        this._file.types = list;
    }
};

module.exports = SharedTypeDescriptorParser;