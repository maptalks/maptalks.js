import Eventable from './common/Eventable.js';
import { extend1 } from './common/Util.js';
import AbstractTexture from './AbstractTexture.js';
import { KEY_DISPOSED } from './common/Constants.js';

class Material {
    constructor(uniforms = {}, defaultUniforms) {
        this.uniforms = extend1({}, defaultUniforms || {}, uniforms);
        for (const p in uniforms) {
            const getter = Object.getOwnPropertyDescriptor(uniforms, p).get;
            if (getter) {
                Object.defineProperty(this.uniforms, p, {
                    get: getter
                });
            }
            //自动增加uFoo形式的uniform变量定义
            if (p.length < 2 || p.charAt(0) !== 'u' || p.charAt(1) !== p.charAt(1).toUpperCase()) {
                const key = 'u' + firstUpperCase(p);
                this.uniforms[key] = uniforms[p];
                if (getter) {
                    Object.defineProperty(this.uniforms, key, {
                        get: getter
                    });
                }
            }
        }
        this._dirtyUniforms = 'texture';
        this._dirtyDefines = true;
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
        if (k.length < 2 || k.charAt(0) !== 'u' || k.charAt(1) !== k.charAt(1).toUpperCase()) {
            this.uniforms['u' + firstUpperCase(k)] = v;
        }
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
        if (this.createDefines) {
            this._defines = this.createDefines();
        } else {
            this._defines = {};
        }
        this._dirtyDefines = false;
        return this._defines;
    }

    createDefines() {
        const uniforms = this.uniforms;
        const defines = {};
        if (uniforms['jointTexture']) {
            defines['HAS_SKIN'] = 1;
        }
        if (uniforms['morphWeights']) {
            defines['HAS_MORPH'] = 1;
        }
        return defines;
    }

    getUniforms(regl) {
        if (!this._dirtyUniforms) {
            return this._reglUniforms;
        }
        const uniforms = this.uniforms;
        const realUniforms = {};
        for (const p in uniforms) {
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
                Object.defineProperty(realUniforms, p, {
                    enumerable: true,
                    configurable: true,
                    get: function () {
                        return uniforms && uniforms[p];
                    }
                });
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
            const u = this.uniforms[p];
            if (u) {
                if (u.dispose) {
                    u.dispose();
                } else if (u.destroy && !u[KEY_DISPOSED]) {
                    //a normal regl texture
                    u.destroy();
                    u[KEY_DISPOSED] = true;
                }
            }
        }
        delete this.uniforms;
        delete this._reglUniforms;
        this._disposed = true;
    }

    isDisposed() {
        return !!this._disposed;
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

function firstUpperCase(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
}
