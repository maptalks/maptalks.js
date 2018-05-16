import VectorTilePlugin from 'maptalks.vt.base';
import PBRScenePainter from './PBRScenePainter';
import Color from 'color';
import { extend } from './Util.js';

const PBRPlugin = VectorTilePlugin.extend('pbr', {

    startFrame(context) {
        const { regl, sceneCache, sceneConfig } = context;
        let painter = sceneCache.painter;
        if (!painter) {
            painter = sceneCache.painter = new PBRScenePainter(regl, sceneConfig);
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
            const features = tileData.features,
                indexes = glData.indexes;
            const colors = this._generateColorArray(features, indexes, glData.indices, glData.vertices);
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

    raypicking(sceneCache, x, y) {

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

    _generateColorArray(features, indexes, indices, vertices) {
        const colors = new Float32Array(vertices.length);
        let symbol, color, rgb;
        let start, end, pos;
        for (let i = 0, l = indexes.length; i < l; i++) {
            symbol = features[i].symbol;
            color = Color(symbol.polygonFill);
            rgb = color.unitArray();
            // colors.push(rgb[0], rgb[1], rgb[2], op);
            start = i === 0 ? 0 : indexes[i - 1];
            end = indexes[i];
            for (let ii = start; ii < end; ii++) {
                pos = indices[ii] * 3;
                colors[pos] = rgb[0];
                colors[pos + 1] = rgb[1];
                colors[pos + 2] = rgb[2];
            }
        }
        return colors;
    }

    // _generateColorArray(features, indexes, indices, vertices) {
    //     const colors = new Float32Array(vertices.length * 4 / 3);
    //     let symbol, color, rgb, op;
    //     let start, end, pos;
    //     for (let i = 0, l = indexes.length; i < l; i++) {
    //         symbol = features[i].symbol;
    //         color = Color(symbol.polygonFill);
    //         op = 1;
    //         if (symbol.polygonOpacity != null) {
    //             op = symbol.polygonOpacity;
    //         }
    //         rgb = color.unitArray();
    //         // colors.push(rgb[0], rgb[1], rgb[2], op);
    //         start = i === 0 ? 0 : indexes[i - 1];
    //         end = indexes[i];
    //         for (let ii = start; ii < end; ii++) {
    //             pos = indices[ii] * 4;
    //             colors[pos] = rgb[0];
    //             colors[pos + 1] = rgb[1];
    //             colors[pos + 2] = rgb[2];
    //             colors[pos + 3] = op;
    //         }
    //     }
    //     return colors;
    // }
});

export default PBRPlugin;
