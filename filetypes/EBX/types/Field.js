class Field {
    constructor(nameHash, offset, type, classRef, index) {
        this._nameHash = nameHash;
        this._offset = offset;
        this._rawType = type;
        this._type = type >> 5 & 0x1F;
        this._isArray = !!((type & 0xF) === 9);
        this._classRef = classRef;
        this._index = index;
        this._name = '';
    };

    get nameHash() {
        return this._nameHash;
    };

    set nameHash(hash) {
        this._nameHash = hash;
    };

    get offset() {
        return this._offset;
    };

    set offset(offset) {
        this._offset = offset;
    };

    get type() {
        return this._type;
    };

    set type(type) {
        this._type = type;
    };

    get classRef() {
        return this._classRef;
    };

    set classRef(classRef) {
        this._classRef = classRef;
    };

    get index() {
        return this._index;
    };

    set index(index) {
        this._index = index;
    };

    get name() {
        return this._name;
    };

    set name(name) {
        this._name = name;
    };

    get isArray() {
        return this._isArray;
    };

    set isArray(isArray) {
        this._isArray = isArray;
    };
};

module.exports = Field;