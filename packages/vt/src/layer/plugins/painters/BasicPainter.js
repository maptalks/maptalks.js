import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { extend, isNil } from '../Util';
import { isObjectEmpty } from './util/is_obj_empty';

export default class BasicPainter extends Painter {

    createGeometry(glData, features) {
        const debugTileData = this.layer.options['debugTileData'];
        if (debugTileData && !isNil(debugTileData.x)) {
            const { x, y, z } = glData.tileInfo;
            if (debugTileData.x === x && debugTileData.y === y && debugTileData.z === z) {
                console.log('glData', {
                    'layerId': this.layer.getId(),
                    x,
                    y,
                    z,
                    glData
                });
            }
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
        const desc = { primitive: this.getPrimitive(), positionSize: glData.positionSize };
        if (data.aAltitude) {
            desc.altitudeAttribute = 'aAltitude';
        }
        const geometry = new reshader.Geometry(data, glData.indices, 0, desc);
        geometry.properties = {
            features,
            // Vector3DLayer中需要保存elements来实现show hide
            // elements: glData.indices
        };
        if (glData.iconAtlas) {
            geometry.properties.iconAtlas = glData.iconAtlas.image;
            geometry.properties.iconPositions = glData.iconAtlas.positions;
        }
        if (glData.glyphAtlas) {
            geometry.properties.glyphAtlas = glData.glyphAtlas.image;
        }
        if (!isObjectEmpty(features)) {
            // aPickingId 中存放的是 KEY_IDX 的值，Vector3DLayer中如果一个feature有多个symbol，feature.id相同但pickingId不同
            // aFeaIds 存放的是 feature.id
            geometry.properties.aFeaIds = glData.featureIds;
            this._prepareFeatureIds(geometry, glData);
        }
        if (glData.markerPlacement) {
            geometry.properties.markerPlacement = glData.markerPlacement;
        }
        if (glData.textPlacement) {
            geometry.properties.textPlacement = glData.textPlacement;
        }
        extend(geometry.properties, glData.properties);
        return {
            geometry,
            symbolIndex: glData.symbolIndex
        };
    }

    getRayCastData(mesh, indiceIndex) {
        const { features, aFeaIds } = mesh.geometry.properties;
        if (!features || !aFeaIds) {
            return null;
        }
        const id = aFeaIds[indiceIndex];
        return features[id];
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
            const ctx = debug.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.putImageData(
                new ImageData(data, iconAtlas.width, iconAtlas.height),
                0,
                0
            );
        }
    }
}
