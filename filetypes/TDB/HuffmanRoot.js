class HuffmanRoot {
    constructor() {
        this._index = 0;
        this._lookupTable = {};
        this._huffmanValue = '';
    };

    get lookupTable() {
        return this._lookupTable;
    };

    set lookupTable(table) {
        this._lookupTable = table;
    };

    get huffmanValue() {
        return this._huffmanValue;
    };
};

module.exports = HuffmanRoot;