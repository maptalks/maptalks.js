import crunch from './lib/crunch.js';
import { isNil } from './lib/util.js';

// Modified from texture-tester
// See:
//     https://github.com/toji/texture-tester/blob/master/js/webgl-texture-util.js
//     http://toji.github.io/texture-tester/

/*!
 * @license
 *
 * Copyright (c) 2014, Brandon Jones. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation
 *  and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
const PixelFormat = {
    // COMPRESSED_RGB_S3TC_DXT1_EXT
    RGB_DXT1: 0x83f0,
    // COMPRESSED_RGBA_S3TC_DXT1_EXT
    RGBA_DXT1: 0x83f1,
    // COMPRESSED_RGBA_S3TC_DXT3_EXT
    RGBA_DXT3: 0x83f2,
    // COMPRESSED_RGBA_S3TC_DXT5_EXT
    RGBA_DXT5: 0x83f3,
    // COMPRESSED_RGB_ETC1_WEBGL
    RGB_ETC1: 0x8d64,
    // COMPRESSED_RGB_PVRTC_4BPPV1_IMG
    RGB_PVRTC_4BPPV1: 0x8c00,
    // COMPRESSED_RGB_PVRTC_2BPPV1_IMG
    RGB_PVRTC_2BPPV1: 0x8c01,
    // COMPRESSED_RGB_PVRTC_2BPPV1_IMG
    RGBA_PVRTC_4BPPV1: 0x8c02,
    // COMPRESSED_RGBA_PVRTC_2BPPV1_IMG
    RGBA_PVRTC_2BPPV1: 0x8c03,

    compressedTextureSizeInBytes: function (pixelFormat, width, height) {
        switch (pixelFormat) {
        case PixelFormat.RGB_DXT1:
        case PixelFormat.RGBA_DXT1:
        case PixelFormat.RGB_ETC1:
            return Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 8;

        case PixelFormat.RGBA_DXT3:
        case PixelFormat.RGBA_DXT5:
            return Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 16;

        case PixelFormat.RGB_PVRTC_4BPPV1:
        case PixelFormat.RGBA_PVRTC_4BPPV1:
            return Math.floor((Math.max(width, 8) * Math.max(height, 8) * 4 + 7) / 8);

        case PixelFormat.RGB_PVRTC_2BPPV1:
        case PixelFormat.RGBA_PVRTC_2BPPV1:
            return Math.floor(
                (Math.max(width, 16) * Math.max(height, 8) * 2 + 7) / 8
            );

        default:
            return 0;
        }
    }
};

// Taken from crnlib.h
const CRN_FORMAT = {
    cCRNFmtInvalid: -1,

    cCRNFmtDXT1: 0,
    // cCRNFmtDXT3 is not currently supported when writing to CRN - only DDS.
    cCRNFmtDXT3: 1,
    cCRNFmtDXT5: 2,
    // Crunch supports more formats than this, but we can't use them here.
};

// Mapping of Crunch formats to DXT formats.
const DXT_FORMAT_MAP = {};
DXT_FORMAT_MAP[CRN_FORMAT.cCRNFmtDXT1] = PixelFormat.RGB_DXT1;
DXT_FORMAT_MAP[CRN_FORMAT.cCRNFmtDXT3] = PixelFormat.RGBA_DXT3;
DXT_FORMAT_MAP[CRN_FORMAT.cCRNFmtDXT5] = PixelFormat.RGBA_DXT5;

let dst;
let dxtData;
let cachedDstSize = 0;

// Copy an array of bytes into or out of the emscripten heap.
function arrayBufferCopy(src, dst, dstByteOffset, numBytes) {
    let i;
    const dst32Offset = dstByteOffset / 4;
    const tail = numBytes % 4;
    const src32 = new Uint32Array(src.buffer, 0, (numBytes - tail) / 4);
    const dst32 = new Uint32Array(dst.buffer);
    for (i = 0; i < src32.length; i++) {
        dst32[dst32Offset + i] = src32[i];
    }
    for (i = numBytes - tail; i < numBytes; i++) {
        dst[dstByteOffset + i] = src[i];
    }
}

/**
 * @private
 */
function transcodeCRNToDXT(arrayBuffer) {
    // Copy the contents of the arrayBuffer into emscriptens heap.
    const srcSize = arrayBuffer.byteLength;
    const bytes = new Uint8Array(arrayBuffer);
    const src = crunch._malloc(srcSize);
    arrayBufferCopy(bytes, crunch.HEAPU8, src, srcSize);

    // Determine what type of compressed data the file contains.
    const crnFormat = crunch._crn_get_dxt_format(src, srcSize);
    const format = DXT_FORMAT_MAP[crnFormat];
    if (isNil(format)) {
        throw new Error('Unsupported compressed format.');
    }

    // Gather basic metrics about the DXT data.
    const levels = crunch._crn_get_levels(src, srcSize);
    let width = crunch._crn_get_width(src, srcSize);
    let height = crunch._crn_get_height(src, srcSize);

    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Compressed_texture_formats
    // s3tc textures's width and height must be multiples of 4.
    if (format === PixelFormat.RGB_DXT1 ||
        format === PixelFormat.RGBA_DXT3 ||
        format === PixelFormat.RGBA_DXT5) {
        if (width % 4 !== 0) {
            width += (4 - width % 4);
        }
        if (height % 4 !== 0) {
            height += (4 - height % 4);
        }
    }

    // Determine the size of the decoded DXT data.
    let dstSize = 0;
    let i;
    for (i = 0; i < levels; ++i) {
        dstSize += PixelFormat.compressedTextureSizeInBytes(
            format,
            width >> i,
            height >> i
        );
    }

    // Allocate enough space on the emscripten heap to hold the decoded DXT data
    // or reuse the existing allocation if a previous call to this function has
    // already acquired a large enough buffer.
    if (cachedDstSize < dstSize) {
        if (!isNil(dst)) {
            crunch._free(dst);
        }
        dst = crunch._malloc(dstSize);
        dxtData = new Uint8Array(crunch.HEAPU8.buffer, dst, dstSize);
        cachedDstSize = dstSize;
    }

    // Decompress the DXT data from the Crunch file into the allocated space.
    crunch._crn_decompress(src, srcSize, dst, dstSize, 0, levels);

    // Release the crunch file data from the emscripten heap.
    crunch._free(src);

    // Mipmaps are unsupported, so copy the level 0 texture
    // When mipmaps are supported, a copy will still be necessary as dxtData is a view on the heap.
    const length = PixelFormat.compressedTextureSizeInBytes(format, width, height);

    // Get a copy of the 0th mip level. dxtData will exceed length when there are more mip levels.
    // Equivalent to dxtData.slice(0, length), which is not supported in IE11
    const level0DXTDataView = dxtData.subarray(0, length);
    const level0DXTData = new Uint8Array(length);
    level0DXTData.set(level0DXTDataView, 0);

    return { format: format, width, height, data: level0DXTData, transferList: [level0DXTData.buffer] };
}
export default transcodeCRNToDXT;
