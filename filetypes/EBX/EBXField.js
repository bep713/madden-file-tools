class EBXField {
    constructor(field, ebxDataOffset) {
        this._field = field;
        this._ebxDataOffset = ebxDataOffset;

        this._value = null;
        this._isChanged = false;
        this._valueOffset = 0;  // used by lists, pointers, strings at the ebxDataOffset to point to where the actual value is stored in the EBX.
        this._arrayCount = 0;
    };

    get field() {
        return this._field;
    };

    set field(field) {
        this._field = field;
    };

    get ebxDataOffset() {
        return this._ebxDataOffset;
    };

    set ebxDataOffset(offset) {
        this._ebxDataOffset = offset;
    };

    get value() {
        return this._value;
    };

    set value(value) {
        this._value = value;
        this._isChanged = true;
    };

    get isChanged() {
        return this._isChanged;
    };

    set isChanged(isChanged) {
        this._isChanged = isChanged;
    };

    get valueOffset() {
        return this._valueOffset;
    };

    set valueOffset(valueOffset) {
        this._valueOffset = valueOffset;
        this._isChanged = true;
    };

    get arrayCount() {
        return this._arrayCount;
    };

    set arrayCount(count) {
        this._arrayCount = count;
        this._isChanged = true;
    };
};

module.exports = EBXField;