/*
    DDSParser was adapted from the npm module parse-dds.
    Thank you Jam3 and toji :)
*/
// const streams = require('stream');
// const debug = require('debug')('mft');
// const Parser = require('stream-parser');
const DDSFile = require('../filetypes/DDSFile');
const FileTransformParser = require('../filetypes/abstract/FileTransformParser');

const DDPF_FOURCC = 0x4;
const DDS_MAGIC = 0x20534444;
const P3R_MAGIC = 0x02523370;
const P3R_MAGIC_2 = 0x01523370;
const DDSCAPS2_CUBEMAP = 0x200;
const DDSD_MIPMAPCOUNT = 0x20000;

const DXGI_FORMAT_R32G32B32A32_FLOAT = 2;
const D3D10_RESOURCE_DIMENSION_TEXTURE2D = 3;

const FOURCC_DXT1 = fourCCToInt32('DXT1');
const FOURCC_DXT3 = fourCCToInt32('DXT3');
const FOURCC_DXT5 = fourCCToInt32('DXT5');
const FOURCC_DX10 = fourCCToInt32('DX10');

class DDSParser extends FileTransformParser {
    constructor() {
        super();
        this._file = new DDSFile();
        this._currentBufferIndex = 0;
        this.bytes(0x94, this.onheader);
    };

    onheader(buf) {
        let header = {
            'fourCC': 0,
            'blockBytes': 0,
            'format': '',
            'flags': 0,
            'mipmapCount': 1,
            'width': 0,
            'height': 0,
            'dataOffset': 0,
            'cubemap': false,
            'images': []
        };

        const magic = buf.readUInt32LE(0);
        if (magic !== DDS_MAGIC && magic !== P3R_MAGIC && magic !== P3R_MAGIC_2) {
            this.emit('error', 'Invalid magic number in DDS header')
        }

        const pfFlags = buf.readUInt32LE(80);
        if (!pfFlags & DDPF_FOURCC) {
            this.emit('error', 'Unsupported format, must contain a FourCC code');
        }

        header.fourCC = buf.readUInt32LE(84);

        switch (header.fourCC) {
            case FOURCC_DXT1:
                header.blockBytes = 8;
                header.format = 'dxt1';
                break;
            case FOURCC_DXT3:
                header.blockBytes = 16;
                header.format = 'dxt3';
                break;
            case FOURCC_DXT5:
                header.blockBytes = 16;
                header.format = 'dxt5';
                break;
        //     case FOURCC_FP32F:
        //         header.format = 'rgba32f';
        //         break;
        //     case FOURCC_DX10:
        //         // const dx10Header = new Uint32Array(buf.slice(128, 128 + 20));
        //         // header.format = dx10Header[0];
        //         // var resourceDimension = dx10Header[1];
        //         // var miscFlag = dx10Header[2];
        //         // var arraySize = dx10Header[3];
        //         // var miscFlags2 = dx10Header[4];
            
        //         // if (resourceDimension === D3D10_RESOURCE_DIMENSION_TEXTURE2D && format === DXGI_FORMAT_R32G32B32A32_FLOAT) {
        //         //     header.format = 'rgba32f'
        //         // } else {
        //         //     // throw new Error('Unsupported DX10 texture format ' + format)
        //         // }
            default:
            //   throw new Error('Unsupported FourCC code: ' + int32ToFourCC(header.fourCC))
        }

        header.flags = buf.readUInt32LE(8);
        header.offMipmapCount = buf.readUInt32LE(28);

        if (header.flags & DDSD_MIPMAPCOUNT) {
            header.mipmapCount = Math.max(1, header.offMipmapCount);
        }

        const caps2 = buf.readUInt32LE(112);
        if (caps2 & DDSCAPS2_CUBEMAP) {
            header.cubemap = true
        }

        header.height = buf.readUInt32LE(12);
        header.width = buf.readUInt32LE(16);
        header.dataOffset = buf.readUInt32LE(4) + 4;

        if (header.fourCC === FOURCC_DX10) {
            header.dataOffset += 20
        }

        let dataOffset = header.dataOffset;
        let dataLength = 0;
        let height = header.height;
        let width = header.width;

        if (header.cubemap) {
            for (var f = 0; f < 6; f++) {
                if (header.format !== 'rgba32f') {
                    this.emit('error', 'Only RGBA32f cubemaps are supported');
                }

                var bpp = 4 * 32 / 8;
            
                width = header.width;
                height = header.height;
            
                // cubemap should have all mipmap levels defined
                // Math.log2(width) + 1
                var requiredMipLevels = Math.log(width) / Math.log(2) + 1;
            
                for (var i = 0; i < requiredMipLevels; i++) {
                    dataLength = width * height * bpp;
                    header.images.push({
                        offset: dataOffset,
                        length: dataLength,
                        height: height,
                        width: width
                    })
                    // Reuse data from the previous level if we are beyond mipmapCount
                    // This is hack for CMFT not publishing full mipmap chain https://github.com/dariomanesku/cmft/issues/10
                    if (i < header.mipmapCount) {
                        dataOffset += dataLength
                    }

                    width = Math.floor(width / 2)
                    height = Math.floor(height / 2)
                }
            }
          } else {
            for (var i = 0; i < header.mipmapCount; i++) {
                dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * header.blockBytes;
            
                header.images.push({
                    offset: dataOffset,
                    length: dataLength,
                    height: height,
                    width: width
                });

                dataOffset += dataLength
                width = Math.floor(width / 2)
                height = Math.floor(height / 2)
            }
        }

        this.emit('header', header);
        this._file.header = header;
        this.push(buf);
        this._passthrough(Infinity);
    };
};

module.exports = DDSParser;

function fourCCToInt32 (value) {
    return value.charCodeAt(0) +
      (value.charCodeAt(1) << 8) +
      (value.charCodeAt(2) << 16) +
      (value.charCodeAt(3) << 24)
  }
  
  function int32ToFourCC (value) {
    return String.fromCharCode(
      value & 0xff,
      (value >> 8) & 0xff,
      (value >> 16) & 0xff,
      (value >> 24) & 0xff
    )
};