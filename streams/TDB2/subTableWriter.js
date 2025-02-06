const utilService = require('../../services/utilService');

// Field type constants
const FIELD_TYPE_INT = 0;
const FIELD_TYPE_STRING = 1;
const FIELD_TYPE_ARRAY = 4;
const FIELD_TYPE_FLOAT = 10;

function write(table)
{
	let buffers = [];
	
	// Iterate through each record in the subtable
	for(let record of table.records)
	{
		// If the table is a visuals table, write the record index
		
		// Iterate through each field in the record
		for(let fieldKey of Object.keys(record.fields))
		{
			const field = record.fields[fieldKey];
			// Write the field key
			buffers.push(field.rawKey);

			// If the field is an array, write the subtable info and recursively write the subtable
			if(field.type === FIELD_TYPE_ARRAY)
			{
				buffers.push(Buffer.from([field.value.unknown1]));
				buffers.push(field.value.numEntriesRaw);
				buffers.push(write(field.value));
			}
			else
			{
				// Write the field raw data, including string length for string fields
				if(field.type === FIELD_TYPE_STRING)
				{
					buffers.push(utilService.writeModifiedLebCompressedInteger(field.length));
				}
				buffers.push(field.raw);
			}
		}

		// Write the record terminator
		buffers.push(Buffer.from([0x00]));
	}

	return Buffer.concat(buffers);
}

module.exports = { write };

