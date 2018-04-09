import { extend } from './common/Util.js';
import AbstractTexture from './AbstractTexture.js';

class Material {
    constructor(uniforms = {}, defaultUniforms) {
        this.uniforms = extend({}, defaultUniforms || {}, uniforms);
        this._dirtyUniforms = 'texture';
        this._dirtyDefines = true;
        this._reglUniforms = {};
        this.refCount = 0;
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
        return this._dirtyUniforms || this._dirtyDefines;
    }

    /**
     * Get shader defines
     * @return {Object}
     */
    getDefines() {
        if (!this._dirtyDefines) {
            return this._defines;
        }
        this._defines = this.createDefines();
        this._definesKey = this._createDefinesKey(this._defines);
        this._dirtyDefines = false;
        return this._defines;
    }

    getDefinesKey() {
        //refresh defines
        this.getDefines();
        return this._definesKey;
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
            if (this.uniforms[p].dispose) {
                this.uniforms[p].dispose();
            }
        }
        delete this.uniforms;
        delete this._reglUniforms;
    }

    _createDefinesKey(defines) {
        const v = [];
        for (const p in defines) {
            v.push(p, defines[p]);
        }
        return v.join(',');
    }
}

export default Material;
