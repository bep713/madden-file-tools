class HuffmanNode {
    constructor(index) {
        this._index = index;
        this._left = null;
        this._right = null;
    };

    get index() {
        return this._index;
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