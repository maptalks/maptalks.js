import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { extend } from '../Util';

export default class BasicPainter extends Painter {
    createGeometry(glData, features) {
        if (!glData) {
            return null;
        }
        if (glData.iconAtlas && glData.iconAtlas.image) {
            glData.iconAtlas.image.dataType = glData.type;
            glData.iconAtlas.image.type = 'icon';
        }
        if (glData.glyphAtlas && glData.glyphAtlas.image) {
            glData.glyphAtlas.image.type = 'glyph';
        }
        const data = extend({}, glData.data);
        const geometry = new reshader.Geometry(data, glData.indices);
        geometry.properties = {
            features,
            symbolDef: glData.symbol
        };
        if (glData.iconAtlas) {
            geometry.properties.iconAtlas = glData.iconAtlas.image;
        }
        if (glData.glyphAtlas) {
            geometry.properties.glyphAtlas = glData.glyphAtlas.image;
        }
        extend(geometry.properties, glData.properties);
        return geometry;
    }

    getRenderFBO(context) {
        //优先采用不aa的fbo
        return context && context.renderTarget && context.renderTarget.fbo;
    }

    supportRenderMode(mode) {
        return mode === 'noAa';
    }

    createAtlasTexture(atlas, flipY) {
        const regl = this.regl;
        const image = atlas;
        const config = {
            width: image.width,
            height: image.height,
            data: image.data,
            format: image.format,
            mag: 'linear', //very important
            min: 'linear', //very important
            flipY,
        };
        if (atlas.type === 'icon') {
            const wrapMode = (atlas.dataType !== 'point') ? 'repeat' : 'clamp';
            config['wrapS'] = wrapMode;
            config['wrapT'] = wrapMode;
        }
        return regl.texture(config);
    }

    drawDebugAtlas(iconAtlas) {
        if (document.getElementById('MAPTALKS_ICON_DEBUG')) {
            const debug = document.getElementById('MAPTALKS_ICON_DEBUG');
            debug.width = iconAtlas.width;
            debug.height = iconAtlas.height;
            debug.style.width = iconAtlas.width + 'px';
            debug.style.height = iconAtlas.height + 'px';
            debug.getContext('2d').putImageData(
                new ImageData(new Uint8ClampedArray(iconAtlas.data), iconAtlas.width, iconAtlas.height),
                0,
                0
            );
        }
    }
}
