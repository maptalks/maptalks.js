import parseRGBE from './common/HDR';
import { isArray, isFunction, isPowerOfTwo, resizeToPowerOfTwo, supportNPOT } from './common/Util';
import { default as Texture, REF_COUNT_KEY } from './AbstractTexture';
import { getTextureMagFilter, getTextureMinFilter, getUniqueTexture } from './common/REGLHelper';
import REGL, { Regl } from '@maptalks/regl';
import DataUtils from './common/DataUtils';
import { KEY_DISPOSED } from './common/Constants';
import { MAG_FILTER, MIN_FILTER } from './common/WebGLConstants';

/**
 * config properties:
 * https://github.com/regl-project/regl/blob/gh-pages/API.md#textures
 */
export default class Texture2D extends Texture {
    _version = 0;

    get version() {
        return this._version;
    }

    set version(version) {
        throw new Error('Texture2D.version is read only.');
    }

    onLoad({ data }) {
        const config = this.config;
        if (!config) {
            //disposed
            return;
        }
        if (config.hdr) {
            data = parseRGBE(data.data, 0);
            if (!data) {
                throw new Error('Invalid hdr data' + (config.url ? ':' + config.url : ''));
            } else {
                const uint16 = new Uint16Array(data.pixels.length)
                for (let i = 0; i < data.pixels.length; i++) {
                    uint16[i] = Math.min(DataUtils.toHalfFloat(data.pixels[i]), 65504);
                }
                config.data = uint16;
                config.type = 'float16';
                config.colorSpace = 'browser';
                config.min = 'linear';
                config.mag = 'linear';
            }
        } else {
            config.data = data;
        }
        //refresh width / height
        config.width = config.width || data.width;
        config.height = config.height || data.height;
        if (this._regl) {
            this._checkNPOT(this._regl);
        }
        this._update();
    }

    setConfig(config) {
        const data = config.data;
        config.image = data;
        config.width = config.width || data.width;
        config.height = config.height || data.height;
        this.config = config;
        this.dirty = !!this._texture;
    }

    //@internal
    _update() {
        if (this._texture && !this._texture[KEY_DISPOSED]) {
            this._version++;
            if (isFunction(this._texture)) {
                this._texture(this.config as any);
            } else {
                (this._texture as any).update(this.config);
            }
        }
        this.dirty = false;
    }

    setMinFilter(value: number) {
        this.config.min = getTextureMinFilter(value);
        if (this._texture && (this._texture as any).updateFilter) {
            (this._texture as any).updateFilter();
        }
        if (this._texture && (this._texture as any).texParameteri) {
            (this._texture as any).texParameteri(MIN_FILTER, value);
        }
    }

    setMagFilter(value: number) {
        this.config.mag = getTextureMagFilter(value);
        if (this._texture && (this._texture as any).updateFilter) {
            (this._texture as any).updateFilter();
        }
        if (this._texture && (this._texture as any).texParameteri) {
            (this._texture as any).texParameteri(MAG_FILTER, value);
        }
    }

    createREGLTexture(regl: Regl): REGL.Texture2D {
        this._regl = regl;
        this._checkNPOT(regl);
        if (isArray(this.config.data) || isArray(this.config.mipmap)) {
            const tex = getUniqueTexture(regl, this.config);
            if (!tex[REF_COUNT_KEY]) {
                tex[REF_COUNT_KEY] = 0;
            }
            tex[REF_COUNT_KEY]++;
            return tex;
        }
        return regl.texture(this.config);
    }

    _checkNPOT(regl) {
        const config = this.config;
        if (config.data && this._needPowerOf2(regl)) {
            if ((config.data instanceof Image)) {
                config.data = resizeToPowerOfTwo(config.data);
                config.width = (config.data as any).width;
                config.height = (config.data as any).height;
            } else if (!config.hdr && isArray(config.data) && (!isPowerOfTwo(config.width) || !isPowerOfTwo(config.height))) {
                config.data = resizeToPowerOfTwo(config.data as any, config.width, config.height);
                config.width = (config.data as any).width;
                config.height = (config.data as any).height;
            }
        }
    }

    //@internal
    _needPowerOf2(regl) {
        if (supportNPOT(regl)) {
            return false;
        }
        const config = this.config;
        const isRepeat = config.wrap && config.wrap !== 'clamp' || config.wrapS && config.wrapS !== 'clamp' ||
            config.wrapT && config.wrapT !== 'clamp';
        return isRepeat || config.min && config.min !== 'nearest' && config.min !== 'linear';
    }
}
