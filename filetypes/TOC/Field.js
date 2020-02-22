const TOCData = require('./TOCData');

class Field extends TOCData {
    constructor(dataStartIndex, parent) {
        super(dataStartIndex, parent);
        this._name = '';
        this._value = null;
        this._dataType = null;
    };

    get name () {
        return this._name;
    };

    set name (name) {
        this._name = name;
    };

    get value () {
        return this._value;
    };

    set value (value) {
        this._value = value;
    };

    get dataType () {
        return this._dataType;
    };

    set dataType (dataType) {
        this._dataType = dataType;
    };
};

module.exports = Field;