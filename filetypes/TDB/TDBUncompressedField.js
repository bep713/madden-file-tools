const TDBExtraDataField = require("./TDBExtraDataField");

class TDBUncompressedField extends TDBExtraDataField {
    constructor() {
        super();
    };

    get value() {
        if (this.extraDataBuffer) {
            return this.extraDataBuffer.toString('utf8', this.offsetLength).replace(/\0/g, '');
        }
        else {
            return '';
        }
    };

    set value(value) {
        const offsetBuffer = Buffer.alloc(this.offsetLength);
        offsetBuffer.writeIntBE(value.length, 0, this.offsetLength);

        let strHexArray = value.split('').map((char) => {
            return char.charCodeAt(0);
        });

        this.extraDataBuffer = Buffer.concat([offsetBuffer, Buffer.from(strHexArray)]);
        this.extraDataOffset = value.length;
        this._isChanged = true;
    };
};

module.exports = TDBUncompressedField;