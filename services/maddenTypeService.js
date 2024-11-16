const memoryjs = require('memoryjs');

let maddenTypeService = {};
maddenTypeService.processName = '';
maddenTypeService.processObj = {};

maddenTypeService.parseTypes = async (processName) => {
    maddenTypeService.processName = processName;
    const processObj = await openProcess(processName);
    maddenTypeService.processObj = processObj;

    const typeInfoSig = await findPattern(processObj.handle, processName, '48 39 1D ? ? ? ? ? ? 48 8b 43 10', memoryjs.NORMAL, 0, 0);
    const typeInfoOffset = await readMemory(processObj.handle, typeInfoSig + 3, memoryjs.UINT32);
    const typeInfoStartAddress = await readMemory(processObj.handle, typeInfoSig + 7 + typeInfoOffset, memoryjs.UINT64);
    
    let offset = typeInfoStartAddress;
    let classes = [];

    while (offset !== 0) {
        const parsedClass = await maddenTypeService.parseClass(offset);
        classes.push(parsedClass);
        offset = parsedClass.nextOffset;
    }

    maddenTypeService.types = classes;

    return classes;
};

maddenTypeService.parseClass = async (offset) => {
    const typeOffset = await readMemory(maddenTypeService.processObj.handle, offset, memoryjs.UINT64);
    const nextTypeOffset = await readMemory(maddenTypeService.processObj.handle, offset + 16, memoryjs.UINT64);
    const type = await maddenTypeService.parseType(typeOffset);

    return {
        type: type,
        nextOffset: nextTypeOffset
    }
};

maddenTypeService.parseType = async (offset) => {
    const nameOffset = await readMemory(maddenTypeService.processObj.handle, offset, memoryjs.UINT64);
    const name = await readMemory(maddenTypeService.processObj.handle, nameOffset, memoryjs.STRING);
    
    const nameHash = await readMemory(maddenTypeService.processObj.handle, offset + 8, memoryjs.UINT32);

    const typeRaw = await readMemory(maddenTypeService.processObj.handle, offset + 12, memoryjs.SHORT);
    const type = typeRaw >> 5 & 0x1F;

    let fieldOffsetPosition = offset + 40;
    let shouldReadFields = false;

    switch (type) {
        case 2:
            fieldOffsetPosition = await readMemory(maddenTypeService.processObj.handle, offset + 104, memoryjs.UINT64);
            shouldReadFields = true;
            break;
        case 3:
            fieldOffsetPosition = await readMemory(maddenTypeService.processObj.handle, offset + 64, memoryjs.UINT64);
            shouldReadFields = true;
            break;
        case 8:
            const readPos = maddenTypeService.processName === 'Madden25.exe' ? offset + 64 : offset + 56;
            fieldOffsetPosition = await readMemory(maddenTypeService.processObj.handle, readPos, memoryjs.UINT64);

            if (fieldOffsetPosition !== 0) {
                shouldReadFields = true;
            }
            break;
        default:
            break;
    }

    const fieldCount = await readMemory(maddenTypeService.processObj.handle, offset + 50, memoryjs.SHORT);
    let fields = [];

    if (shouldReadFields) {
        const fieldLength = maddenTypeService.processName === 'Madden25.exe' ? 32 : 24;
        for (let i = 0; i < fieldCount; i++) {
            const field = await maddenTypeService.parseField(fieldOffsetPosition + (i * fieldLength));
            fields.push(field);
        }
    }

    return {
        name: name,
        nameHash: nameHash,
        fields: fields 
    };
};

maddenTypeService.parseField = async (offset) => {
    const nameOffset = await readMemory(maddenTypeService.processObj.handle, offset, memoryjs.UINT64);
    const name = await readMemory(maddenTypeService.processObj.handle, nameOffset, memoryjs.STRING);

    const nameHash = await readMemory(maddenTypeService.processObj.handle, offset + 8, memoryjs.UINT32);

    return {
        name: name,
        nameHash: nameHash
    };
};

maddenTypeService.loadTypesFromFile = (file) => {
    maddenTypeService.types = require(file);
};

maddenTypeService.getTypeByName = (name) => {
    return maddenTypeService.types.find((type) => { return type.type.name === name; }).type;
};

maddenTypeService.getTypeByHash = (hash) => {
    return maddenTypeService.types.find((type) => { return type.type.nameHash === hash; }).type;
};

maddenTypeService.getFieldByHash = (hash) => {
    const typesWithFields = maddenTypeService.types.filter((type) => { return type.type.fields.length > 0; });

    for (let i = 0; i < typesWithFields.length; i++) {
        const field = typesWithFields[i].type.fields.find((field) => { return field.nameHash === hash; });

        if (field) {
            return field;
        }
    }

    return null;
};

maddenTypeService.mergeTypes = (sharedTypeDescriptors) => {
    // console.log(sharedTypeDescriptors);

    maddenTypeService.types.forEach((type) => {
        const hash = type.type.nameHash;
        const stdType = sharedTypeDescriptors.getTypeByHash(hash);

        if (stdType) {
            stdType.name = type.type.name;
    
            type.type.fields.forEach((field) => {
                const fieldHash = field.nameHash;
                const stdField = stdType.getFieldByHash(fieldHash);
                
                if (stdField) {
                    stdField.name = field.name;
                }
            });
        }
    });
};

module.exports = maddenTypeService;

function openProcess(processName) {
    return new Promise((resolve, reject) => {
        memoryjs.openProcess(processName, (err, processObj) => {
            if (err) {
                reject(err);
            }

            resolve(processObj);
        });
    });
};

function findPattern(handle, processName, pattern, signatureType, patternOffset, addressOffset) {
    return new Promise((resolve, reject) => {
        memoryjs.findPattern(handle, processName, pattern, signatureType, patternOffset, addressOffset, (err, offset) => {
            if (err) {
                reject(err);
            }

            resolve(offset);
        });
    });
};

function readMemory(handle, address, dataType) {
    return new Promise((resolve, reject) => {
        memoryjs.readMemory(handle, address, dataType, (err, value) => {
            if (err) {
                reject(err);
            }

            resolve(value);
        });
    });
};