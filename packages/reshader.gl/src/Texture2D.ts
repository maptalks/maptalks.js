import parseRGBE from './common/HDR.js';
import { isArray } from './common/Util.js';
import { default as Texture, REF_COUNT_KEY } from './AbstractTexture.js';
import { getUniqueTexture } from './common/REGLHelper.js';
import REGL, { Regl } from '@maptalks/regl';

/**
 * config properties:
 * https://github.com/regl-project/regl/blob/gh-pages/API.md#textures
 */
class Texture2D extends Texture {
    rgbmRange?: number

    onLoad({ data }) {
        const config = this.config;
        if (!config) {
            //disposed
            return;
        }
        if (config.hdr) {
            data = parseRGBE(data.data, 0, config.maxRange);
            if (!data) {
                throw new Error('Invalid hdr data' + (config.url ? ':' + config.url : ''));
            } else {
                this.rgbmRange = data.rgbmRange;
                config.data = data.pixels;
            }
        } else {
            config.data = data;
        }
        //refresh width / height
        config.width = config.width || data.width;
        config.height = config.height || data.height;
        this._updateREGL();
    }

    createREGLTexture(regl: Regl): REGL.Texture2D {
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
}

export default Texture2D;
