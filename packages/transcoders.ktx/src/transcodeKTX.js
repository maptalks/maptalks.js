/* eslint-disable no-unused-vars */
import BASIS from './lib/basis_transcoder';

let BasisFile = null;

const BASIS_INITIALIZED = BASIS().then((module) => {
  BasisFile = module.BasisFile;
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

// Notifies the main thread when a texture has failed to load for any reason.
function fail(id, errorMsg) {
  return Promise.reject(`error when decoding ktx image(${id}): ${errorMsg}`);
}

function basisFileFail(id, basisFile, errorMsg) {
  basisFile.close();
  basisFile.delete();
  return fail(id, errorMsg);
}

// This utility currently only transcodes the first image in the file.
const IMAGE_INDEX = 0;
const TOP_LEVEL_MIP = 0;

function transcode(id, arrayBuffer, supportedFormats, allowSeparateAlpha) {
  let basisData = new Uint8Array(arrayBuffer);

  let basisFile = new BasisFile(basisData);
  let images = basisFile.getNumImages();
  let levels = basisFile.getNumLevels(IMAGE_INDEX);
  let hasAlpha = basisFile.getHasAlpha();
  if (!images || !levels) {
    return basisFileFail(id, basisFile, 'Invalid Basis data');
  }

  if (!basisFile.startTranscoding()) {
    return basisFileFail(id, basisFile, 'startTranscoding failed');;
  }

  let basisFormat = undefined;
  let needsSecondaryAlpha = false;
  if (hasAlpha) {
    if (supportedFormats.etc2) {
      basisFormat = BASIS_FORMAT.cTFETC2_RGBA;
    } else if (supportedFormats.bptc) {
      basisFormat = BASIS_FORMAT.cTFBC7_RGBA;
    } else if (supportedFormats.s3tc) {
      basisFormat = BASIS_FORMAT.cTFBC3_RGBA;
    } else if (supportedFormats.astc) {
      basisFormat = BASIS_FORMAT.cTFASTC_4x4_RGBA;
    } else if (supportedFormats.pvrtc) {
      if (allowSeparateAlpha) {
        basisFormat = BASIS_FORMAT.cTFPVRTC1_4_RGB;
        needsSecondaryAlpha = true;
      } else {
        basisFormat = BASIS_FORMAT.cTFPVRTC1_4_RGBA;
      }
    } else if (supportedFormats.etc1 && allowSeparateAlpha) {
      basisFormat = BASIS_FORMAT.cTFETC1_RGB;
      needsSecondaryAlpha = true;
    } else {
      // If we don't support any appropriate compressed formats transcode to
      // raw pixels. This is something of a last resort, because the GPU
      // upload will be significantly slower and take a lot more memory, but
      // at least it prevents you from needing to store a fallback JPG/PNG and
      // the download size will still likely be smaller.
      basisFormat = BASIS_FORMAT.RGBA32;
    }
  } else {
    if (supportedFormats.etc1) {
      // Should be the highest quality, so use when available.
      // http://richg42.blogspot.com/2018/05/basis-universal-gpu-texture-format.html
      basisFormat = BASIS_FORMAT.cTFETC1_RGB;
    } else if (supportedFormats.bptc) {
      basisFormat = BASIS_FORMAT.cTFBC7_RGBA;
    } else if (supportedFormats.s3tc) {
      basisFormat = BASIS_FORMAT.cTFBC1_RGB;
    } else if (supportedFormats.etc2) {
      basisFormat = BASIS_FORMAT.cTFETC2_RGBA;
    } else if (supportedFormats.astc) {
      basisFormat = BASIS_FORMAT.cTFASTC_4x4_RGBA;
    } else if (supportedFormats.pvrtc) {
      basisFormat = BASIS_FORMAT.cTFPVRTC1_4_RGB;
    } else {
      // See note on uncompressed transcode above.
      basisFormat = BASIS_FORMAT.cTFRGB565;
    }
  }

  if (basisFormat === undefined) {
    return basisFileFail(id, basisFile, 'No supported transcode formats');;
  }

  let webglFormat = BASIS_WEBGL_FORMAT_MAP[basisFormat];

  // If we're not using compressed textures it'll be cheaper to generate
  // mipmaps on the fly, so only transcode a single level.
  if (webglFormat.uncompressed) {
    levels = 1;
  }

  // Gather information about each mip level to be transcoded.
  let mipLevels = [];
  let totalTranscodeSize = 0;

  const  width = basisFile.getImageWidth(IMAGE_INDEX, 0);
  const height = basisFile.getImageHeight(IMAGE_INDEX, 0);
  for (let mipLevel = 0; mipLevel < levels; ++mipLevel) {
    let transcodeSize = basisFile.getImageTranscodedSizeInBytes(IMAGE_INDEX, mipLevel, basisFormat);
    mipLevels.push({
      level: mipLevel,
      offset: totalTranscodeSize,
      size: transcodeSize,
      width: mipLevel === 0 ? width : basisFile.getImageWidth(IMAGE_INDEX, mipLevel),
      height: mipLevel === 0 ? height : basisFile.getImageHeight(IMAGE_INDEX, mipLevel),
    });
    totalTranscodeSize += transcodeSize;
  }

  // Allocate a buffer large enough to hold all of the transcoded mip levels at once.
  let transcodeData = new Uint8Array(totalTranscodeSize);
  let alphaTranscodeData = needsSecondaryAlpha ? new Uint8Array(totalTranscodeSize) : null;

  // Transcode each mip level into the appropriate section of the overall buffer.
  for (let mipLevel of mipLevels) {
    let levelData = new Uint8Array(transcodeData.buffer, mipLevel.offset, mipLevel.size);
    if (!basisFile.transcodeImage(levelData, IMAGE_INDEX, mipLevel.level, basisFormat, 1, 0)) {
      return basisFileFail(id, basisFile, 'transcodeImage failed');
    }
    if (needsSecondaryAlpha) {
      let alphaLevelData = new Uint8Array(alphaTranscodeData.buffer, mipLevel.offset, mipLevel.size);
      if (!basisFile.transcodeImage(alphaLevelData, IMAGE_INDEX, mipLevel.level, basisFormat, 1, 1)) {
        return basisFileFail(id, basisFile, 'alpha transcodeImage failed');
      }
    }
  }

  basisFile.close();
  basisFile.delete();

  // Post the transcoded results back to the main thread.
  let transferList = [transcodeData.buffer];
  if (needsSecondaryAlpha) {
    transferList.push(alphaTranscodeData.buffer);
  }
  return Promise.resolve({
    id: id,
    width, height,
    webglFormat: webglFormat,
    buffer: transcodeData.buffer,
    alphaBuffer: needsSecondaryAlpha ? alphaTranscodeData.buffer : null,
    mipLevels: mipLevels,
    hasAlpha: hasAlpha,
    transferList
  });
}

export default function transcodeKTX(buffer, options) {
  const { allowSeparateAlpha, supportedFormats, id } = options;
  if (BasisFile) {
    return transcode(id, buffer, supportedFormats, allowSeparateAlpha);
  } else {
    return BASIS_INITIALIZED.then(() => {
      return transcode(id, buffer, supportedFormats, allowSeparateAlpha);
    });
  }
}
