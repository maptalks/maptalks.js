import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { extend, getUniqueIds } from '../Util';

export default class BasicPainter extends Painter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig) {
        super(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig);
    }


    createGeometry(glData, features) {
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
            // Vector3DLayer中需要保存elements来实现show hide
            elements: glData.indices
        };
        if (glData.iconAtlas) {
            geometry.properties.iconAtlas = glData.iconAtlas.image;
        }
        if (glData.glyphAtlas) {
            geometry.properties.glyphAtlas = glData.glyphAtlas.image;
        }
        // aPickingId 中存放的是 KEY_IDX 的值，Vector3DLayer中如果一个feature有多个symbol，feature.id相同但pickingId不同
        // aFeaIds 存放的是 feature.id
        geometry.properties.aFeaIds = glData.featureIds;
        // collideIds 用于碰撞检测，同一个数据的多symbol会生成多个mesh，不同的mesh中元素的collideId相同时，则认为共享一个检测结果
        // collideIds 优先用 aFeaIds，没有 aFeaIds 时，则用 aPickingId
        // 但 markerPlacement 为 line 时，iconPainter会重新生成 collideIds 和 uniqueCollideIds
        geometry.properties.collideIds = glData.featureIds && glData.featureIds.length ? glData.featureIds : glData.data.aPickingId;
        // uniqueCollideIds 是 collideIds 去重后的值，碰撞检测时对其遍历，按每个值来计算检测结果
        geometry.properties.uniqueCollideIds = getUniqueIds(geometry.properties.collideIds);
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
