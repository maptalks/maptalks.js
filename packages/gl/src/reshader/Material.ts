import Eventable from './common/Eventable';
import { isNil, extendWithoutNil, hasOwn, getTexMemorySize } from './common/Util';
import AbstractTexture from './AbstractTexture';
import { KEY_DISPOSED } from './common/Constants';
import { ShaderUniforms, ShaderUniformValue, ShaderDefines } from './types/typings';
import { Texture } from '@maptalks/regl';
import Geometry from './Geometry';

class Base {}

export default class Material extends Eventable(Base) {
    uniforms: ShaderUniforms
    refCount: number
    // 如果unlit，则不产生阴影（但接受阴影）
    unlit: boolean
    //@internal
    _version: number
    //@internal
    _propVerion: number
    //@internal
    _uniformVer?: number
    //@internal
    _uniformKeys?: string
    //@internal
    _reglUniforms: ShaderUniforms
    //@internal
    _bindedOnTextureComplete: () => void
    //@internal
    _doubleSided: boolean
    //@internal
    _loadingCount?: number
    //@internal
    _disposed?: boolean

    constructor(uniforms: ShaderUniforms = {}, defaultUniforms?: ShaderUniforms) {
        super()
        this._version = 0;
        this._propVerion = 0;
        this.uniforms = extendWithoutNil({}, defaultUniforms || {}, uniforms);
        for (const p in uniforms) {
            const getter = Object.getOwnPropertyDescriptor(uniforms, p).get;
            if (getter) {
                Object.defineProperty(this.uniforms, p, {
                    get: getter
                });
            }
        }
        this.unlit = false;
        this._reglUniforms = {};
        this.refCount = 0;
        this._bindedOnTextureComplete = (...args) => {
            return this._onTextureComplete.call(this, ...args);
        };
        this._genUniformKeys();
        this._checkTextures();
    }

    set version(v: number) {
        throw new Error('Material.version is read only.');
    }

    get version(): number {
        return this._version;
    }

    get propVersion(): number {
        return this._propVerion;
    }

    set doubleSided(value: boolean) {
        this.uniforms.doubleSided = value;
    }

    get doubleSided(): boolean {
        return !!this.uniforms.doubleSided;
    }

    getUniforms(device: any) {
        if (this._reglUniforms && !this.isDirty()) {
            return this._reglUniforms;
        }
        const uniforms = this.uniforms;
        const realUniforms: ShaderUniforms = {};
        for (const p in uniforms) {
            if (this.isTexture(p)) {
                Object.defineProperty(realUniforms, p, {
                    enumerable: true,
                    configurable: true,
                    get: function () {
                        return (uniforms[p] as AbstractTexture).getREGLTexture(device);
                    }
                });
            } else {
                const descriptor = Object.getOwnPropertyDescriptor(uniforms, p);
                if (descriptor.get) {
                    Object.defineProperty(realUniforms, p, {
                        enumerable: true,
                        configurable: true,
                        get: function () {
                            return uniforms[p];
                        }
                    });
                } else {
                    realUniforms[p] = uniforms[p];
                }
            }
        }
        this._reglUniforms = realUniforms;
        this._uniformVer = this.version;
        return realUniforms;
    }

    getMemorySize() {
        const uniforms = this.uniforms;
        let size = 0;
        for (const p in uniforms) {
            if (this.isTexture(p)) {
                size += (uniforms[p] as AbstractTexture).getMemorySize();
            } else if (this.uniforms[p] && (this.uniforms[p] as any).destroy) {
                size += getTexMemorySize(this.uniforms[p] as Texture);
            }
        }
        return size;
    }

    isReady() {
        return this._loadingCount <= 0;
    }

    hasUniform(k: string) {
        return Object.prototype.hasOwnProperty.call(this.uniforms, k);
    }

    setUniform(k: string, v: ShaderUniformValue) {
        return this.set(k, v);
    }

    getUniform(k: string): ShaderUniformValue {
        return this.get(k);
    }

    set(k: string, v: ShaderUniformValue, isDispose = true): this {
        if (this.get(k) === v) {
            return this;
        }
        const dirty = isNil(this.uniforms[k]) && !isNil(v) ||
            !isNil(this.uniforms[k]) && isNil(v);

        if (this.uniforms[k] && this.isTexture(k) && isDispose) {
            (this.uniforms[k] as AbstractTexture).dispose();
        }
        if (!isNil(v)) {
            this.uniforms[k] = v;
            if (this._reglUniforms) {
                const descriptor = Object.getOwnPropertyDescriptor(this._reglUniforms, k);
                if (descriptor && !descriptor.get) {
                    this._propVerion++;
                    this._reglUniforms[k] = v;
                }
            }
        } else if (!isNil(this.uniforms[k])) {
            // dirty is true in this case
            delete this.uniforms[k];
        }
        if (this.isTexture(k)) {
            this._checkTextures();
        }
        if (dirty) {
            this._genUniformKeys();
            this._incrVersion();
        }
        return this;
    }

    setFunctionUniform(k: string, fn: () => ShaderUniformValue): this {
      this._genUniformKeys();
      this._incrVersion();
      Object.defineProperty(this.uniforms, k, {
        enumerable: true,
        get: fn
      });
      return this;
    }

    hasFunctionUniform(k: string): boolean {
      if (!this.uniforms) {
        return false;
      }
      return Object.prototype.hasOwnProperty.call(this.uniforms, k);
    }

    get(k: string): ShaderUniformValue {
        return this.uniforms[k];
    }

    isDirty() {
        return this._uniformVer !== this.version;
    }

    /**
     * Get shader defines
     * @return {Object}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    appendDefines(defines: ShaderDefines, _geometry: Geometry) {
        const uniforms = this.uniforms;
        if (!uniforms) {
            return defines;
        }
        if (uniforms['jointTexture']) {
            defines['HAS_SKIN'] = 1;
        }
        if (uniforms['morphWeights1']) {
            defines['HAS_MORPH'] = 1;
        }
        if (uniforms['khr_offset'] || uniforms['khr_rotation'] || uniforms['khr_scale']) { //对纹理坐标转换的扩展的支持
            defines['HAS_KHR_TEXTURE_TRANSFORM'] = 1;
        }
        return defines;
    }

    hasSkinAnimation(): boolean {
        return !!(this.uniforms && this.uniforms['jointTexture'] && this.uniforms['skinAnimation']);
    }


    isTexture(k: string) {
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
                if ((u as any).dispose) {
                    (u as AbstractTexture).dispose();
                } else if ((u as any).destroy && !u[KEY_DISPOSED]) {
                    //a normal regl texture
                    (u as Texture).destroy();
                    u[KEY_DISPOSED] = true;
                }
            }
        }
        delete this.uniforms;
        delete this._reglUniforms;
        delete this._bindedOnTextureComplete;
        this._disposed = true;
    }

    isDisposed() {
        return !!this._disposed;
    }

    //@internal
    _checkTextures() {
        this._loadingCount = 0;
        for (const p in this.uniforms) {
            if (this.isTexture(p)) {
                const texture = this.uniforms[p] as AbstractTexture;
                if (!texture.isReady()) {
                    this._loadingCount++;
                    texture.on('complete', this._bindedOnTextureComplete);
                }
            }
        }
    }

    //@internal
    _onTextureComplete() {
        this._loadingCount--;
        this._incrVersion();
        if (this._loadingCount <= 0) {
            if (!this._disposed) {
                (this as any).fire('complete');
            }
        }
    }

    getUniformKeys() {
        return this._uniformKeys;
    }

    //@internal
    _genUniformKeys() {
        const keys: string[] = [];
        for (const p in this.uniforms) {
            if (hasOwn(this.uniforms, p) && !isNil(this.uniforms[p])) {
                keys.push(p);
            }
        }
        this._uniformKeys = keys.join();
    }

    //@internal
    _incrVersion() {
        this._version++;
    }
}
