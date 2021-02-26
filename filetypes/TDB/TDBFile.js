const File = require('../abstract/File');

class TDBFile extends File {
    constructor() {
        super();
        this[Symbol.toStringTag] = 'TDBFile';

        this._definitions = [];
        this._tables = [];

        this._definitionBuffer = null;
        this._headerBuffer = null;
        this._eofCrcBuffer = null;
    };

    get definitions() {
        return this._definitions;
    };

    set definitions(definitions) {
        this._definitions = definitions;
    };

    get tables() {
        return this._tables;
    };

    addTable(table) {
        this._tables.push(table);
        this._assignReflectiveProperty(table);
    };

    _assignReflectiveProperty(table) {
        Object.defineProperty(this, table.name, {
            get: function () {
                return table;
            }
        });
    };

    set tables(tables) {
        this._removeOldTableProperties();
        this._tables = tables;

        this._tables.forEach((table) => {
            this._assignReflectiveProperty(table);
        });
    };

    _removeOldTableProperties() {
        this._tables.forEach((table) => {
            delete this[table.name];
        });
    };

    get definitionBuffer() {
        return this._definitionBuffer;
    };

    set definitionBuffer(buffer) {
        this._definitionBuffer = buffer;
    };

    get headerBuffer() {
        return this._headerBuffer;
    };

    set headerBuffer(buffer) {
        this._headerBuffer = buffer;
    };

    get eofCrcBuffer() {
        return this._eofCrcBuffer;
    };

    set eofCrcBuffer(buffer) {
        this._eofCrcBuffer = buffer;
    };
};

module.exports = TDBFile;