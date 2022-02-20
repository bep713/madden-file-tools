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

    get proxy() {
        const that = this;

        return new Proxy(this, {
            get: function (target, prop, receiver) {
                return that.ref.fields[prop] !== undefined ? that.ref.fields[prop].value : that[prop] !== undefined ? that[prop] : null;
            },
            set: function (target, prop, receiver) {
                if (that.ref.fields[prop] !== undefined) {
                    that.ref.fields[prop].value = receiver;
                }
                else {
                    that[prop] = receiver;
                }

                return true;
            }
        });
    };
};

EBXPointer.TYPES = {
    UNKNOWN: 0,
    INTERNAL: 1,
    EXTERNAL: 2
};

module.exports = EBXPointer;