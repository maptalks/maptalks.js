import Eventable from './common/Eventable';
import { isNil, extend1, hasOwn, getTexMemorySize } from './common/Util';
import AbstractTexture from './AbstractTexture';
import { KEY_DISPOSED } from './common/Constants';
import { ShaderUniforms, ShaderUniformValue, ShaderDefines } from './types/typings';
import { Regl, Texture } from '@maptalks/regl';
import Geometry from './Geometry';

class Base {}

class Material extends Eventable(Base) {
    uniforms: ShaderUniforms
    refCount: number
    private _version: number
    private _uniformVer?: number
    private _uniformKeys?: string
    private _reglUniforms: ShaderUniforms
    private _bindedOnTextureComplete: () => void
    private _doubleSided: boolean
    private _loadingCount?: number
    private _dirtyProps?: string[]
    private _disposed?: boolean

    constructor(uniforms: ShaderUniforms = {}, defaultUniforms: ShaderUniforms) {
        super()
        this._version = 0;
        this.uniforms = extend1({}, defaultUniforms || {}, uniforms);
        for (const p in uniforms) {
            const getter = Object.getOwnPropertyDescriptor(uniforms, p).get;
            if (getter) {
                Object.defineProperty(this.uniforms, p, {
                    get: getter
                });
            }
        }
        this._reglUniforms = {};
        this.refCount = 0;
        this._bindedOnTextureComplete = this._onTextureComplete.bind(this);
        this._genUniformKeys();
        this._checkTextures();
    }

    set version(v: number) {
        throw new Error('Material.version is read only.');
    }

    get version(): number {
        return this._version;
    }

    set doubleSided(value: boolean) {
        this._doubleSided = value;
    }

    get doubleSided(): boolean {
        return this._doubleSided;
    }

    isReady() {
        return this._loadingCount <= 0;
    }

    set(k: string, v: ShaderUniformValue): this {
        const dirty = isNil(this.uniforms[k]) && !isNil(v) ||
            !isNil(this.uniforms[k]) && isNil(v);

        if (this.uniforms[k] && this.isTexture(k)) {
            (this.uniforms[k] as AbstractTexture).dispose();
        }
        if (!isNil(v)) {
            this.uniforms[k] = v;
            if (this._reglUniforms) {
                const descriptor = Object.getOwnPropertyDescriptor(this._reglUniforms, k);
                if (descriptor && !descriptor.get) {
                    this._dirtyProps = this._dirtyProps || [];
                    this._dirtyProps.push(k);
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

    _getDirtyProps(): string[] {
        return this._dirtyProps;
    }

    _clearDirtyProps() {
        this._dirtyProps = null;
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
    //eslint-disable-next-line
    appendDefines(defines: ShaderDefines, geometry: Geometry) {
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

    getUniforms(regl: Regl) {
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
                        return (uniforms[p] as AbstractTexture).getREGLTexture(regl);
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
        this._disposed = true;
    }

    isDisposed() {
        return !!this._disposed;
    }

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

    _genUniformKeys() {
        const keys: string[] = [];
        for (const p in this.uniforms) {
            if (hasOwn(this.uniforms, p) && !isNil(this.uniforms[p])) {
                keys.push(p);
            }
        }
        this._uniformKeys = keys.join();
    }

    _incrVersion() {
        this._version++;
    }

    getMemorySize() {
        const uniforms = this.uniforms;
        let size = 0;
        for (const p in uniforms) {
            if (this.isTexture(p)) {
                size += (uniforms[p] as AbstractTexture).getMemorySize();
            } else if ((this.uniforms[p] as any).destroy) {
                size += getTexMemorySize(this.uniforms[p]);
            }
        }
        return size;
    }
}

export default Material;
