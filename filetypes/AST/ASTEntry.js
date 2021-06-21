class ASTEntry {
    constructor(schema) {
        this._schema = schema;
        this._index = 0;
        this._id = null;
        this._startPosition = 0;
        this._fileSize = 0;
        this._uncompressedSize = 0;
        this._offsetShift = 0;
        this._data = null;
        this._dataStream = null;
        this._gap = 0;
        this._unknown1 = 0;
        this._unknown2 = 0;
        this._description = null;
        this._descriptionString = '';
        this._isChanged = false;
        this._isCompressed = false;

        this._originalId = null;
        this._originalStartPosition = null;
        this._originalFileSize = null;
        this._originalGap = 0;
        this._originalUnknown1 = null;
        this._originalUnknown2 = null;
        this._originalStartPositionInFile = 0;
        this._originalFileSizeInt = 0;
    };

    get index() {
        return this._index;
    };

    set index(index) {
        this._index = index;
    };

    get id() {
        return this._id;
    };

    get fullId() {
        return this._id.readBigUInt64LE(0);
    };

    get shortId() {
        return this._id.readUIntLE(0, 4);
    };

    set shortId(id) {
        if (!this._id) {
            this._id = Buffer.alloc(8);
        }

        this._id.writeUInt32LE(id);
        this._isChanged = true;
    };

    set fullId(id) {
        if (!this._id) {
            this._id = Buffer.alloc(8);
        }

        if (!(id instanceof BigInt)) {
            id = BigInt(id);
        }

        this._id.writeBigUInt64LE(id);
        this._isChanged = true;
    };

    set id(id) {
        if (!this._id) {
            this._originalId = id;
        }

        this._id = id;
        this._isChanged = true;
    };

    get startPosition() {
        return this._startPosition;
    };

    get startPositionInt() {
        return this._startPosition.readUIntLE(0, this._startPosition.length);
    };

    get startPositionInFile() {
        return lshift(this.startPositionInt, this._offsetShift);
    };

    set startPosition(startPosition) {
        if (!this._startPosition) {
            this._originalStartPosition = startPosition;
        }

        this._startPosition = startPosition;
        this._isChanged = true;
    };

    set startPositionInt(startPositionInt) {
        this._startPosition = Buffer.alloc(this._schema.startPosition.length);
        this._startPosition.writeUIntLE(startPositionInt, 0, this._schema.startPosition.length);
        this._isChanged = true;
    };

    get fileSize() {
        return this._fileSize;
    };

    get fileSizeInt() {
        return this._fileSize.readUIntLE(0, this._fileSize.length);
    };

    set fileSize(fileSize) {
        if (!this._fileSize) {
            this._originalFileSize = fileSize;
        }

        this._fileSize = fileSize;
        this._isChanged = true;
    };

    set fileSizeInt(fileSize) {
        this._fileSize = Buffer.alloc(this._schema.fileSize.length);
        this._fileSize.writeUIntLE(fileSize, 0, this._schema.fileSize.length);
        this._isChanged = true;
    };

    get data() {
        return this._data;
    };

    set data(data) {
        this._data = data;
        this.fileSizeInt = data.length;
        this._isChanged = true;
    };

    get gap() {
        return this._gap;
    };

    set gap(gap) {
        if (!this._gap) {
            this._originalGap = gap;
        }

        this._gap = gap;
        this._isChanged = true;
    };

    get unknown1() {
        return this._unknown1;
    };

    set unknown1(unknown1) {
        if (!this._unknown1) {
            this._originalUnknown1 = unknown1;
        }

        this._unknown1 = unknown1;
        this._isChanged = true;
    };

    get unknown2() {
        return this._unknown2;
    };

    set unknown2(unknown2) {
        if (!this._unknown2) {
            this._originalUnknown2 = unknown2;
        }

        this._unknown2 = unknown2;
        this._isChanged = true;
    };

    get schema() {
        return this._schema;
    };

    set schema(schema) {
        this._schema = schema;
    };

    get isChanged() {
        return this._isChanged;
    };

    set isChanged(isChanged) {
        this._isChanged = isChanged;
    };

    get originalId() {
        return this._originalId;
    };

    get originalStartPosition() {
        return this._originalStartPosition;
    };

    get originalStartPositionInFile() {
        return lshift(this._originalStartPosition.readUIntLE(0, this._startPosition.length), this._offsetShift);
    };

    get originalFileSize() {
        return this._originalFileSize;
    };

    get originalFileSizeInt() {
        return this._originalFileSize.readUIntLE(0, this._originalFileSize.length);
    };

    get originalUnknown1() {
        return this._originalUnknown1;
    };

    get originalUnknown2() {
        return this._originalUnknown2;
    };

    get originalGap() {
        return this._originalGap;
    };

    get uncompressedSize() {
        return this._uncompressedSize;
    };

    set uncompressedSize(size) {
        if (!this.uncompressedSize) {
            this._originalUncompressedSize = size;
        }

        this._uncompressedSize = size;
        this._isChanged = true;
    };

    get uncompressedSizeInt() {
        return this._uncompressedSize.readUIntLE(0, this._uncompressedSize.length);
    };

    get offsetShift() {
        return this._offsetShift;
    };

    set offsetShift(shift) {
        this._offsetShift = shift;
    };

    get description() {
        return this._description
    };

    set description(description) {
        this._description = description;
    };

    get descriptionString() {
        return this._description.toString().replace(/\0[\s\S]*$/g,'');
    };

    get isCompressed() {
        return this._uncompressedSize ? this._uncompressedSize.length > 0 && this.uncompressedSizeInt > 0 : false;
    };

};

module.exports = ASTEntry;

function lshift(num, bits) {
    return num * Math.pow(2, bits);
};