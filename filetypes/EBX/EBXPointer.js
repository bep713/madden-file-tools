class EBXPointer {
    constructor(type, ref) {
        this._type = type;
        this._ref = ref;
    };

    get type() {
        return this._type;
    };

    set type(type) {
        this._type = type;
    };

    get ref() {
        return this._ref;
    };

    set ref(ref) {
        this._ref = ref;
    };
};

EBXPointer.TYPES = {
    UNKNOWN: 0,
    INTERNAL: 1,
    EXTERNAL: 2
};

module.exports = EBXPointer;