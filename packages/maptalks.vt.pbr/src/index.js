import VectorTilePlugin from '@maptalks/vt.base';
import PBRScenePainter from './PBRScenePainter';
import Color from 'color';
import { extend } from './Util.js';
import * as maptalks from '@maptalks/vt';

const PBRPlugin = VectorTilePlugin.extend('pbr', {

    startFrame(context) {
        const { layer, regl, sceneCache, sceneConfig } = context;
        let painter = sceneCache.painter;
        if (!painter) {
            painter = sceneCache.painter = new PBRScenePainter(regl, layer, sceneConfig);
        }
        //先清除所有的tile mesh, 在后续的paintTile中重新加入，每次只绘制必要的tile
        painter.clear();
    },

    endFrame(context) {
        const { layer, sceneCache } = context;
        if (!sceneCache) {
            return null;
        }
        const painter = sceneCache.painter;
        if (painter) {
            return painter.paint(layer);
        }
        return null;
    },

    paintTile(context) {
        const { sceneCache, tileCache, tileData, tileInfo, tileTransform } = context;
        const painter = sceneCache.painter;
        if (!painter) {
            return {
                redraw : false
            };
        }
        const key = tileInfo.dupKey;
        if (!tileCache.geometry) {
            const glData = tileData.data;
            const features = tileData.features;
            const colors = this._generateColorArray(features, glData.featureIndexes, glData.indices, glData.vertices);
            tileCache.geometry = painter.createGeometry(extend({}, glData, { colors }));
        }
        let mesh = painter.getMesh(key);
        if (!mesh) {
            mesh = painter.addMesh(key, tileCache.geometry, tileTransform);
        }
        return {
            'redraw' : false
        };
    },

    updateSceneConfig({ sceneCache, sceneConfig }) {
        let { painter } = sceneCache;
        if (painter) {
            painter.updateSceneConfig(sceneConfig);
        }
    },

    picking(sceneCache, x, y) {
        let { painter } = sceneCache;
        painter.pick(x, y);
    },

    deleteTile(context) {
        const { sceneCache, tileCache, tileInfo } = context;
        if (!tileCache.painted) {
            return;
        }
        const painter = sceneCache.painter;
        if (painter) {
            painter.delete(tileInfo.dupKey);
        }
    },

    remove(context) {
        const { sceneCache } = context;
        if (!sceneCache) {
            return;
        }
        const painter = sceneCache.painter;
        if (painter) {
            painter.remove();
            delete sceneCache.painter;
        }
    },

    resize(sceneCache, size) {

    },

    needToRedraw(sceneCache) {
        const { painter } = sceneCache;
        if (!painter) {
            return false;
        }
        return painter.needToRedraw();
    },

    _generateColorArray(features, featureIndexes, indices, vertices) {
        const colors = new Uint8Array(vertices.length);
        let symbol, rgb;
        const visitedColors = {};
        let pos;
        for (let i = 0, l = featureIndexes.length; i < l; i++) {
            const idx = featureIndexes[i];
            symbol = features[idx].symbol;
            rgb = visitedColors[idx];
            if (!rgb) {
                const color = Color(symbol.polygonFill);
                rgb = visitedColors[idx] = color.array();
            }
            pos = indices[i] * 3;
            colors[pos] = rgb[0];
            colors[pos + 1] = rgb[1];
            colors[pos + 2] = rgb[2];

        }
        return colors;
    }
});

PBRPlugin.registerAt(maptalks.VectorTileLayer);

export default PBRPlugin;
