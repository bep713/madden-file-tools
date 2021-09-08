class EBXData {
    constructor() {
        this._objects = [];
    };

    get objects() {
        return this._objects;
    };

    set objects(objects) {
        this._objects = objects;
    };

    get mainObject() {
        return this._objects[0];
    };
};

module.exports = EBXData;