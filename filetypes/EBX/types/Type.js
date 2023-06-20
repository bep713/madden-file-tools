class Type {
    constructor(nameHash, alignment, type, size, headerSize, classGuid, typeInfoGuid, index) {
        this._fields = [];
        this._fieldHashTableLookup = {};
        this._nameHash = nameHash,
        this._alignment = alignment;
        this._rawType = type;
        this._type = type >> 5 & 0x1F;
        this._size = size;
        this._headerSize = headerSize;
        this._classGuid = classGuid;
        this._typeInfoGuid = typeInfoGuid;
        this._index = index;
        this._name = '';
        this._isInPatch = false;
    };

    addField(field) {
        this._fields.push(field);
        this._fieldHashTableLookup[field.nameHash] = field;
    };

    getFieldByName(name) {
        return this._fields.find((field) => { return field.name === name; });
    };

    getFieldByHash(nameHash) {
        return this._fieldHashTableLookup[nameHash];
    };

    get fields() {
        return this._fields;
    };

    get nameHash() {
        return this._nameHash;
    };

    set nameHash(hash) {
        this._nameHash = hash;
    };

    get alignment() {
        return this._alignment;
    };

    set alignment(alignment) {
        this._alignment = alignment;
    };

    get type() {
        return this._type;
    };

    set type(type) {
        this._type = type;
    };

    get size() {
        return this._size;
    };

    set size(size) {
        this._size = size;
    };

    get headerSize() {
        return this._headerSize;
    };

    set headerSize(headerSize) {
        this._headerSize = headerSize;
    };

    get index() {
        return this._index;
    };

    set index(index) {
        this._index = index;
    };

    get classGuid() {
        return this._classGuid;
    };

    set classGuid(guid) {
        this._classGuid = guid;
    };

    get typeInfoGuid() {
        return this._typeInfoGuid;
    };

    set typeInfoGuid(guid) {
        this._typeInfoGuid = guid;
    };

    get name() {
        return this._name;
    };

    set name(name) {
        this._name = name;
    };

    get isInPatch() {
        return this._isInPatch;
    };

    set isInPatch(patch) {
        this._isInPatch = patch;
    };
};

module.exports = Type;