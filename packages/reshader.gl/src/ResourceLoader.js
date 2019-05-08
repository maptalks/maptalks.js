import Eventable from './common/Eventable.js';
import Ajax from './common/Ajax.js';
import Promise from './common/Promise.js';

class ResourceLoader {
    constructor(DEFAULT_TEXTURE) {
        this.defaultTexture = DEFAULT_TEXTURE;
        this.defaultCubeTexture = new Array(6);

        //TODO 把this.resources换成LRU队列，控制缓存的资源数量
        this.resources = {};
    }

    get(url) {
        if (Array.isArray(url)) {
            return this._loadImages(url);
        } else {
            return this._loadImage(url);
        }
    }

    getArrayBuffer(url) {
        if (Array.isArray(url)) {
            const promises = url.map(u => this.getArrayBuffer(u));
            return Promise.all(promises);
        } else {
            return new Promise((resolve, reject) => {
                Ajax.getArrayBuffer(url, (err, buffer) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ url, data: buffer });
                    }
                });
            });
        }
    }

    disposeRes(url) {
        if (Array.isArray(url)) {
            url.forEach(u => this._disposeOne(u));
        } else {
            this._disposeOne(url);
        }
        return this;
    }

    isLoading() {
        return this._count && this._count > 0;
    }

    getDefaultTexture(url) {
        if (!Array.isArray(url)) {
            return this.defaultTexture;
        } else {
            return this._getBlankTextures(url.length);
        }
    }

    _disposeOne(url) {
        const resources = this.resources;
        if (!resources[url]) {
            return;
        }
        resources[url].count--;
        if (resources[url.count] <= 0) {
            delete resources[url];
        }
    }

    _loadImage(url) {
        const resources = this.resources;
        if (resources[url]) {
            return Promise.resolve({ url, data: resources[url].image });
        }
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () {
                const resized = resize(img);
                resources[url] = {
                    image : resized,
                    count : 1
                };
                resolve({ url, data: resized });
            };
            img.onerror = function (err) {
                reject(err);
            };
            img.onabort = function () {
                reject(`image(${url}) loading aborted.`);
            };
            img.src = url;
        });
        return promise;
    }

    _loadImages(urls) {
        const promises = urls.map(url => this._loadImage(url, true));
        const promise = Promise.all(promises);
        return promise;
    }

    _getBlankTextures(count) {
        const t = new Array(count);
        for (let i = 0; i < 6; i++) {
            t.push(this.defaultTexture);
        }
        return t;
    }
}

export default Eventable(ResourceLoader);

function resize(image) {
    if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
        return image;
    }
    let width = image.width;
    let height = image.height;
    if (!isPowerOfTwo(width)) {
        width = floorPowerOfTwo(width);
    }
    if (!isPowerOfTwo(height)) {
        height = floorPowerOfTwo(height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
    const url = image.src;
    const idx = url.lastIndexOf('/') + 1;
    const filename = url.substring(idx);
    console.warn(`Texture(${filename})'s size is not power of two, resize from (${image.width}, ${image.height}) to (${width}, ${height})`);
    return canvas;
}

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}


function floorPowerOfTwo(value) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}

function ceilPowerOfTwo(value) {
    return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
}
