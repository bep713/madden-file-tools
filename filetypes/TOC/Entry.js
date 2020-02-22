const Field = require('./Field');
const TOCData = require('./TOCData');

class Entry extends TOCData {
    constructor(dataStartIndex, parent) {
        super(dataStartIndex, parent);
        this._type = 0;
        this._fields = [];
    };

    get type () {
        return this._type;
    };

    set type (type) {
        this._type = type;
    };

    get fields () {
        return this._fields;
    };

    addField(field) {
        this._fields.push(field);

        Object.defineProperty(this, field.name, {
            get: function () {
              return field.value;
            }
        });
    };
};

module.exports = Entry;