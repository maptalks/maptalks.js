import { isFunction } from './common/Util.js';
import Eventable from './common/Eventable.js';

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
                    self.fire('complete', { resources: data });
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
        if (this.config.url) {
            this.resLoader.disposeRes(this.config.url);
        }
        if (this._texture && !this._texture['__destroyed']) {
            this._texture.destroy();
            this._texture['__destroyed'] = true;
        }
        delete this.resLoader;
        delete this.config;
    }
}

export default Eventable(AbstractTexture);
