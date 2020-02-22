class TOCData {
    constructor(dataStartIndex, parent) {
        this._startIndex = dataStartIndex;
        this._parent = parent;
        this._size = 0;
        this._leb = null;
    };

    get leb() {
        return this._leb;
    };

    set leb (leb) {
        this._leb = leb;
        this._size = leb.value.readUIntLE(0, leb.value.length);
    };

    get size () {
        return this._size;
    };

    get startIndex () {
        return this._startIndex;
    };

    set startIndex (startIndex) {
        this._startIndex = startIndex;
    };

    get endIndex () {
        return this._startIndex + this.size;
    };

    get parent () {
        return this._parent;
    };
};

module.exports = TOCData;