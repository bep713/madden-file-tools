const sjcl = require('./sjcl/sjcl');
const { BitView } = require('bit-buffer');

let utilService = {};

utilService.intersection = function (arrayOfArrays) {
  return arrayOfArrays
      .reduce((acc,array,index) => { // Intersect arrays
          if (index === 0)
              return array;
          return array.filter((value) => acc.includes(value));
      }, [])
      .filter((value, index, self) => self.indexOf(value) === index) // Make values unique
  ;
};

utilService.dec2bin = function (dec, len) {
  const bin = (dec >>> 0).toString(2);
  if (len) return bin.padStart(len, '0');
  return bin;
};

utilService.bin2dec = function (a, bstart, blength) {
  return sjcl.bitArray.extract(a, bstart, blength);
};

utilService.bin2Float = function (binary) {
  if (!utilService.isString(binary)) { throw new Error(`Argument invalid - must be of type string. You passed in a ${typeof binary}.`)}
  else if (!utilService.stringOnlyContainsBinaryDigits(binary)) { throw new Error(`Argument invalid - string must only contain binary digits.`)}
  
  const buffer = Buffer.from(utilService.bin2hex(binary), 'hex');

  if (buffer.length >= 4) {
    return buffer.readFloatBE(0);
  } else {
    return 0;
  }
};

utilService.float2Bin = function (float) {
  const getHex = i => ('00' + i.toString(16)).slice(-2);

  var view = new DataView(new ArrayBuffer(4)),
      result;

  view.setFloat32(0, float);

  result = Array
      .apply(null, { length: 4 })
      .map((_, i) => getHex(view.getUint8(i)))
      .join('');

  return utilService.hex2bin(result).padStart(32, '0');
};

utilService.uintToInt = function (uint, nbit) {
  nbit = +nbit || 32;
  if (nbit > 32) throw new RangeError('uintToInt only supports ints up to 32 bits');
  uint <<= 32 - nbit;
  uint >>= 32 - nbit;
  return uint;
};

utilService.hex2bin = function (hex) {
  return (parseInt(hex, 16).toString(2)).padStart(8, '0');
};

utilService.bin2hex = function (bin) {
  return parseInt(bin, 2).toString(16).padStart(2, '0').toUpperCase();
};

utilService.chunk = function (str, n) {
  var ret = [];
  var i;
  var len;

  for(i = 0, len = str.length; i < len; i += n) {
      ret.push(str.substr(i, n))
  }

  return ret;
};

utilService.binaryBlockToHexBlock = function (binary) {
  const byteArray = utilService.chunk(binary, 8);

  let bytes = [];
  
  byteArray.forEach((byte) => {
    const hex = utilService.bin2hex(byte);

    if (hex) {
      bytes.push(hex); 
    }
  });

  return bytes;
};

utilService.binaryBlockToDecimalBlock = function (binary) {
  const byteArray = utilService.chunk(binary, 8);

  let bytes = [];
  
  byteArray.forEach((byte) => {
    const dec = utilService.bin2dec(byte);

    if (dec !== null && dec !== undefined) {
      bytes.push(dec);
    }
  });

  return bytes;
};

utilService.getBitArray = function (data) {
  return sjcl.codec.bytes.toBits(data);
};

utilService.replaceAt = function (oldValue, index, value) {
  if (index < 0) { throw new Error('Index must be a positive number.'); }
  return oldValue.substr(0, index) + value + oldValue.substr(index + value.length);
};

utilService.byteArrayToLong = function(byteArray, reverse) {
  let newByteArray;

  if (Buffer.isBuffer(byteArray)) {
    newByteArray = Buffer.from(byteArray);
  } else {
    newByteArray = byteArray.slice();
  }

  if (reverse) {
    newByteArray = newByteArray.reverse();
  }
  
  var value = 0;
  for ( var i = newByteArray.length - 1; i >= 0; i--) {
      value = (value * 256) + newByteArray[i];
  }

  return value;
};

utilService.show = function (element) {
  element.classList.remove('hidden');
};

utilService.hide = function (element) {
  element.classList.add('hidden');
};

utilService.arrayMove = function (arr, old_index, new_index) {
  if (new_index >= arr.length) {
      var k = new_index - arr.length + 1;
      while (k--) {
          arr.push(undefined);
      }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr;
};

utilService.removeChildNodes = function (node) {
  while (node.firstChild) {
      node.removeChild(node.firstChild);
  }
};

utilService.isString = function (str) {
  return (typeof str === 'string' || str instanceof String);
};

utilService.stringOnlyContainsBinaryDigits = function (str) {
  return /[a-zA-Z2-9]/.test(str) === false;
};

utilService.readDWordAt = function (index, data, le) {
  if (index < 3) {
    throw new Error('Error: index must be equal to or greater than 3.')
  }
  else if (index >= data.length) {
    throw new Error('Error: index must not be greater than the passed in data array length.');
  }

  if (le) {
    return utilService.toUint32(data[index - 3] | data[index - 2] << 8 | data[index - 1] << 16 | data[index] << 24);
  }

  return utilService.toUint32(data[index] | data[index - 1] << 8 | data[index - 2] << 16 | data[index - 3] << 24);
};

utilService.toUint32 = function (x) {
  return utilService.modulo(utilService.toInteger(x), Math.pow(2, 32));
};

utilService.modulo = function (a, b) {
  return a - Math.floor(a/b)*b;
};

utilService.toInteger = function (x) {
  x = Number(x);
  return x < 0 ? Math.ceil(x) : Math.floor(x);
};

utilService.getReferenceData = function (value) {
  return {
    'tableId': utilService.bin2dec(value.substring(0, 15)),
    'rowNumber': utilService.bin2dec(value.substring(16))
  }
};

utilService.hex2Dec = function (data, le) {
  if (le) {
    if (data.length === 1) {
      return utilService.toInteger(data[0]);
    }

    let number = 0

    for (let i = data.length-1; i >= 0; i--) {
      number |= data[i] << (8 * i);
    }

    return utilService.toUint32(number);
  }
};

utilService.getUncompressedTextFromSixBitCompression = function (data) {
  const bv = new BitView(data, data.byteOffset);
  bv.bigEndian = true;
  const numCharacters = (data.length * 8) / 6;
  
  let text = '';

  for (let i = 0; i < numCharacters; i++) {
    text += String.fromCharCode(getCharCode(i * 6));
  }

  return text;

  function getCharCode(offset) {
    return bv.getBits(offset, 6) + 32;
  };
};

utilService.readModifiedLebCompressedInteger = function (buf) {
  let value = 0;
  let isNegative = false;

  for (let i = (buf.length - 1); i >= 0; i--) {
    let currentByte = buf.readUInt8(i);

    if (i !== (buf.length - 1)) {
      currentByte = currentByte ^ 0x80;
    }

    if (i === 0 && (currentByte & 0x40) === 0x40) {
      currentByte = currentByte ^ 0x40;
      isNegative = true;
    }

    let multiplicationFactor = 1 << (i * 6);

    if (i > 1) {
      multiplicationFactor = multiplicationFactor << 1;
    }

    value += currentByte * multiplicationFactor;

    if (isNegative) {
      value *= -1;
    }
  }

  return value;
};

utilService.writeModifiedLebCompressedInteger = function (value) {
  const isNegative = value < 0;
  value = Math.abs(value);

  if (value <= 63) {
    const buffer = Buffer.from([value]);
    const bv = new BitView(buffer, buffer.byteOffset);

    if (isNegative) {
      bv.setBits(6, 1, 1);
    }

    return buffer;
  }
  else if (value > 63 && value < 8192) {
    const buffer = Buffer.from([0x0, 0x0]);
    const bv = new BitView(buffer, buffer.byteOffset);
    
    const lowerBitValue = value % 64;
    bv.setBits(0, lowerBitValue, 6);

    if (isNegative) {
      bv.setBits(6, 1, 1);
    }

    bv.setBits(7, 1, 1);
    
    const higherBitValue = Math.floor(value / 64);
    bv.setBits(8, higherBitValue, 8);

    return buffer;
  }
  else {
    const buffer = Buffer.from([0x0, 0x0, 0x0]);
    const bv = new BitView(buffer, buffer.byteOffset);

    const lowerBitValue = value % 64;
    bv.setBits(0, lowerBitValue, 6);

    if (isNegative) {
      bv.setBits(6, 1, 1);
    }

    bv.setBits(7, 1, 1);
    
    const midBitValue = Math.floor((value - 8192) / 64);
    bv.setBits(8, midBitValue, 7);
    bv.setBits(15, 1, 1);

    const highBitValue = Math.floor(value / 8192);
    bv.setBits(16, highBitValue, 8);

    return buffer;
  }
};

utilService.readGuid = function (existingBuf, index) {
  const buf = Buffer.from(existingBuf.slice(index, index + 16));
  const res = utilService.parseGuid(buf);
  return res;
};

utilService.parseGuid = function (buf) {
  const parsedBuf = [buf.slice(0, 4).swap32(), buf.slice(4, 6).swap16(), buf.slice(6, 8).swap16(), buf.slice(8, 10), buf.slice(10, 16)];
  return `${parsedBuf[0].toString('hex')}-${parsedBuf[1].toString('hex')}-${parsedBuf[2].toString('hex')}-${parsedBuf[3].toString('hex')}-${parsedBuf[4].toString('hex')}`;
};

utilService.flattenObject = (obj) => {
  const flattened = {}

  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(flattened, utilService.flattenObject(obj[key]))
    } else {
      flattened[key] = obj[key]
    }
  })

  return flattened
};

module.exports = utilService;