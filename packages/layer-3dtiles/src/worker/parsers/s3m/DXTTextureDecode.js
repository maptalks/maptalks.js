import { S3MPixelFormat } from './constants';

//! Use DXT1 compression.
var kDxt1 = ( 1 << 0 );

//! Use DXT3 compression.
var kDxt3 = ( 1 << 1 );

//! Use DXT5 compression.
var kDxt5 = ( 1 << 2 );

//! Use a very slow but very high quality colour compressor.
var kColourIterativeClusterFit = ( 1 << 8 );

//! Use a slow but high quality colour compressor (the default).
var kColourClusterFit = ( 1 << 3 );

//! Use a fast but low quality colour compressor.
var kColourRangeFit = ( 1 << 4 );

//! Weight the colour by alpha during cluster fit (disabled by default).
var kWeightColourByAlpha = ( 1 << 7 );

var krgb565 = ( 1 << 5 );

function Unpack565(packed0, packed1, colour, offset) {
    var value = packed0 | (packed1 << 8);

    var red = (value >> 11) & 0x1f;
    var green = (value >> 5) & 0x3f;
    var blue = value & 0x1f;

    colour[offset + 0] = ( red << 3 ) | ( red >> 2 );
    colour[offset + 1] = ( green << 2 ) | ( green >> 4 );
    colour[offset + 2] = ( blue << 3 ) | ( blue >> 2 );
    colour[offset + 3] = 255;

    return value;
}

var codesScratch = new Uint8Array(16);
var indicesScratch = new Uint8Array(16);
function DecompressColour(rgba, block, nOffset, isDxt1) {


    var a = Unpack565(block[nOffset + 0], block[nOffset + 1], codesScratch, 0);
    var b = Unpack565(block[nOffset + 2], block[nOffset + 3], codesScratch, 4);

    for (var i = 0; i < 3; i++) {
        var c = codesScratch[i];
        var d = codesScratch[4 + i];

        if (isDxt1 && a <= b) {
            codesScratch[8 + i] = ( c + d ) / 2;
            codesScratch[12 + i] = 0;
        }
        else {
            codesScratch[8 + i] = ( 2 * c + d ) / 3;
            codesScratch[12 + i] = ( c + 2 * d ) / 3;
        }
    }

    codesScratch[8 + 3] = 255;
    codesScratch[12 + 3] = ( isDxt1 && a <= b ) ? 0 : 255;

    for (var i = 0; i < 4; ++i) {
        var packed = block[nOffset + 4 + i];

        indicesScratch[4 * i + 0] = packed & 0x3;
        indicesScratch[4 * i + 1] = ( packed >> 2 ) & 0x3;
        indicesScratch[4 * i + 2] = ( packed >> 4 ) & 0x3;
        indicesScratch[4 * i + 3] = ( packed >> 6 ) & 0x3;
    }

    for (var i = 0; i < 16; ++i) {
        var offset = 4 * indicesScratch[i];
        for (var j = 0; j < 4; ++j)
            rgba[4 * i + j] = codesScratch[offset + j];
    }

}

function DecompressAlphaDxt3(rgba, block, nOffset) {
    // unpack the alpha values pairwise
    for (var i = 0; i < 8; ++i) {
        // quantise down to 4 bits
        var quant = bytes[nOffset + i];

        // unpack the values
        var lo = quant & 0x0f;
        var hi = quant & 0xf0;

        // convert back up to bytes
        rgba[8 * i + 3] = lo | ( lo << 4 );
        rgba[8 * i + 7] = hi | ( hi >> 4 );
    }
}

function DecompressAlphaDxt5(rgba, block, nOffset) {
    var alpha0 = block[nOffset + 0];
    var alpha1 = block[nOffset + 1];


    codesScratch[0] = alpha0;
    codesScratch[1] = alpha1;
    if (alpha0 <= alpha1) {
        // use 5-alpha codebook
        for (var i = 1; i < 5; ++i)
            codesScratch[1 + i] = ( ( 5 - i ) * alpha0 + i * alpha1 ) / 5;
        codesScratch[6] = 0;
        codesScratch[7] = 255;
    }
    else {
        // use 7-alpha codebook
        for (var i = 1; i < 7; ++i)
            codesScratch[1 + i] = ( ( 7 - i ) * alpha0 + i * alpha1 ) / 7;
    }

    var nOffset = nOffset + 2;
    var nBegin = 0;
    for (var i = 0; i < 2; ++i) {
        // grab 3 bytes
        var value = 0;
        for (var j = 0; j < 3; ++j) {
            var byte = block[nOffset++];
            value |= ( byte << 8 * j );
        }

        // unpack 8 3-bit values from it
        for (var j = 0; j < 8; ++j) {
            var index = ( value >> 3 * j ) & 0x7;
            indicesScratch[nBegin++] = index;
        }
    }

    for (var i = 0; i < 16; ++i)
        rgba[4 * i + 3] = codesScratch[indicesScratch[i]];
}

function Decompress(rgba, block, nOffset, flags) {
    var nOffset2 = 0;
    if (( flags & ( kDxt3 | kDxt5 ) ) != 0)
        nOffset2 = 8;

    DecompressColour(rgba, block, nOffset + nOffset2, ( flags & kDxt1 ) != 0);

    if (( flags & kDxt3 ) != 0) {
        DecompressAlphaDxt3(rgba, block, nOffset);
    }
    else if (( flags & kDxt5 ) != 0) {
        DecompressAlphaDxt5(rgba, block, nOffset);
    }
}

var c = new Uint16Array(4);
function DecompressImage565(rgb565, width, height, blocks) {
    var dst = rgb565;
    var m = 0;
    var dstI = 0;
    var i = 0;
    var r0 = 0, g0 = 0, b0 = 0, r1 = 0, g1 = 0, b1 = 0;

    var blockWidth = width / 4;
    var blockHeight = height / 4;
    for (var blockY = 0; blockY < blockHeight; blockY++) {
        for (var blockX = 0; blockX < blockWidth; blockX++) {
            i = 4 * ((blockHeight - blockY) * blockWidth + blockX);
            c[0] = blocks[i];
            c[1] = blocks[i + 1];
            r0 = c[0] & 0x1f;
            g0 = c[0] & 0x7e0;
            b0 = c[0] & 0xf800;
            r1 = c[1] & 0x1f;
            g1 = c[1] & 0x7e0;
            b1 = c[1] & 0xf800;
            // Interpolate between c0 and c1 to get c2 and c3.    ~
            // Note that we approximate 1/3 as 3/8 and 2/3 as 5/8 for
            // speed.  This also appears to be what the hardware DXT
            // decoder in many GPUs does :)
            c[2] = ((5 * r0 + 3 * r1) >> 3)
                | (((5 * g0 + 3 * g1) >> 3) & 0x7e0)
                | (((5 * b0 + 3 * b1) >> 3) & 0xf800);
            c[3] = ((5 * r1 + 3 * r0) >> 3)
                | (((5 * g1 + 3 * g0) >> 3) & 0x7e0)
                | (((5 * b1 + 3 * b0) >> 3) & 0xf800);
            m = blocks[i + 2];
            dstI = (blockY * 4) * width + blockX * 4;
            dst[dstI] = c[m & 0x3];
            dst[dstI + 1] = c[(m >> 2) & 0x3];
            dst[dstI + 2] = c[(m >> 4) & 0x3];
            dst[dstI + 3] = c[(m >> 6) & 0x3];
            dstI += width;
            dst[dstI] = c[(m >> 8) & 0x3];
            dst[dstI + 1] = c[(m >> 10) & 0x3];
            dst[dstI + 2] = c[(m >> 12) & 0x3];
            dst[dstI + 3] = c[(m >> 14)];
            m = blocks[i + 3];
            dstI += width;
            dst[dstI] = c[m & 0x3];
            dst[dstI + 1] = c[(m >> 2) & 0x3];
            dst[dstI + 2] = c[(m >> 4) & 0x3];
            dst[dstI + 3] = c[(m >> 6) & 0x3];
            dstI += width;
            dst[dstI] = c[(m >> 8) & 0x3];
            dst[dstI + 1] = c[(m >> 10) & 0x3];
            dst[dstI + 2] = c[(m >> 12) & 0x3];
            dst[dstI + 3] = c[(m >> 14)];
        }
    }
    return dst;
}

/*! @brief Decompresses an image in memory.

 @param rgba		Storage for the decompressed pixels.
 @param width	The width of the source image.
 @param height	The height of the source image.
 @param blocks	The compressed DXT blocks.
 @param flags	Compression flags.

 The decompressed pixels will be written as a contiguous array of width*height
 16 rgba values, with each component as 1 byte each. In memory this is:

 { r1, g1, b1, a1, .... , rn, gn, bn, an } for n = width*height

 The flags parameter should specify either kDxt1, kDxt3 or kDxt5 compression,
 however, DXT1 will be used by default if none is specified. All other flags
 are ignored.

 Internally this function calls squish::Decompress for each block.
 */
 var targetRgba = new Uint8Array(4 * 16);
function DecompressImage(rgba, width, height, blocks, flags, format) {
    var bytesPerBlock = ( ( flags & kDxt1 ) != 0 ) ? 8 : 16;

    var nOffset = 0;
    for (var y = 0; y < height; y += 4) {
        for (var x = 0; x < width; x += 4) {
            Decompress(targetRgba, blocks, nOffset, flags);

            var nOffsetTarget = 0;
            for (var py = 0; py < 4; ++py) {
                for (var px = 0; px < 4; ++px) {
                    var sx = x + px;
                    var sy = y + py;
                    if (sx < width && sy < height) {
                        // flip Y
                        var nBegin = 4 * ( width * (height - sy) + sx );
                        if (format === S3MPixelFormat.ABGR || format === S3MPixelFormat.BGRA) {
                            rgba[nBegin + 2] = targetRgba[nOffsetTarget++];
                            rgba[nBegin + 1] = targetRgba[nOffsetTarget++];
                            rgba[nBegin + 0] = targetRgba[nOffsetTarget++];
                            rgba[nBegin + 3] = targetRgba[nOffsetTarget++];
                        } else {
                            for (var i = 0; i < 4; ++i) {
                                rgba[nBegin++] = targetRgba[nOffsetTarget++];
                            }
                        }

                    }
                    else {
                        nOffsetTarget += 4;
                    }
                }
            }

            // advance
            nOffset += bytesPerBlock;
        }
    }
}

function DXTTextureDecode(options){
}

DXTTextureDecode.decode = function(out, width, height, block, format){
    if (out == null || block == null || height == 0 || width == 0) {
        return;
    }
    var flags = 0;
    //有alpha通道,转为RGBA，否则转为rgb565
    // S3MPixelFormat.BGR -> 11
    //S3MPixelFormat.LUMINANCE_ALPHA -> 5
    if (format > 11 || format === 5) {
        flags = kDxt5;
    }
    else {
        flags = kDxt1 | krgb565;
    }
    if ((flags & kDxt1) && (flags & krgb565)) {
        DecompressImage565(out, width, height, block);
    }
    else {
        DecompressImage(out, width, height, block, flags, format);
    }
};

export default DXTTextureDecode;
