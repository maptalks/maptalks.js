/* eslint-disable no-unused-vars */
import wasmContent from './lib/basis_wasm';
import BASIS from './lib/basis_transcoder';

const colorModelETC1S = 163;
const colorModelUASTC = 166;

let transcoderModule;
const BasisFile = null;
let KTX2File = null;

const BASIS_INITIALIZED = BASIS({
    wasmBinary: wasmContent,
    wasmBinaryFile: './lib/basis_transcoder.wasm'
}).then((module) => {
    transcoderModule = module;
    KTX2File = module.KTX2File;
    module.initializeBasis();
});

// Copied from enum class transcoder_texture_format in basisu_transcoder.h with minor javascript-ification
const BASIS_FORMAT = {
    // Compressed formats

    // ETC1-2
    cTFETC1_RGB: 0,                            // Opaque only, returns RGB or alpha data if cDecodeFlagsTranscodeAlphaDataToOpaqueFormats flag is specified
    cTFETC2_RGBA: 1,                            // Opaque+alpha, ETC2_EAC_A8 block followed by a ETC1 block, alpha channel will be opaque for opaque .basis files

    // BC1-5, BC7 (desktop, some mobile devices)
    cTFBC1_RGB: 2,                            // Opaque only, no punchthrough alpha support yet, transcodes alpha slice if cDecodeFlagsTranscodeAlphaDataToOpaqueFormats flag is specified
    cTFBC3_RGBA: 3,                             // Opaque+alpha, BC4 followed by a BC1 block, alpha channel will be opaque for opaque .basis files
    cTFBC4_R: 4,                                // Red only, alpha slice is transcoded to output if cDecodeFlagsTranscodeAlphaDataToOpaqueFormats flag is specified
    cTFBC5_RG: 5,                                // XY: Two BC4 blocks, X=R and Y=Alpha, .basis file should have alpha data (if not Y will be all 255's)
    cTFBC7_RGBA: 6,                            // RGB or RGBA, mode 5 for ETC1S, modes (1,2,3,5,6,7) for UASTC

    // PVRTC1 4bpp (mobile, PowerVR devices)
    cTFPVRTC1_4_RGB: 8,                        // Opaque only, RGB or alpha if cDecodeFlagsTranscodeAlphaDataToOpaqueFormats flag is specified, nearly lowest quality of any texture format.
    cTFPVRTC1_4_RGBA: 9,                    // Opaque+alpha, most useful for simple opacity maps. If .basis file doesn't have alpha cTFPVRTC1_4_RGB will be used instead. Lowest quality of any supported texture format.

    // ASTC (mobile, Intel devices, hopefully all desktop GPU's one day)
    cTFASTC_4x4_RGBA: 10,                    // Opaque+alpha, ASTC 4x4, alpha channel will be opaque for opaque .basis files. Transcoder uses RGB/RGBA/L/LA modes, void extent, and up to two ([0,47] and [0,255]) endpoint precisions.

    // Uncompressed (raw pixel) formats
    cTFRGBA32: 13,                            // 32bpp RGBA image stored in raster (not block) order in memory, R is first byte, A is last byte.
    cTFRGB565: 14,                            // 166pp RGB image stored in raster (not block) order in memory, R at bit position 11
    cTFBGR565: 15,                            // 16bpp RGB image stored in raster (not block) order in memory, R at bit position 0
    cTFRGBA4444: 16,                            // 16bpp RGBA image stored in raster (not block) order in memory, R at bit position 12, A at bit position 0

    cTFTotalTextureFormats: 22,
};

// WebGL compressed formats types, from:
// http://www.khronos.org/registry/webgl/extensions/

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
const COMPRESSED_RGB_S3TC_DXT1_EXT  = 0x83F0;
const COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
const COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
const COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc1/
const COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc/
const COMPRESSED_R11_EAC                        = 0x9270;
const COMPRESSED_SIGNED_R11_EAC                 = 0x9271;
const COMPRESSED_RG11_EAC                       = 0x9272;
const COMPRESSED_SIGNED_RG11_EAC                = 0x9273;
const COMPRESSED_RGB8_ETC2                      = 0x9274;
const COMPRESSED_SRGB8_ETC2                     = 0x9275;
const COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2  = 0x9276;
const COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 0x9277;
const COMPRESSED_RGBA8_ETC2_EAC                 = 0x9278;
const COMPRESSED_SRGB8_ALPHA8_ETC2_EAC          = 0x9279;

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
const COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/
const COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
const COMPRESSED_RGB_PVRTC_2BPPV1_IMG  = 0x8C01;
const COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
const COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;

// https://www.khronos.org/registry/webgl/extensions/EXT_texture_compression_bptc/
const COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8E8C;
const COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT = 0x8E8D;
const COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT = 0x8E8E;
const COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT = 0x8E8F;

const BASIS_WEBGL_FORMAT_MAP = {};
// Compressed formats
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFBC1_RGB] = { format: COMPRESSED_RGB_S3TC_DXT1_EXT };
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFBC3_RGBA] = { format: COMPRESSED_RGBA_S3TC_DXT5_EXT };
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFBC7_RGBA] = { format: COMPRESSED_RGBA_BPTC_UNORM_EXT };
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFETC1_RGB] = { format: COMPRESSED_RGB_ETC1_WEBGL };
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFETC2_RGBA] = { format: COMPRESSED_RGBA8_ETC2_EAC };
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFASTC_4x4_RGBA] = { format: COMPRESSED_RGBA_ASTC_4x4_KHR };
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFPVRTC1_4_RGB] = { format: COMPRESSED_RGB_PVRTC_4BPPV1_IMG };
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFPVRTC1_4_RGBA] = { format: COMPRESSED_RGBA_PVRTC_4BPPV1_IMG };

// Uncompressed formats
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFRGBA32] = { uncompressed: true, format: WebGLRenderingContext.RGBA, type: WebGLRenderingContext.UNSIGNED_BYTE };
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFRGB565] = { uncompressed: true, format: WebGLRenderingContext.RGB, type: WebGLRenderingContext.UNSIGNED_SHORT_5_6_5 };
BASIS_WEBGL_FORMAT_MAP[BASIS_FORMAT.cTFRGBA4444] = { uncompressed: true, format: WebGLRenderingContext.RGBA, type: WebGLRenderingContext.UNSIGNED_SHORT_4_4_4_4 };

function ktxFileFail(id, ktx2File, errorMsg) {
    ktx2File.close();
    ktx2File.delete();
    throw new Error(errorMsg);
}

export function transcode(id, arrayBuffer, supportedTargetFormats) {
    const basisData = new Uint8Array(arrayBuffer);

    const ktx2File = new KTX2File(basisData);
    let width = ktx2File.getWidth();
    let height = ktx2File.getHeight();
    const pixelWidth = width;
    const pixelHeight = height;
    const levels = ktx2File.getLevels();
    const hasAlpha = ktx2File.getHasAlpha();
    if (!(width > 0) || !(height > 0) || !(levels > 0)) {
        ktx2File.close();
        ktx2File.delete();
        throw new Error("Invalid KTX2 file");
    }

    const colorModel = ktx2File.getDFDColorModel();
    const BasisFormat = transcoderModule.transcoder_texture_format;

    let internalFormat, transcoderFormat;

    // Determine target format based on platform support
    if (colorModel === colorModelETC1S) {
        if (supportedTargetFormats.etc) {
            internalFormat = hasAlpha
                ? COMPRESSED_RGBA8_ETC2_EAC
                : COMPRESSED_RGB8_ETC2;
            transcoderFormat = hasAlpha
                ? BasisFormat.cTFETC2_RGBA
                : BasisFormat.cTFETC1_RGB;
        } else if (supportedTargetFormats.etc1 && !hasAlpha) {
            internalFormat = COMPRESSED_RGB_ETC1_WEBGL;
            transcoderFormat = BasisFormat.cTFETC1_RGB;
        } else if (supportedTargetFormats.s3tc) {
            internalFormat = hasAlpha ? COMPRESSED_RGBA_S3TC_DXT5_EXT : COMPRESSED_RGB_S3TC_DXT1_EXT;
            transcoderFormat = hasAlpha
                ? BasisFormat.cTFBC3_RGBA
                : BasisFormat.cTFBC1_RGB;
        } else if (supportedTargetFormats.pvrtc) {
            internalFormat = hasAlpha
                ? COMPRESSED_RGBA_PVRTC_4BPPV1_IMG
                : COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
            transcoderFormat = hasAlpha
                ? BasisFormat.cTFPVRTC1_4_RGBA
                : BasisFormat.cTFPVRTC1_4_RGB;
        } else if (supportedTargetFormats.astc) {
            internalFormat = COMPRESSED_RGBA_ASTC_4x4_KHR;
            transcoderFormat = BasisFormat.cTFASTC_4x4_RGBA;
        } else if (supportedTargetFormats.bc7) {
            internalFormat = COMPRESSED_RGBA_BPTC_UNORM_EXT;
            transcoderFormat = BasisFormat.cTFBC7_RGBA;
        } else {
            ktxFileFail(id, ktx2File, "No transcoding format target available for ETC1S compressed ktx2.");
        }
    } else if (colorModel === colorModelUASTC) {
        if (supportedTargetFormats.astc) {
            internalFormat = COMPRESSED_RGBA_ASTC_4x4_KHR;
            transcoderFormat = BasisFormat.cTFASTC_4x4_RGBA;
        } else if (supportedTargetFormats.bc7) {
            internalFormat = COMPRESSED_RGBA_BPTC_UNORM_EXT;
            transcoderFormat = BasisFormat.cTFBC7_RGBA;
        } else if (supportedTargetFormats.s3tc) {
            internalFormat = hasAlpha ? COMPRESSED_RGBA_S3TC_DXT5_EXT : COMPRESSED_RGB_S3TC_DXT1_EXT;
            transcoderFormat = hasAlpha
                ? BasisFormat.cTFBC3_RGBA
                : BasisFormat.cTFBC1_RGB;
        } else if (supportedTargetFormats.etc) {
            internalFormat = hasAlpha
                ? COMPRESSED_RGBA8_ETC2_EAC
                : COMPRESSED_RGB8_ETC2;
            transcoderFormat = hasAlpha
                ? BasisFormat.cTFETC2_RGBA
                : BasisFormat.cTFETC1_RGB;
        } else if (supportedTargetFormats.etc1 && !hasAlpha) {
            internalFormat = COMPRESSED_RGB_ETC1_WEBGL;
            transcoderFormat = BasisFormat.cTFETC1_RGB;
        } else if (supportedTargetFormats.pvrtc) {
            internalFormat = hasAlpha
                ? COMPRESSED_RGBA_PVRTC_4BPPV1_IMG
                : COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
            transcoderFormat = hasAlpha
                ? BasisFormat.cTFPVRTC1_4_RGBA
                : BasisFormat.cTFPVRTC1_4_RGB;
        } else {
            ktxFileFail(id, ktx2File, "No transcoding format target available for UASTC compressed ktx2.");
        }
    }
    const transferableObjects = [];
    if (!ktx2File.startTranscoding()) {
        ktxFileFail(id, ktx2File, "startTranscoding() failed");
    }

    const mipmap = [];
    for (let i = 0; i < levels; ++i) {
        width = pixelWidth >> i;
        height = pixelHeight >> i;

        // Since supercompressed cubemaps are unsupported, this function
        // does not iterate over KTX2 faces and assumes faceCount = 1.

        const dstSize = ktx2File.getImageTranscodedSizeInBytes(
            i, // level index
            0, // layer index
            0, // face index
            transcoderFormat.value
        );
        const dst = new Uint8Array(dstSize);

        const transcoded = ktx2File.transcodeImage(
            dst,
            i, // level index
            0, // layer index
            0, // face index
            transcoderFormat.value,
            0, // get_alpha_for_opaque_formats
            -1, // channel0
            -1 // channel1
        );

        if (!transcoded) {
            ktxFileFail(id, ktx2File, "transcodeImage() failed.");
        }

        transferableObjects.push(dst.buffer);

        mipmap.push(dst);
    }

    ktx2File.close();
    ktx2File.delete();

    const result = {
        format: internalFormat,
        width: pixelWidth,
        height: pixelHeight,
        mipmap
    };
    if (mipmap.length === 1) {
        result.data = mipmap[0];
        delete result.mipmap;
    }
    return result;
}


export default function transcodeKTX(buffer, options = {}) {
    const { allowSeparateAlpha, supportedFormats, id } = options;
    if (BasisFile) {
        return transcode(id, buffer, options.supportedFormats, options.allowSeparateAlpha);
    } else {
        return BASIS_INITIALIZED.then(() => {
            return transcode(id, buffer, supportedFormats, allowSeparateAlpha);
        });
    }
}
