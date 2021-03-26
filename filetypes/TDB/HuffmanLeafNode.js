class HuffmanLeafNode {
    constructor(value) {
        this._value = value;
        this._huffmanValue = 0;
    };

    get value() {
        return this._value;
    };

    get huffmanValue() {
        return this._huffmanValue;
    };

    set huffmanValue(val) {
        this._huffmanValue = val;
    };
};

module.exports = HuffmanLeafNode;