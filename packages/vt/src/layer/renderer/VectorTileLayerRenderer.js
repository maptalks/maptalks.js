import * as maptalks from 'maptalks';
import { mat4, vec3, createREGL } from '@maptalks/gl';
import WorkerConnection from './worker/WorkerConnection';
import { EXTENT, EMPTY_VECTOR_TILE } from '../core/Constant';

class VectorTileLayerRenderer extends maptalks.renderer.TileLayerCanvasRenderer {

    constructor(layer) {
        super(layer);
        this._initPlugins();
        this.ready = false;
        this.sceneCache = {};
    }

    setStyle() {
        if (this._workerConn) {
            this._workerConn.updateStyle(this.layer.getStyle(), err => {
                if (err) throw new Error(err);
                this.clear();
                this._clearPlugin();
                this.setToRedraw();
            });
        }
    }

    updateSceneConfig(idx, sceneConfig) {
        const plugins = this.plugins;
        if (!plugins) {
            return;
        }

        plugins[idx].config = this.layer.getStyle()[idx];
        plugins[idx].updateSceneConfig({
            sceneConfig : sceneConfig
        });
        this.setToRedraw();
    }

    //always redraw when map is interacting
    needToRedraw() {
        const redraw = super.needToRedraw();
        if (!redraw) {
            for (let i = 0; i < this.plugins.length; i++) {
                const cache = this.sceneCache[i];
                if (cache) {
                    if (this.plugins[i].needToRedraw(cache)) {
                        return true;
                    }
                }
            }
        }
        return redraw;
    }

    createContext() {
        const layer = this.layer;
        this._prepareWorker();
        const EXTENT = layer.options['extent'];

        if (this.canvas.gl && this.canvas.gl.wrap) {
            this.gl = this.canvas.gl.wrap();
        }
        this._createREGLContext();
        this.pickingFBO = this.regl.framebuffer(this.canvas.width, this.canvas.height);
        this._quadStencil = new maptalks.renderer.QuadStencil(this.gl, new Uint16Array([
            0, EXTENT, 0,
            0, 0, 0,
            EXTENT, EXTENT, 0,
            EXTENT, 0, 0
        ]), layer.options['stencil'] === 'debug');
    }

    _createREGLContext() {
        const layer = this.layer;

        const attributes = layer.options.glOptions || {
            alpha: true,
            depth: true,
            antialias: true,
        };
        attributes.preserveDrawingBuffer = true;
        attributes.stencil = !!layer.options['stencil'];
        this.glOptions = attributes;
        this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        // console.log(this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS));
        //TODO 迁移到fusion后，不再需要初始化regl，而是将createREGL传给插件
        this.regl = createREGL({
            gl : this.gl,
            attributes,
            extensions : [
                // 'ANGLE_instanced_arrays',
                'OES_texture_float',
                'OES_texture_float_linear',
                'OES_element_index_uint',
                'OES_standard_derivatives'
            ],
            optionalExtensions : layer.options['glExtensions'] || ['WEBGL_draw_buffers', 'EXT_shader_texture_lod']
        });
    }

    _prepareWorker() {
        if (!this._workerConn) {
            this._workerConn = new WorkerConnection('@maptalks/vt', this.layer);
        }
        const workerConn = this._workerConn;
        //setTimeout in case layer's style is set to layer after layer's creating.
        setTimeout(() => {
            if (!workerConn.isActive()) {
                return;
            }
            workerConn.addLayer(err => {
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
            // this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT);
            //TODO 这里必须通过regl来clear，如果直接调用webgl context的clear，则brdf的texture会被设为0
            this.regl.clear({
                color: [0, 0, 0, 0],
                depth: 1,
                stencil: 0
            });
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

    // onDrawTileStart(context) {
    //     if (!this.layer.options['stencil']) {
    //         return;
    //     }
    //     const map = this.getMap();
    //     // this.regl._refresh();
    //     const { tiles, parentTiles, childTiles } = context;
    //     const gl = this.gl;
    //     const quadStencil = this._quadStencil;

    //     quadStencil.start();
    //     // Tests will always pass, and ref value will be written to stencil buffer.
    //     quadStencil.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

    //     let idNext = 1;
    //     this._tileStencilRefs = {};
    //     const stencilTiles = [];
    //     maptalks.Util.pushIn(stencilTiles, parentTiles, childTiles, tiles);
    //     for (const tile of stencilTiles) {
    //         const id = this._tileStencilRefs[tile.info.dupKey] = idNext++;
    //         quadStencil.stencilFunc(gl.ALWAYS, id, 0xFF);

    //         const mat = this.calculateTileMatrix(tile.info);
    //         mat4.multiply(mat, map.projViewMatrix, mat);
    //         quadStencil.draw(mat);
    //     }

    //     quadStencil.end();
    //     super.onDrawTileStart(context);
    // }

    draw(framestamp) {
        this.prepareCanvas();
        if (!this.ready) {
            this.completeRender();
            return;
        }
        this._frameTime = maptalks.Util.now();
        this._zScale = this._getMeterScale(this.getMap().getGLZoom()); // scale to convert meter to gl point
        this._startFrame();
        super.draw(framestamp);
        this._endFrame();
        // TODO: shoule be called in parent
        // this.completeRender();
    }

    drawOnInteracting(event, framestamp) {
        if (!this.ready) {
            this.completeRender();
            return;
        }
        this.draw(framestamp);
    }

    loadTile(tileInfo) {
        const map = this.getMap();
        const glScale = map.getGLScale(tileInfo.z);
        this._workerConn.loadTile({ tileInfo, glScale, zScale : this._zScale }, (err, data) => {
            if (err) this.onTileError(EMPTY_VECTOR_TILE, tileInfo);
            if (!data) {
                this.onTileLoad({ _empty : true }, tileInfo);
                return;
            }
            //restore features for plugin data
            const features = JSON.parse(data.features);
            //iterate plugins
            for (let i = 0; i < data.data.length; i++) {
                const pluginData = data.data[i]; // { data, featureIndex }
                if (!pluginData) {
                    continue;
                }
                const symbols = this.layer.getStyle()[i].style;//TODO 读取所有的symbol
                const feaIndex = pluginData.styledFeatures;
                const pFeatures = new Array(feaIndex.length / 2);
                //[feature index, style index]
                for (let i = 1, l = feaIndex.length; i < l; i += 2) {
                    let feature = features[feaIndex[i - 1]];
                    if (this.layer.options['features'] === 'id' && this.layer.getFeature) {
                        feature = this.layer.getFeature(feature);
                    }
                    pFeatures[(i - 1) / 2] = {
                        feature : feature,
                        symbol : symbols[feaIndex[i]].symbol
                    };
                }
                delete pluginData.styledFeatures;
                pluginData.features = pFeatures;
            }
            this.onTileLoad(data.data, tileInfo);
        });
        return {};
    }

    _startFrame() {
        this.plugins.forEach((plugin, idx) => {
            if (!this.sceneCache[idx]) {
                this.sceneCache[idx] = {};
            }
            plugin.startFrame({
                regl : this.regl,
                layer : this.layer,
                gl : this.gl,
                sceneCache : this.sceneCache[idx],
                sceneConfig : plugin.config.sceneConfig
            });
        });
    }

    _endFrame() {
        const cameraPosition = this.getMap().cameraPosition;
        this.plugins.forEach((plugin, idx) => {
            const status = plugin.endFrame({
                regl : this.regl,
                layer : this.layer,
                gl : this.gl,
                sceneCache : this.sceneCache[idx],
                sceneConfig : plugin.config.sceneConfig,
                cameraPosition,
                quadStencil : this._quadStencil
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
        this.plugins.forEach((plugin, idx) => {
            if (!tileData[idx]) {
                return;
            }
            if (!tileCache[idx]) {
                tileCache[idx] = {};
            }
            tileData[idx].transform = tileTransform;
            const context = {
                regl : this.regl,
                layer : this.layer,
                gl : this.gl,
                sceneCache : this.sceneCache[idx],
                sceneConfig : plugin.config.sceneConfig,
                tileCache : tileCache[idx],
                tileData : tileData[idx],
                t : this._frameTime - tileData.loadTime,
                tileInfo,
                tileZoom : this['_tileZoom']
            };
            const status = plugin.paintTile(context);
            if (status && status.redraw) {
                //let plugin to determine when to redraw
                this.setToRedraw();
            }
        });
        //TODO stencil
        this.setCanvasUpdated();
    }

    pick(x, y) {
        if (maptalks['Browser']['retina']) {
            x *= 2;
            y *= 2;
        }
        const hits = [];
        this.plugins.forEach(plugin => {
            const picked = plugin.pick(x, y);
            if (picked) {
                picked.type = plugin.getType();
                hits.push(picked);
            }
        });
        return hits;
    }

    deleteTile(tile) {
        if (!tile) {
            return;
        }
        if (tile.image && !tile.image._empty) {
            this.plugins.forEach((plugin, idx) => {
                plugin.deleteTile({
                    regl : this.regl,
                    layer : this.layer,
                    gl : this.gl,
                    sceneCache : this.sceneCache[idx],
                    tileCache : tile.image.cache ? tile.image.cache[idx] : {},
                    tileInfo : tile.info,
                    tileData : tile.image
                });
            });
        }
        //ask plugin to clear caches
        super.deleteTile(tile);
    }

    abortTileLoading() {
        //TODO 实现矢量瓦片的中止请求: 在 worker 中 xhr.abort
        super.abortTileLoading();
    }

    resizeCanvas(canvasSize) {
        super.resizeCanvas(canvasSize);
        if (this.pickingFBO) {
            this.pickingFBO.resize(this.canvas.width, this.canvas.height);
        }
        let cache = this.sceneCache;
        if (!cache) {
            cache = this.sceneCache = {};
        }
        const size = new maptalks.Size(this.canvas.width, this.canvas.height);
        this.plugins.forEach((plugin, idx) => {
            if (!cache[idx]) {
                cache[idx] = {};
            }
            plugin.resize(size);
        });
    }

    onRemove() {
        // const map = this.getMap();
        if (this._workerConn) {
            this._workerConn.removeLayer(err => {
                if (err) throw err;
            });
            this._workerConn.remove();
            delete this._workerConn;
        }
        if (this.pickingFBO) {
            this.pickingFBO.destroy();
        }
        this._quadStencil.remove();
        if (super.onRemove) super.onRemove();
        this._clearPlugin();
    }

    _clearPlugin() {
        this.plugins.forEach((plugin, idx) => {
            plugin.remove({ sceneCache : this.sceneCache[idx] });
        });
        delete this.sceneCache;
    }

    hitDetect(point) {
        if (!this.gl || !this.layer.options['hitDetect']) {
            return false;
        }
        const gl = this.gl;
        const pixels = new Uint8Array(1 * 1 * 4);
        const h = this.canvas.height;
        gl.readPixels(point.x, h - point.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return (pixels[3] > 0);
    }

    _initPlugins() {
        const pluginClazz = this.layer.constructor.getPlugins();
        const style = this.layer.getStyle();
        this.plugins = style.map((config, idx) => {
            if (!config.type) {
                throw new Error('invalid plugin type for style at ' + idx);
            }
            const P = pluginClazz[config.type];
            if (!P) {
                throw new Error(`Plugin for (${config.type}) is not loaded.`);
            }
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
        const p = map.distanceToPoint(1000, 0, z).x;
        return p / 1000;
    }

    debugFBO(id, fbo) {
        const canvas = document.getElementById(id);
        const width = fbo.width, height = fbo.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const pixels = this.regl.read({
            framebuffer : fbo
        });

        const halfHeight = height / 2 | 0;  // the | 0 keeps the result an int
        const bytesPerRow = width * 4;

        for (let i = 0; i < pixels.length; i++) {
            pixels[i] *= 255;
        }

        // make a temp buffer to hold one row
        const temp = new Uint8Array(width * 4);
        for (let y = 0; y < halfHeight; ++y) {
            const topOffset = y * bytesPerRow;
            const bottomOffset = (height - y - 1) * bytesPerRow;

            // make copy of a row on the top half
            temp.set(pixels.subarray(topOffset, topOffset + bytesPerRow));

            // copy a row from the bottom half to the top
            pixels.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

            // copy the copy of the top half row to the bottom half
            pixels.set(temp, bottomOffset);
        }

        // This part is not part of the answer. It's only here
        // to show the code above worked
        // copy the pixels in a 2d canvas to show it worked
        const imgdata = new ImageData(width, height);
        imgdata.data.set(pixels);
        ctx.putImageData(imgdata, 0, 0);
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
