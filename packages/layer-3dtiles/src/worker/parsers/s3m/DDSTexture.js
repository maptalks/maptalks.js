import PixelFormat from './PixelFormat';

// const NOCOMPRESSED_RGB565 = 0x111;
const NOCOMPRESSED_RGBA = 0x1111;
const NOCOMPRESSED_LA = 6410;

export function decompressTexture(buffer, byteOffset, internalFormat, pixelFormat, width, height) {
    const bMipMap = validateMipmap(buffer, internalFormat, width, height);
    if (!bMipMap) {
        return null;
    }

    const flipY = internalFormat === NOCOMPRESSED_LA || internalFormat === NOCOMPRESSED_RGBA;

    // let i = 0;
    let offset = 0;
    let texWidth = width;
    let texHeight = height;

    const mipmap = [];
    do{
        let levelSize = PixelFormat.compressedTextureSizeInBytes(internalFormat, texWidth, texHeight);
        let subArrayBuffer = new Uint8Array(buffer.buffer, byteOffset + offset, levelSize);
        mipmap.push(subArrayBuffer);
        texWidth = Math.max(texWidth >> 1,1);
        texHeight = Math.max(texHeight >> 1,1);
        offset += levelSize;
    }
    while (offset < buffer.byteLength && bMipMap);

    // if (i > 1) {
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    // }
    // else {
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // }

    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
    // gl.texParameteri(this._target, this.context._textureFilterAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT, 1);
    return {
        flipY,
        mipmap
    };
}


function validateMipmap(buffer, pixelFormat, width, height){
    let len = buffer.length;
    let w = width, h = height;
    let totalBytes = 0;
    while(w > 0 && h > 0){
        let sizeInBytes = PixelFormat.compressedTextureSizeInBytes(pixelFormat, w, h);
        totalBytes += sizeInBytes;
        w = w >> 1;
        h = h >> 1;
        if(w === 0 && h === 0){
            break;
        }

        w = Math.max(w, 1);
        h = Math.max(h, 1);
    }

    return totalBytes === len;
}
