class EBXDataObject {
    constructor() {
        this._type = null;
        this._classRef = 0;
        this._dataBuffer = null;
        this._typeInfoGuid = '';
        this._fields = {};
    };

    get type() {
        return this._type;
    };

    set type(type) {
        this._type = type;
    };

    get typeInfoGuid() {
        return this._typeInfoGuid;
    };

    set typeInfoGuid(guid) {
        this._typeInfoGuid = guid;
    };

    get dataBuffer() {
        return this._dataBuffer;
    };

    set dataBuffer(buf) {
        this._dataBuffer = buf;
    };

    get classRef() {
        return this._classRef;
    };

    set classRef(ref) {
        this._classRef = ref;
    };

    get fields() {
        return this._fields;
    };

    set fields(fields) {
        this._fields = fields;
    };

    get proxy() {
        const that = this;

        return new Proxy(this, {
            get: function (target, prop, receiver) {
                return that.fields[prop] !== undefined ? that.fields[prop].value : that[prop] !== undefined ? that[prop] : null;
            },
            set: function (target, prop, receiver) {
                if (that.fields[prop] !== undefined) {
                    that.fields[prop].value = receiver;
                }
                else {
                    that[prop] = receiver;
                }

                return true;
            }
        });
    };
};

module.exports = EBXDataObject;