// const dxt = require('dxt-js');
// const parse = require('parse-dds');
// const { PNG } = require('node-png');
const File = require('./abstract/File');

class DDSFile extends File {
    constructor() {
        super();
        this[Symbol.toStringTag] = 'DDSFile';
    };

    // parse() {
    //     this._header = parse(this._rawContents.buffer);
    // };

    // convert(name) {
    //     return new Promise((resolve, reject) => {
    //         if (name.toLowerCase() === 'png') {
    //             bufferDxt2Png(this._rawContents.slice(this._header.images[0].offset), this._header.shape[0], this._header.shape[1], this._header.format)
    //                 .then((contents) => {
    //                     resolve(contents);
    //                 })
    //                 .catch((err) => {
    //                     reject(err);
    //                 })
    //         }
    //         else {
    //             reject('Conversion method does not exist yet. DDS -> ', name);
    //         }
    //     });
    // };
};

module.exports = DDSFile;

function bufferDxt2Png(buffer, height, width, type) {
    return new Promise((resolve, reject) => {
        let offset = 0;
    
        let crop = buffer.slice(offset);
        let format = 'unknown';
    
        if (type.indexOf('dxt1') != -1) {
            crop = dxt.decompress(crop, width, height, dxt.flags.DXT1);
            crop = Buffer.from(crop);
            format = 'dxt1';
        } else if (type.toString().indexOf('dxt3') != -1) {
            crop = dxt.decompress(crop, width, height, dxt.flags.DXT3);
            crop = Buffer.from(crop);
            format = 'dxt3';
        } else if (type.toString().indexOf('dxt5') != -1) {
            crop = dxt.decompress(crop, width, height, dxt.flags.DXT5);
            crop = Buffer.from(crop);
            format = 'dxt5';
        } else if (typeData[0] == 21) { // a8r8g8b8
            for (let i = 0; i < crop.length; i += 4) {
                let t = crop[i + 2];
                crop[i + 2] = crop[i];
                crop[i] = t;
            }
            format = 'a8r8g8b8';
        } else if (typeData[0] == 22) { // x8r8g8b8
            for (let i = 0; i < crop.length; i += 4) {
                let t = crop[i + 2];
                crop[i + 2] = crop[i];
                crop[i] = t;
                crop[i + 3] = 255
            }
            format = 'x8r8g8b8';
        } else if (typeData[0] == 25) { // a1r5g5b5
            let temp = Buffer.allocUnsafe(crop.length * 2); // 16 bit -> 32 bit
            let k = 0;
            for (let i = 0; i < crop.length; i += 2) {
                let a = (crop[i + 1] << 8) + crop[i];
        
                temp[k++] = ((a >> 10) & 0b11111) << 3;
                temp[k++] = ((a >> 5) & 0b11111) << 3;
                temp[k++] = (a & 0b11111) << 3;
                temp[k++] = a >> 15 ? 255 : 0;
            }
            crop = temp;
            format = 'a1r5g5b5';
        } else if (typeData[0] == 26) { // a4r4g4b4
            let temp = Buffer.allocUnsafe(crop.length * 2);  // 16 bit -> 32 bit
            let k = 0;
            for (let i = 0; i < crop.length; i += 2) {
                let a = (crop[i + 1] << 8) + crop[i];
        
                temp[k++] = ((a >> 8) & 0xf) << 4;
                temp[k++] = ((a >> 4) & 0xf) << 4;
                temp[k++] = (a & 0xf) << 4;
                temp[k++] = a >> 8;
            }
            crop = temp;
            format = 'a4r4g4b4';
        } else {
            return reject(new Error('Unsupported file! type data [' + typeData.join(', ') + ']'));
        }
    
        let png = new PNG({
          width, height
        });
    
        png.data = crop;
    
        var bufList = [];
        png.pack().on('data', function (buf) {
            bufList.push(buf);
        }).on('error', function (error) {
            reject(error)
        }).on('end', function () {
            resolve(Buffer.concat(bufList));
        });
    });
}