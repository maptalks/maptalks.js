import VectorTilePlugin from './VectorTilePlugin';
import Color from 'color';

/**
 * Create a VT Plugin with a given painter
 */
function createPainterPlugin(type, Painter) {
    const PainterPlugin = VectorTilePlugin.extend(type, {

        startFrame(context) {
            const { layer, regl, sceneConfig } = context;
            let painter = this.painter;
            if (!painter) {
                painter = this.painter = new Painter(regl, layer, sceneConfig);
            }
            //先清除所有的tile mesh, 在后续的paintTile中重新加入，每次只绘制必要的tile
            painter.clear();
        },

        endFrame(context) {
            const painter = this.painter;
            if (painter) {
                return painter.paint(context);
            }
            return null;
        },

        paintTile(context) {
            const { tileCache, tileData, tileInfo, tileTransform, tileZoom } = context;
            const painter = this.painter;
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
                tileCache.geometry = painter.createGeometry(extend({}, glData, { colors }), features);
            }
            let mesh = painter.getMesh(key);
            if (!mesh) {
                mesh = painter.addMesh(key, tileCache.geometry, tileTransform);
            }
            mesh.setUniform('level', Math.abs(tileInfo.z - tileZoom));
            return {
                'redraw' : false
            };
        },

        updateSceneConfig({ sceneConfig }) {
            const painter = this.painter;
            if (painter) {
                painter.updateSceneConfig(sceneConfig);
            }
        },

        pick(x, y) {
            return this.painter.pick(x, y);
        },

        deleteTile(context) {
            const { tileCache, tileInfo } = context;
            if (!tileCache.painted) {
                return;
            }
            const painter = this.painter;
            if (painter) {
                painter.delete(tileInfo.dupKey);
            }
        },

        remove() {
            const painter = this.painter;
            if (painter) {
                painter.remove();
                delete this.painter;
            }
        },

        resize(size) {
            const painter = this.painter;
            if (painter) {
                painter.resize(size);
            }
        },

        needToRedraw() {
            if (!this.painter) {
                return false;
            }
            return this.painter.needToRedraw();
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

    return PainterPlugin;
}

export default createPainterPlugin;

export function extend(dest) {
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
        for (const k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}
