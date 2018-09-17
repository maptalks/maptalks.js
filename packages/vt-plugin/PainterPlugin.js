import VectorTilePlugin from './VectorTilePlugin';
import Color from 'color';

/**
 * Create a VT Plugin with a given painter
 */
function createPainterPlugin(type, Painter) {
    const PainterPlugin = VectorTilePlugin.extend(type, {

        init() {
        },

        startFrame(context) {
            const { layer, regl, sceneConfig } = context;
            let painter = this.painter;
            if (!painter) {
                painter = this.painter = new Painter(regl, layer, sceneConfig);
            }
            //先清除所有的tile mesh, 在后续的paintTile中重新加入，每次只绘制必要的tile
            painter.clear();
            this._meshCache = {};
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
                const data = extend({}, glData);
                if (colors) {
                    data.colors = colors;
                }
                tileCache.geometry = painter.createGeometry(data, features);
            }
            let mesh = this._getMesh(key);
            if (!mesh) {
                mesh = painter.addMesh(tileCache.geometry, tileTransform);
                this._meshCache[key] = mesh;
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
            if (this.painter && this.painter.pick) {
                return this.painter.pick(x, y);
            }
            return null;
        },

        deleteTile(context) {
            const { tileInfo } = context;
            const key = tileInfo.dupKey;
            const mesh = this._meshCache[key];
            if (mesh && this.painter) {
                this.painter.deleteMesh(mesh);
            }
            delete this._meshCache[key];
        },

        remove() {
            const painter = this.painter;
            if (painter) {
                for (const key in this._meshCache) {
                    painter.deleteMesh(this._meshCache[key]);
                }
                painter.remove();
                delete this.painter;
            }
            delete this._meshCache;
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
            if (!vertices) {
                return null;
            }
            const colors = new Uint8Array(vertices.length);
            let symbol, rgb;
            const visitedColors = {};
            let pos;
            for (let i = 0, l = featureIndexes.length; i < l; i++) {
                const idx = featureIndexes[i];
                symbol = features[idx].symbol;
                rgb = visitedColors[idx];
                if (!rgb) {
                    const color = Color(symbol[this.painter.colorSymbol]);
                    rgb = visitedColors[idx] = color.array();
                }
                pos = indices[i] * 3;
                colors[pos] = rgb[0];
                colors[pos + 1] = rgb[1];
                colors[pos + 2] = rgb[2];

            }
            return colors;
        },

        _getMesh(key) {
            return this._meshCache[key];
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
