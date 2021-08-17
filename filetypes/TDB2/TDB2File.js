const File = require('../abstract/File');

class TDB2File extends File {
    constructor() {
        super();
        this[Symbol.toStringTag] = 'TDB2File';

        this._definitions = [];
        this._tables = [];
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
};

module.exports = TDB2File;