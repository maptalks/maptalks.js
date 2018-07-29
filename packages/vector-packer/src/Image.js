/*!
 * Codes from mapbox-gl-js
 * github.com/mapbox/mapbox-gl-js
 * MIT License
 */

function createImage(image, { width, height }, channels, data) {
    if (!data) {
        data = new Uint8Array(width * height * channels);
    } else if (data.length !== width * height * channels) {
        throw new RangeError('mismatched image size');
    }
    image.width = width;
    image.height = height;
    image.data = data;
    return image;
}

function resizeImage(image, { width, height }, channels) {
    if (width === image.width && height === image.height) {
        return;
    }

    const newImage = createImage({}, { width, height }, channels);

    copyImage(image, newImage, { x: 0, y: 0 }, { x: 0, y: 0 }, {
        width: Math.min(image.width, width),
        height: Math.min(image.height, height)
    }, channels);

    image.width = width;
    image.height = height;
    image.data = newImage.data;
}

function copyImage(srcImg, dstImg, srcPt, dstPt, size, channels) {
    if (size.width === 0 || size.height === 0) {
        return dstImg;
    }

    if (size.width > srcImg.width ||
        size.height > srcImg.height ||
        srcPt.x > srcImg.width - size.width ||
        srcPt.y > srcImg.height - size.height) {
        throw new RangeError('out of range source coordinates for image copy');
    }

    if (size.width > dstImg.width ||
        size.height > dstImg.height ||
        dstPt.x > dstImg.width - size.width ||
        dstPt.y > dstImg.height - size.height) {
        throw new RangeError('out of range destination coordinates for image copy');
    }

    const srcData = srcImg.data;
    const dstData = dstImg.data;

    if (srcData === dstData) {
        return dstImg;
    }

    for (let y = 0; y < size.height; y++) {
        const srcOffset = ((srcPt.y + y) * srcImg.width + srcPt.x) * channels;
        const dstOffset = ((dstPt.y + y) * dstImg.width + dstPt.x) * channels;
        for (let i = 0; i < size.width * channels; i++) {
            dstData[dstOffset + i] = srcData[srcOffset + i];
        }
    }

    return dstImg;
}

export class AlphaImage {

    constructor(size, data) {
        createImage(this, size, 1, data);
    }

    resize(size) {
        resizeImage(this, size, 1);
    }

    clone() {
        return new AlphaImage({ width: this.width, height: this.height }, new Uint8Array(this.data));
    }

    static copy(srcImg, dstImg, srcPt, dstPt, size) {
        copyImage(srcImg, dstImg, srcPt, dstPt, size, 1);
    }
}

// Not premultiplied, because ImageData is not premultiplied.
// UNPACK_PREMULTIPLY_ALPHA_WEBGL must be used when uploading to a texture.
export class RGBAImage {

    constructor(size, data) {
        createImage(this, size, 4, data);
    }

    resize(size) {
        resizeImage(this, size, 4);
    }

    clone() {
        return new RGBAImage({ width: this.width, height: this.height }, new Uint8Array(this.data));
    }

    static copy(srcImg, dstImg, srcPt, dstPt, size) {
        copyImage(srcImg, dstImg, srcPt, dstPt, size, 4);
    }
}
