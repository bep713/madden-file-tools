class EBXResourceReference {
    constructor(resourceId) {
        this._resourceId = resourceId;
    };
    
    get resourceId() {
        return this._resourceId;
    };

    set resourceId(resourceId) {
        this._resourceId = resourceId;
    };
};

module.exports = EBXResourceReference;