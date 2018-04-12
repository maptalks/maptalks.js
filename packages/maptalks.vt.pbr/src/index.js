import VectorTilePlugin from 'maptalks.vt.base';
import PBRScenePainter from './PBRScenePainter';
import Color from 'color';

const PBRPlugin = VectorTilePlugin.extend('pbr', {

    startFrame(context) {
        const { regl, sceneCache, sceneConfig } = context;
        if (!sceneCache.painter) {
            sceneCache.painter = new PBRScenePainter(regl, sceneConfig);
        }
        //先清除所有的tile mesh, 在后续的paintTile中重新加入，每次只绘制必要的tile
        sceneCache.painter.clear();
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
        if (!tileCache.mesh) {
            const features = tileData.features,
                indexes = tileData.data.indexes;
            const colors = this._generateColorArray(features, indexes, tileData.data.indices, tileData.data.vertices);
            tileCache.mesh = painter.createMesh(key, {
                aPosition : tileData.data.vertices,
                // aTexCoord : tileData.data.uvs,
                aNormal : tileData.data.normals,
                aColor : colors
            }, tileData.data.indices);
        }
        let mesh = painter.getMesh(key);
        if (!mesh) {
            mesh = tileCache.mesh;
            painter.addMesh(key, mesh);
        }
        mesh.setLocalTransform(tileTransform);
        return {
            'redraw' : false
        };
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
        }
    },

    resize(sceneCache, size) {

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
