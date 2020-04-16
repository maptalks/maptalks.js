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
            features
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
        return context && context.renderTarget && (context.renderTarget.noAaFbo || context.renderTarget.fbo);
    }

    needAA() {
        return false;
    }

    createAtlasTexture(atlas) {
        const regl = this.regl;
        const image = atlas;
        const config = {
            width: image.width,
            height: image.height,
            data: image.data,
            format: image.format,
            mag: 'linear', //very important
            min: 'linear', //very important
            flipY: true,
        };
        if (atlas.type === 'icon') {
            const wrapMode = (atlas.dataType !== 'point') ? 'repeat' : 'clamp';
            config['wrapS'] = wrapMode;
            config['wrapT'] = wrapMode;
        }
        return regl.texture(config);
    }
}
