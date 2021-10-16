const EBXField = require('../../filetypes/EBX/EBXField');
const utilService = require('../../services/utilService');
const EBXFieldTypes = require('../../filetypes/EBX/EBXFieldTypes');
const EBXDataObject = require('../../filetypes/EBX/EBXDataObject');
const EBXData = require('../../filetypes/EBX/EBXData');
const EBXPointer = require('../../filetypes/EBX/EBXPointer');
const EBXResourceReference = require('../../filetypes/EBX/EBXResourceReference');

class EBXDataReader {
    constructor(types) {
        this._types = types;

        this._buf = null;
        this._file = null;
        this._pointersToResolve = [];
    };

    readEbxData(ebxFile) {
        this._file = ebxFile;
        let data = new EBXData();

        ebxFile.ebx.efix.dataOffsets.forEach((offset, index) => {
            let dataObject = new EBXDataObject();

            this._buf = ebxFile.ebx.ebxd.rawDataBlock;
            const classRef = this._buf.readUInt32LE(offset - 16);   // subtract 16 because the buffer starts directly at the offset, not at the actual data block start.
            const typeInfoGuid = ebxFile.ebx.efix.typeInfoGuids[classRef];
            const type = this._types.getTypeByTypeInfoGuid(typeInfoGuid);

            if (type._name === 'ChunkFileCollector') {
                console.log(ebxFile.name);
            }

            dataObject.dataBuffer = this._buf;
            dataObject.classRef = classRef;
            dataObject.typeInfoGuid = typeInfoGuid;
            dataObject.type = type;

            // console.log(`Type: ${type.name} @ offset: ${offset.toString(16)}`);

            dataObject.fields = this._readFields(type, offset - 16);
            data.objects.push(dataObject.proxy); 
        });

        return data;
    };

    _readFields(type, offset = 0) {
        let obj = {};

        type.fields.forEach((field) => {
            let fieldObj = new EBXField(field);
            fieldObj.ebxDataOffset = field.offset + offset;

            // console.log(`Field: ${field.name} @ offset: ${fieldObj.ebxDataOffset.toString(16)}`);

            if (field.type === EBXFieldTypes.Inherited) {
                const inheritedType = this._types.getTypeByIndex(field.classRef);
                obj = { ...obj, ...this._readFields(inheritedType, offset) };
            }
            else if (field.isArray) {
                fieldObj.valueOffset = this._buf.readInt32LE(fieldObj.ebxDataOffset);
                fieldObj.arrayCount = this._buf.readUInt32LE(fieldObj.ebxDataOffset + fieldObj.valueOffset - 4);
                fieldObj.value = [];

                let currentPosition = (fieldObj.ebxDataOffset + fieldObj.valueOffset);
                let fieldSize = 0;

                switch (field.type) {
                    case EBXFieldTypes.Struct:
                        fieldSize = this._types.getTypeByIndex(field.classRef).size;
                        break;

                    case EBXFieldTypes.Long:
                    case EBXFieldTypes.Pointer:
                    case EBXFieldTypes.Float64:
                    case EBXFieldTypes.UnsignedLong:
                        fieldSize = 8;
                        break;

                    case EBXFieldTypes.Guid:
                        fieldSize = 16;
                        break;

                    case EBXFieldTypes.Byte:
                    case EBXFieldTypes.Boolean:
                    case EBXFieldTypes.UnsignedByte:
                        fieldSize = 1;
                        break;

                    case EBXFieldTypes.Sha1:
                        fieldSize = 20;
                        break;

                    case EBXFieldTypes.Short:
                    case EBXFieldTypes.UnsignedShort:
                        fieldSize = 2;
                        break;
                    
                    default:
                        fieldSize = 4;
                        break;
                }

                for (let i = 0; i < fieldObj.arrayCount; i++) {
                    let arrayFieldObj = new EBXField(fieldObj.field, currentPosition + (i * fieldSize));
                    // console.log(currentPosition + (i * fieldSize));
                    this._readField(arrayFieldObj, currentPosition + (i * fieldSize));
                    fieldObj.value.push(arrayFieldObj.value);
                }
            }
            else {
                this._readField(fieldObj, fieldObj.ebxDataOffset);
            }
            
            obj[field.name] = fieldObj;

            // let logMessage = `Field: ${field.name} @ offset: ${fieldObj.ebxDataOffset.toString(16)}.`;

            if (fieldObj.value) {
                // logMessage += ` Value: ${fieldObj.value}`;
            }

            // console.log(logMessage);
        });
        
        return obj;
    };

    _readField(fieldObj) {
        switch (fieldObj.field.type) {
            case EBXFieldTypes.Struct:
                let structDataObject = new EBXDataObject();

                const structType = this._types.getTypeByIndex(fieldObj.field.classRef);
                structDataObject.type = structType;

                // console.log(`Struct: ${structType.name} @ offset: ${fieldObj.ebxDataOffset.toString(16)}`);

                structDataObject.fields = this._readFields(structType, fieldObj.ebxDataOffset);
                fieldObj.value = structDataObject.proxy;
                break;

            case EBXFieldTypes.Pointer:
                const pointerOffset = this._buf.readInt32LE(fieldObj.ebxDataOffset);
                if (pointerOffset === 0) {
                    fieldObj.value = new EBXPointer(EBXPointer.TYPES.UNKNOWN, null);
                }
                else if (pointerOffset > 0 && pointerOffset  < 10) {
                    const ref = this._file.ebx.efix.importReferences[Math.floor(pointerOffset / 2)];
                    fieldObj.value = new EBXPointer(EBXPointer.TYPES.EXTERNAL, ref);
                }
                else {
                    const dataOffsetToLookup = (fieldObj.ebxDataOffset + pointerOffset) + 16;
                    const ref = this._file.ebx.efix.dataOffsets.findIndex((offset) => { return offset === dataOffsetToLookup; });
                    fieldObj.value = new EBXPointer(EBXPointer.TYPES.INTERNAL, ref);
                }

                break;

            case EBXFieldTypes.Array:
                break;

            case EBXFieldTypes.CString:
                fieldObj.valueOffset = this._buf.readUInt32LE(fieldObj.ebxDataOffset);
                fieldObj.value = readCString(this._buf, fieldObj.ebxDataOffset + fieldObj.valueOffset);
                break;

            case EBXFieldTypes.Enum:
                fieldObj.value = this._buf.readInt32LE(fieldObj.ebxDataOffset);
                break;

            case EBXFieldTypes.Boolean:
                fieldObj.value = !!(this._buf.readUInt8(fieldObj.ebxDataOffset));
                break;

            case EBXFieldTypes.UnsignedByte:
                fieldObj.value = this._buf.readUInt8(fieldObj.ebxDataOffset);
                break;
                
            case EBXFieldTypes.Short:
                fieldObj.value = this._buf.readInt16LE(fieldObj.ebxDataOffset);
                break;

            case EBXFieldTypes.UnsignedShort:
                fieldObj.value = this._buf.readUInt16LE(fieldObj.ebxDataOffset);
                break;

            case EBXFieldTypes.Integer:
                fieldObj.value = this._buf.readInt32LE(fieldObj.ebxDataOffset);
                break;

            case EBXFieldTypes.UnsignedInteger:
                fieldObj.value = this._buf.readUInt32LE(fieldObj.ebxDataOffset);
                break;

            case EBXFieldTypes.UnsignedLong:
                fieldObj.value = this._buf.readBigUInt64LE(fieldObj.ebxDataOffset);
                break;

            case EBXFieldTypes.Long:
                fieldObj.value = this._buf.readBigInt64LE(fieldObj.ebxDataOffset);
                break;

            case EBXFieldTypes.Float32:
                fieldObj.value = Math.round(100 * this._buf.readFloatLE(fieldObj.ebxDataOffset)) / 100;
                break;

            case EBXFieldTypes.Float64:
                fieldObj.value = Math.round(100 * this._buf.readFloatLE(fieldObj.ebxDataOffset)) / 100;
                break;

            case EBXFieldTypes.Guid:
                fieldObj.value = utilService.readGuid(this._buf, fieldObj.ebxDataOffset);
                break;

            case EBXFieldTypes.Sha1:
                fieldObj.value = this._buf.slice(fieldObj.ebxDataOffset, fieldObj.ebxDataOffset + 20);
                break;

            case EBXFieldTypes.ResourceReference:
                fieldObj.value = new EBXResourceReference(this._buf.readBigUInt64LE(fieldObj.ebxDataOffset));
                break;

            case EBXFieldTypes.TypeReference:
                fieldObj.value = this._buf.readUInt32LE(fieldObj.ebxDataOffset);
                break;

            default:
                console.log('No definition for field type: ', fieldObj.field.type);
        }
    }
};

module.exports = EBXDataReader;

function readCString(buf, offset) {
    let currentPosition = offset;
    let currentByte = buf.readUInt8(currentPosition);

    while (currentByte != 0) {
        currentPosition += 1;
        currentByte = buf.readUInt8(currentPosition);
    }

    return buf.toString('utf8', offset, currentPosition);
};