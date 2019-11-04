import { isFunction } from './common/Util.js';
import Eventable from './common/Eventable.js';
import { KEY_DISPOSED } from './common/Constants.js';

/**
 * Abstract Texture
 * Common methods for Texture2D and TextureCube
 * @abstract
 */
class AbstractTexture {

    constructor(config, resLoader) {
        //TODO add video support
        if (isFunction(config)) {
            //an out-of-box regl texture
            this._texture = config;
            config = this.config = {};
            for (const p in this._texture) {
                if (this._texture.hasOwnProperty(p)) {
                    //parse texture config values from regl texture
                    if (!isFunction(this._texture[p])) {
                        config[p] = this._texture[p];
                    }
                }
            }
        } else {
            this.config = config || {};
            this.resLoader = resLoader;
            if ((config.url || config.promise) && !config.data) {
                this._loading = true;
                const self = this;
                let promise;
                if (config.promise) {
                    promise = config.promise;
                } else {
                    let loadFn;
                    if (config.arrayBuffer) {
                        loadFn = resLoader.getArrayBuffer;
                    } else {
                        loadFn = resLoader.get;
                    }
                    promise = loadFn.call(resLoader, config.url);
                }
                config.data = resLoader.getDefaultTexture(config.url);
                this.promise = promise;
                promise.then(data => {
                    if ((data.data instanceof Image) && this._needPowerOf2()) {
                        data.data = resize(data.data);
                    }
                    delete this.promise;
                    self._loading = false;
                    if (!self.config) {
                        //disposed
                        return data;
                    }
                    self.onLoad(data);
                    if (!Array.isArray(data)) {
                        data = [data];
                    }
                    self.fire('complete', { target: this, resources: data });
                    return data;
                }).catch(err => {
                    console.error('error when loading texture image.', err);
                });
            }
        }

    }

    isReady() {
        return !this._loading;
    }

    set(k, v) {
        this.config[k] = v;
        this.dirty = true;
        return this;
    }

    get(k) {
        return this.config[k];
    }

    getREGLTexture(regl) {
        if (!this._texture) {
            this._texture = this.createREGLTexture(regl);
        }
        if (this.dirty) {
            this._updateREGL();
        }
        return this._texture;
    }

    _updateREGL() {
        if (this._texture) {
            this._texture(this.config);
        }
        this.dirty = false;
    }

    dispose() {
        if (this.config && this.config.url) {
            this.resLoader.disposeRes(this.config.url);
        }
        if (this._texture && !this._texture[KEY_DISPOSED]) {
            this._texture.destroy();
            this._texture[KEY_DISPOSED] = true;
        }
        delete this.resLoader;
        this.fire('disposed', { target: this, url: this.config && this.config.url });
        delete this.config;
    }

    _needPowerOf2() {
        const config = this.config;
        const isRepeat = config.wrap && config.wrap !== 'clamp' || config.wrapS && config.wrapS !== 'clamp' ||
            config.wrapT && config.wrapT !== 'clamp';
        return isRepeat || config.min && config.min !== 'nearest' && config.min !== 'linear';
    }
}

export default Eventable(AbstractTexture);

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

// function ceilPowerOfTwo(value) {
//     return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
// }
