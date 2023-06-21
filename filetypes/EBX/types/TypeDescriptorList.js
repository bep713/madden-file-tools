class TypeDescriptorList {
    constructor() {
        this[Symbol.toStringTag] = 'TypeDescriptorList';
        
        this._types = [];
        this._classGuids = [];
        this._typeHashTableLookup = {};
    };

    addType(type) {
        this._types.push(type);
        this._typeHashTableLookup[type.nameHash] = type;
    };

    getTypeByName(name) {
        return this._types.find((type) => { return type.name === name; });
    };

    getTypeByHash(hash) {
        return this._typeHashTableLookup[hash];
    };

    getTypeByTypeInfoGuid(guid) {
        return this._types.find((type) => { return type.typeInfoGuid === guid; });
    };

    getTypeByClassGuid(guid) {
        return this._types.find((type) => { return type.classGuid === guid; });
    };

    getTypeByIndex(index) {
        return this._types[index];
    };

    getFieldsByTypeHash(hash) {
        return this.getTypeByHash(hash).fields;
    };

    get types() {
        return this._types;
    };

    get classGuids() {
        return this._classGuids;
    };

    set classGuids(guids) {
        this._classGuids = guids;
    };
};

module.exports = TypeDescriptorList;