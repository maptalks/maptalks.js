import { isFunction } from './common/Util.js';

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
            this.config = config;
            this.resLoader = resLoader;
            if (config.url) {
                this._loading = true;
                const self = this;
                let loadFn;
                if (config.arrayBuffer) {
                    loadFn = resLoader.getArrayBuffer;
                } else {
                    loadFn = resLoader.get;
                }
                config.data = loadFn.call(resLoader, config.url, function () {
                    self._loading = false;
                    self.onLoad.apply(self, arguments);
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
        if (this._texture) {
            this._texture.destroy();
        }
        delete this.resLoader;
        delete this.config;
    }
}

export default AbstractTexture;
