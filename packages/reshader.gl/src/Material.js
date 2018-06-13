import { extend } from './common/Util.js';
import AbstractTexture from './AbstractTexture.js';

class Material {
    constructor(uniforms = {}, defaultUniforms) {
        this.uniforms = extend({}, defaultUniforms || {}, uniforms);
        this._dirtyUniforms = 'texture';
        this.dirtyDefines = true;
        this._reglUniforms = {};
        this.refCount = 0;
    }

    isReady() {
        for (const p in this.uniforms) {
            if (this.isTexture(p)) {
                if (!this.uniforms[p].isReady()) {
                    return false;
                }
            }
        }
        return true;
    }

    set(k, v) {
        this.uniforms[k] = v;
        this._dirtyUniforms = this.isTexture(k) ? 'texture' : 'primitive';
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
}

export default Material;
