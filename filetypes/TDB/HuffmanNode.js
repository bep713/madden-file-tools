class HuffmanNode {
    constructor(index) {
        this._index = index;
        this._huffmanValue = 0;
        this._left = null;
        this._right = null;
    };

    get index() {
        return this._index;
    };

    get huffmanValue() {
        return this._huffmanValue;
    };

    set huffmanValue(val) {
        this._huffmanValue = val;
    };

    set left(node) {
        this._left = node;
    };

    get left() {
        return this._left;
    };

    set right(node) {
        this._right = node;
    };

    get right() {
        return this._right;
    };
};

module.exports = HuffmanNode;