import * as maptalks from 'maptalks';
import { mat4, vec3 } from '@mapbox/gl-matrix';
import WorkerConnection from './worker/WorkerConnection';
import { EXTENT, EMPTY_VECTOR_TILE } from '../core/Constant';
import { sign } from '../core/Util';
import createREGL from 'regl';

class VectorTileLayerRenderer extends maptalks.renderer.TileLayerCanvasRenderer {

    constructor(layer) {
        super(layer);
        this._initPlugins();
        this.ready = false;
        this.sceneCache = {};
    }

    updateStyle() {
        if (this.workerConn) {
            this.workerConn.updateStyle(this.layer.getId(), this.layer.getStyle(), err => {
                if (err) throw new Error(err);
                this.clear();
                this.setToRedraw();
            });
        }
    }

    //always redraw when map is interacting
    needToRedraw() {
        const redraw = super.needToRedraw();
        if (!redraw) {
            for (let i = 0; i < this.plugins.length; i++) {
                if (this.plugins[i].needToRedraw()) {
                    return true;
                }
            }
        }
        return redraw;
    }

    createContext() {
        const attributes = this.layer.options.glOptions || {
            alpha: true,
            depth: true,
            stencil: true,
            antialias: true,
        };
        attributes.preserveDrawingBuffer = true;
        attributes.stencil = true;
        this.glOptions = attributes;
        this.gl = this._createGLContext(this.canvas, attributes);
        // console.log(this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS));
        this.prepareWorker();
        this.layer.on('renderstart', this.renderTileClippingMasks, this);
        this.regl = createREGL({
            gl : this.gl,
            extensions : [
                // 'ANGLE_instanced_arrays',
                'OES_texture_float',
                'OES_element_index_uint',
                'OES_standard_derivatives'
            ],
            optionalExtensions : this.layer.options['glExtensions'] || ['WEBGL_draw_buffers']
        });
    }

    prepareWorker() {
        const map = this.getMap();
        if (!this.workerConn) {
            this.workerConn = new WorkerConnection('maptalks.vt', map);
        }
        const workerConn = this.workerConn;
        //setTimeout in case layer's style is set to layer after layer's creating.
        setTimeout(() => {
            if (!workerConn.isActive()) {
                return;
            }
            const options = this.layer.getWorkerOptions() || {};
            const id = this.layer.getId(), type = this.layer.getJSONType();
            workerConn.addLayer(id, type, options, err => {
                if (err) throw err;
                if (!this.layer) return;
                this.ready = true;
                this.layer.fire('workerready');
                this.setToRedraw();
            });
        }, 1);
    }

    clearCanvas() {
        super.clearCanvas();
        if (this.glOptions.depth) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT);
        } else {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT);
        }
    }

    isDrawable() {
        return true;
    }

    checkResources() {
        const result = [];
        return result;
    }

    renderTileClippingMasks() {
        // const grid = this.layer.getTiles();
        // if (!grid) return;

        // for (const coord of grid.tiles) {
        //     coord.posMatrix = this.calculateTileMatrix(coord);
        // }

        // this.painter.renderTileClippingMasks(grid.tiles);
    }

    draw() {
        this.prepareCanvas();
        if (!this.ready) {
            this.completeRender();
            return;
        }
        this._frameTime = maptalks.Util.now();
        this._zScale = this._getMeterScale(this.getMap().getGLZoom()); // scale to convert meter to gl point
        this.startFrame();
        super.draw();
        this.endFrame();
        // TODO: shoule be called in parent
        // this.completeRender();
    }

    drawOnInteracting() {
        if (!this.ready) {
            this.completeRender();
            return;
        }
        this.startFrame();
        super.drawOnInteracting();
        this.endFrame();
    }

    loadTile(tileInfo) {
        const map = this.getMap();
        const glScale = map.getGLScale(tileInfo.z);
        this.workerConn.loadTile(this.layer.getId(), { tileInfo, glScale, zScale : this._zScale }, (err, data) => {
            if (err) this.onTileError(EMPTY_VECTOR_TILE, tileInfo);
            if (!data) {
                this.onTileLoad({ _empty : true }, tileInfo);
                return;
            }
            //restore features for plugin data
            const features = data.features;
            //iterate plugins
            for (const p in data.data) {
                const pluginData = data.data[p]; // { data, featureIndex }
                const symbols = this.layer.getStyle()[p].style;//TODO 读取所有的symbol
                const feaIndex = pluginData.featureIndex;
                const pFeatures = new Array(feaIndex.length / 2);
                //[feature index, style index]
                for (let i = 1, l = feaIndex.length; i < l; i += 2) {
                    pFeatures[(i - 1) / 2] = {
                        feature : features[feaIndex[i - 1]],
                        symbol : symbols[feaIndex[i]].symbol
                    };
                }
                delete pluginData.featureIndex;
                pluginData.features = pFeatures;
            }
            this.onTileLoad(data.data, tileInfo);
        });
        return {};
    }

    startFrame() {
        this.plugins.forEach(plugin => {
            const type = plugin.getType();
            if (!this.sceneCache[type]) {
                this.sceneCache[type] = {};
            }
            plugin.startFrame({
                regl : this.regl,
                layer : this.layer,
                gl : this.gl,
                sceneCache : this.sceneCache[type],
                sceneConfig : plugin.config.sceneConfig
            });
        });
    }

    endFrame() {
        this.plugins.forEach(plugin => {
            const type = plugin.getType();
            const status = plugin.endFrame({
                regl : this.regl,
                layer : this.layer,
                gl : this.gl,
                sceneCache : this.sceneCache[type],
                sceneConfig : plugin.config.sceneConfig
            });
            if (status && status.redraw) {
                //let plugin to determine when to redraw
                this.setToRedraw();
            }
        });
    }

    drawTile(tileInfo, tileData) {
        if (!tileData.loadTime || tileData._empty) return;
        let tileCache = tileData.cache;
        if (!tileCache) {
            tileCache = tileData.cache = {};
        }
        const tileTransform = this.calculateTileMatrix(tileInfo);
        this.plugins.forEach(plugin => {
            const type = plugin.getType();
            if (!tileData[type]) {
                return;
            }
            if (!tileCache[type]) {
                tileCache[type] = {};
            }
            const param = {
                regl : this.regl,
                layer : this.layer,
                gl : this.gl,
                sceneCache : this.sceneCache[type],
                sceneConfig : plugin.config.sceneConfig,
                tileCache : tileCache[type],
                tileData : tileData[type],
                t : this._frameTime - tileData.loadTime,
                tileInfo, tileTransform
            };
            const status = plugin.paintTile(param);
            if (status && status.redraw) {
                //let plugin to determine when to redraw
                this.setToRedraw();
            }
        });
        this.setCanvasUpdated();
    }

    picking(x, y) {
        const hits = [];
        this.plugins.forEach(plugin => {
            const type = plugin.getType();
            if (this.sceneCache[type]) {
                const feature = plugin.picking(this.sceneCache[type], x, y);
                if (feature) hits.push(feature);
            }
        });
        return hits;
    }

    deleteTile(tile) {
        if (!tile) {
            return;
        }
        if (tile.image && !tile.image._empty) {
            this.plugins.forEach(plugin => {
                const type = plugin.getType();
                plugin.deleteTile({
                    regl : this.regl,
                    layer : this.layer,
                    gl : this.gl,
                    sceneCache : this.sceneCache[type],
                    tileCache : tile.image.cache ? tile.image.cache[type] : {},
                    tileInfo : tile.info,
                    tileData : tile.image
                });
            });
        }
        //ask plugin to clear caches
        super.deleteTile(tile);
    }

    resizeCanvas(canvasSize) {
        super.resizeCanvas(canvasSize);
        let cache = this.sceneCache;
        if (!cache) {
            cache = this.sceneCache = {};
        }
        const size = new maptalks.Size(this.canvas.width, this.canvas.height);
        this.plugins.forEach(plugin => {
            const type = plugin.getType();
            if (!cache[type]) {
                cache[type] = {};
            }
            plugin.resize(cache[type], size);
        });
    }

    onRemove() {
        this.plugins.forEach(plugin => {
            plugin.remove();
        });
        // const map = this.getMap();
        if (this.workerConn) {
            this.workerConn.removeLayer(this.layer.getId(), err => {
                if (err) throw err;
            });
            this.workerConn.remove();
            delete this.workerConn;
        }

        this.layer.off('renderstart', this.renderTileClippingMasks, this);
        delete this.sceneCache;

        if (super.onRemove) super.onRemove();

    }

    hitDetect(point) {
        return false;
        if (!this.gl) {
            return false;
        }
        const gl = this.gl;
        const pixels = new Uint8Array(1 * 1 * 4);
        const h = this.canvas.height;
        gl.readPixels(point.x, h - point.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return (pixels[3] > 0);
    }

    _initPlugins() {
        const plugins = this.layer.constructor.getPlugins();
        const style = this.layer.getStyle();
        this.plugins = plugins.map(P => {
            const type = P.getType();
            const config = style[type];
            const p = new P();
            p.config = config;
            return p;
        });
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) {}
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    _getMeterScale(z) {
        const map = this.getMap();
        const p = meterToPoint(map, map.getCenter(), 1000, z);
        return p / 1000;
    }
}

VectorTileLayerRenderer.prototype.calculateTileMatrix = function () {
    const v0 = new Array(3);
    const v1 = new Array(3);
    const v2 = new Array(3);
    return function (tileInfo) {
        const map = this.getMap();
        const glScale = map.getGLScale(tileInfo.z);
        const tilePos = tileInfo.point;
        const tileSize = this.layer.getTileSize();
        const posMatrix = mat4.identity(new Array(3));
        mat4.scale(posMatrix, posMatrix, vec3.set(v0, glScale, glScale, this._zScale));
        mat4.translate(posMatrix, posMatrix, vec3.set(v1, tilePos.x, tilePos.y, 0));
        mat4.scale(posMatrix, posMatrix, vec3.set(v2, tileSize.width / EXTENT, tileSize.height / EXTENT, 1));

        return posMatrix;
    };
}();

export default VectorTileLayerRenderer;

function meterToPoint(map, center, altitude, z) {
    // const z = map.getGLZoom();
    const target = map.locate(center, altitude, 0);
    const p0 = map.coordToPoint(center, z),
        p1 = map.coordToPoint(target, z);
    return Math.abs(p1.x - p0.x) * sign(altitude);
}
