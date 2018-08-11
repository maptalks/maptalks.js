import Eventable from './common/Eventable.js';
import { extend } from './common/Util.js';
import AbstractTexture from './AbstractTexture.js';

class Material {
    constructor(uniforms = {}, defaultUniforms) {
        this.uniforms = extend({}, defaultUniforms || {}, uniforms);
        this._dirtyUniforms = 'texture';
        this.dirtyDefines = true;
        this._reglUniforms = {};
        this.refCount = 0;
        this._bindedOnTextureComplete = this._onTextureComplete.bind(this);
        this._checkTextures();
    }

    isReady() {
        return this._loadingCount <= 0;
    }

    set(k, v) {
        this.uniforms[k] = v;
        this._dirtyUniforms = this.isTexture(k) ? 'texture' : 'primitive';
        if (this._dirtyUniforms === 'texture') {
            this._checkTextures();
        }
        return this;
    }

    get(k) {
        return this.uniforms[k];
    }

    isDirty() {
        return this._dirtyUniforms || this.dirtyDefines;
    }

    /**
     * Get shader defines
     * @return {Object}
     */
    getDefines() {
        if (!this.dirtyDefines) {
            return this._defines;
        }
        if (this.createDefines) {
            this._defines = this.createDefines();
        } else {
            this._defines = {};
        }
        this.dirtyDefines = false;
        return this._defines;
    }

    getUniforms(regl) {
        if (!this._dirtyUniforms) {
            return this._reglUniforms;
        }
        const realUniforms = {};
        for (const p in this.uniforms) {
            const v = this.uniforms[p];
            if (this.isTexture(p)) {
                if (this._dirtyUniforms === 'primitive' && this._reglUniforms[p]) {
                    realUniforms[p] = this._reglUniforms[p];
                } else {
                    if (this._reglUniforms[p]) {
                        this._reglUniforms[p].destroy();
                    }
                    realUniforms[p] = v.getREGLTexture(regl);
                }
            } else {
                realUniforms[p] = v;
            }
        }
        this._reglUniforms = realUniforms;
        this._dirtyUniforms = false;
        return realUniforms;
    }

    isTexture(k) {
        const v = this.uniforms[k];
        if (v instanceof AbstractTexture) {
            return true;
        }
        return false;
    }

    dispose() {
        for (const p in this.uniforms) {
            if (this.uniforms[p] && this.uniforms[p].dispose) {
                this.uniforms[p].dispose();
            }
        }
        delete this.uniforms;
        delete this._reglUniforms;
    }

    _checkTextures() {
        this._loadingCount = 0;
        for (const p in this.uniforms) {
            if (this.isTexture(p)) {
                const texture = this.uniforms[p];
                if (!texture.isReady()) {
                    this._loadingCount++;
                    texture.on('complete', this._bindedOnTextureComplete);
                }
            }
        }
    }

    _onTextureComplete() {
        this._loadingCount--;
        if (this._loadingCount <= 0) {
            this.fire('complete');
        }
    }
}

export default Eventable(Material);
