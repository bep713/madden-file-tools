class SimpleParser 
{
    constructor(buffer) 
    {
        this._buffer = buffer;
        this._offset = 0;
    }

    get buffer()
    {
        return this._buffer;
    }

    set buffer(buffer)
    {
        this._buffer = buffer;
        this._offset = 0;
    }

    get offset()
    {
        return this._offset;
    }

    set offset(offset)
    {
        this._offset = offset;
    }

    readBytes(length) 
    {
        const bytes = this._buffer.subarray(this._offset, this._offset + length);
        this._offset += length;
        return bytes;
    }

    readByte()
    {
        return this._buffer.subarray(this._offset++, this._offset);
    }

    pad(alignment)
	{
		while(this._offset % alignment !== 0)
		{
			this._offset++;
		}
	}

};

module.exports = {
    SimpleParser
};