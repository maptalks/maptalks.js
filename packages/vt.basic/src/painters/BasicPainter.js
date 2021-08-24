import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { extend } from '../Util';

export default class BasicPainter extends Painter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig) {
        super(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig);
    }

    createGeometry(glData, features) {
        if (!glData) {
            return null;
        }
        if (Array.isArray(glData)) {
            const geometries = [];
            for (let i = 0; i < glData.length; i++) {
                if (glData[i].ref !== undefined) {
                    geometries.push({
                        geometry: geometries[glData[i].ref].geometry,
                        symbolIndex: glData[i].symbolIndex,
                        ref: glData[i].ref
                    });
                } else {
                    geometries.push(this.createGeometry(glData[i], features));
                }
            }
            return geometries;
        }
        if (!glData.data) {
            return {
                geometry: null,
                symbolIndex: glData.symbolIndex
            };
        }
        if (glData.iconAtlas && glData.iconAtlas.image) {
            glData.iconAtlas.image.dataType = glData.type;
            glData.iconAtlas.image.type = 'icon';
        }
        if (glData.glyphAtlas && glData.glyphAtlas.image) {
            glData.glyphAtlas.image.type = 'glyph';
        }
        const data = extend({}, glData.data);
        const geometry = new reshader.Geometry(data, glData.indices, 0, { primitive: this.getPrimitive(), positionSize: glData.positionSize });
        geometry.properties = {
            features,
            uniquePickingIds: features ? Object.keys(features) : [],
            // Vector3DLayer中需要保存elements来实现show hide
            elements: glData.indices
        };
        if (glData.iconAtlas) {
            geometry.properties.iconAtlas = glData.iconAtlas.image;
        }
        if (glData.glyphAtlas) {
            geometry.properties.glyphAtlas = glData.glyphAtlas.image;
        }
        extend(geometry.properties, glData.properties);
        return {
            geometry,
            symbolIndex: glData.symbolIndex
        };
    }

    getPrimitive() {
        return 'triangles';
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
            let data;
            if (iconAtlas.format === 'alpha') {
                data = new Uint8ClampedArray(iconAtlas.data.length * 4);
                for (let i = 0; i < iconAtlas.data.length; i++) {
                    data[i * 4 + 3] = iconAtlas.data[i];
                }
            } else {
                data = new Uint8ClampedArray(iconAtlas.data);
            }
            debug.getContext('2d').putImageData(
                new ImageData(data, iconAtlas.width, iconAtlas.height),
                0,
                0
            );
        }
    }
}
