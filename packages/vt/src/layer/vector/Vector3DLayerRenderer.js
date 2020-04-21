import * as maptalks from 'maptalks';
import { createREGL, reshader, mat4 } from '@maptalks/gl';
import { convertToFeature, ID_PROP } from './util/build_geometry';
import { IconRequestor } from '@maptalks/vector-packer';
import { extend, isNumber } from '../../common/Util';
import { KEY_IDX } from '../../common/Constant';

const SYMBOL_SIMPLE_PROPS = {
    textFill: 1,
    textSize: 1,
    textOpacity: 1,
    // textHaloRadius: 1,
    textHaloFill: 1,
    textHaloOpacity: 1,
    textPitchAlignment: 1,
    textRotationAlignment: 1,
    textDx: 1, //TODO
    textDy: 1, //TODO

    // markerWidth: 1,
    // markerHeight: 1,
    markerOpacity: 1,
    markerPitchAlignment: 1,
    markerRotationAlignment: 1,
    markerDx: 1, //TODO
    markerDy: 1, //TODO

    lineColor: 1,
    lineWidth: 1,
    lineOpacity: 1,
    lineDx: 1, //TODO
    lineDy: 1, //TODO
    lineGapWidth: 1, //TODO

    polygonFill: 1,
    polygonOpacity: 1
};

class Vector3DLayerRenderer extends maptalks.renderer.CanvasRenderer {
    constructor(...args) {
        super(...args);
        this.features = {};
        this._geometries = {};
        this._counter = 1;
    }

    hasNoAARendering() {
        return true;
    }

    //always redraw when map is interacting
    needToRedraw() {
        const redraw = super.needToRedraw();
        if (!redraw) {
            return this.painter.needToRedraw();
        }
        return redraw;
    }

    draw(timestamp, parentContext) {
        const layer = this.layer;
        this.prepareCanvas();
        if (this._dirtyAll) {
            this.buildMesh();
            this._dirtyAll = false;
            this._dirtyGeo = false;
            this._dirtySymbol = false;
        } else if (this._dirtyGeo) {
            this.buildMesh(this.atlas);
            this._dirtyGeo = false;
            this._dirtySymbol = false;
        } else if (this._dirtySymbol) {
            this.updateSymbol();
            this._dirtySymbol = false;
        }
        if (!this.meshes) {
            this.completeRender();
            return;
        }
        if (layer.options['collision']) {
            layer.clearCollisionIndex();
        }
        this._frameTime = timestamp;
        this._zScale = this._getCentiMeterScale(this.getMap().getGLZoom()); // scale to convert meter to gl point
        this._parentContext = parentContext || {};
        const context = this._preparePaintContext();
        this.painter.startFrame(context);
        this.painter.addMesh(this.meshes);
        this.painter.render(context);
        this.completeRender();
        this.layer.fire('canvasisdirty');
    }

    isForeground() {
        return true;
    }

    _preparePaintContext() {
        const context = {
            regl: this.regl,
            layer: this.layer,
            symbol: this._layerSymbol,
            gl: this.gl,
            sceneConfig: this.layer.options.sceneConfig,
            pluginIndex: 0,
            cameraPosition: this.getMap().cameraPosition,
            timestamp: this.getFrameTimestamp()
        };
        if (this._parentContext) {
            extend(context, this._parentContext);
        }
        return context;
    }

    drawOnInteracting(event, timestamp, parentContext) {
        this.draw(timestamp, parentContext);
    }

    getFrameTimestamp() {
        return this._frameTime;
    }

    updateSymbol() {
        this.painter.updateSymbol(this.painterSymbol);
    }

    _getFeaturesToRender(fn) {
        const features = [];
        const center = [0, 0, 0, 0];
        //为了解决UglifyJS对 feature[KEY_IDX] 不正确的mangle
        const keyName = (KEY_IDX + '').trim();
        let count = 0;
        for (const p in this.features) {
            if (this.features.hasOwnProperty(p)) {
                const feature = this.features[p];
                if (feature.visible) {
                    this.addCoordsToCenter(feature.geometry, center);
                    feature[keyName] = count++;
                    features.push(feature);
                }
                if (fn) {
                    fn(feature);
                }
            }
        }
        this._currentFeatures = features;

        if (!features.length) {
            if (this.meshes) {
                this.painter.deleteMesh(this.meshes);
                delete this.meshes;
            }
        }
        if (center[3]) {
            center[0] /= center[3];
            center[1] /= center[3];
        }
        return {
            features,
            center
        };
    }

    buildMesh(atlas) {
        //TODO 更新symbol的优化
        //1. 如果只影响texture，则只重新生成texture
        //2. 如果不影响Geometry，则直接调用painter.updateSymbol
        //3. Geometry和Texture全都受影响时，则全部重新生成
        const { features, center } = this._getFeaturesToRender();
        if (!features.length) {
            return;
        }

        const options = {
            zoom: this.getMap().getZoom(),
            EXTENT: Infinity,
            requestor: this.requestor,
            atlas,
            center,
            positionType: Float32Array
        };

        const pack = new this.PackClass(features, this.painterSymbol, options);
        pack.load().then(packData => {
            if (this.meshes) {
                this.painter.deleteMesh(this.meshes);
                delete this.meshes;
            }
            if (!packData) {
                this.setToRedraw();
                return;
            }
            const geometry = this.painter.createGeometry(packData.data, features.map(feature => { return { feature }; }));
            this.fillCommonProps(geometry);

            this.atlas = {
                iconAtlas: packData.data.iconAtlas
            };

            const transform = mat4.translate([], mat4.identity([]), center);
            // mat4.translate(posMatrix, posMatrix, vec3.set(v0, tilePos.x * glScale, tilePos.y * glScale, 0));
            const mesh = this.painter.createMesh(geometry, transform, {});
            mesh.setUniform('level', 0);
            const defines = mesh.getDefines();
            //不开启ENABLE_TILE_STENCIL的话，frag中会用tileExtent剪切图形，会造成图形绘制不出
            defines['ENABLE_TILE_STENCIL'] = 1;
            mesh.setDefines(defines);
            mesh.properties.meshKey = this.layer.getId();

            this.meshes = mesh;
            this.setToRedraw();
        });
    }

    addCoordsToCenter(geometry, center) {
        for (let i = 0; i < geometry.length; i++) {
            if (isNumber(geometry[i][0])) {
                center[0] += geometry[i][0];
                center[1] += geometry[i][1];
                center[3] += 1;
            } else {
                for (let ii = 0; ii < geometry[i].length; ii++) {
                    if (isNumber(geometry[i][ii][0])) {
                        center[0] += geometry[i][ii][0];
                        center[1] += geometry[i][ii][1];
                        center[3] += 1;
                    } else {
                        for (let iii = 0; iii < geometry[i][ii].length; iii++) {
                            center[0] += geometry[i][ii][iii][0];
                            center[1] += geometry[i][ii][iii][1];
                            center[3] += 1;
                        }
                    }
                }
            }
        }
    }

    fillCommonProps(geometry) {
        const map = this.getMap();
        const props = geometry.properties;
        Object.defineProperty(props, 'tileResolution', {
            enumerable: true,
            get: function () {
                return map.getResolution(map.getGLZoom());
            }
        });
        props.tileRatio = 1;
        props.z = map.getGLZoom();
        props.tileExtent = 1;
    }

    prepareRequestors() {
        if (this._iconRequestor) {
            return;
        }
        const layer = this.layer;
        this._iconRequestor = new IconRequestor({ iconErrorUrl: layer.options['iconErrorUrl'] });
        this.requestor = this._fetchPattern.bind(this);
    }

    _fetchPattern(icons, glyphs, cb) {
        const dataBuffers = [];
        this._iconRequestor.getIcons(icons, (err, data) => {
            if (err) {
                throw err;
            }
            if (data.buffers) {
                dataBuffers.push(...data.buffers);
            }
            cb(null, { icons: data.icons }, dataBuffers);
        });
    }

    _markRebuildGeometry() {
        this._dirtyGeo = true;
    }

    _markRebuild() {
        this._dirtyAll = true;
    }

    _markUpdateSymbol() {
        this._dirtySymbol = true;
    }

    _convertGeometries(geometries) {
        const layerId = this.layer.getId();
        for (let i = 0; i < geometries.length; i++) {
            const geo = geometries[i];
            let hit = false;
            for (let ii = 0; ii < this.GeometryTypes.length; ii++) {
                if (geo instanceof this.GeometryTypes[ii]) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                throw new Error(`${geo.getJSONType()} can't be added to ${this.layer.getJSONType()}(id:${layerId}).`);
            }
            if (!geo[ID_PROP]) {
                geo[ID_PROP] = this._counter++;
            }
            const uid = geo[ID_PROP];
            this.features[uid] = convertToFeature(geo);
            this.features[uid][ID_PROP] = uid;
            this._geometries[uid] = geo;
        }
    }

    pick(x, y, options) {
        const hits = [];
        if (this.painter) {
            const picked = this.painter.pick(x, y, options.tolerance);
            const feature = this._currentFeatures[picked.pickingId];
            hits.push(this._geometries[feature[ID_PROP]]);
        }
        return hits;
    }

    onGeometryAdd(geometries) {
        if (!geometries || !geometries.length) {
            return;
        }
        this._convertGeometries(geometries);
        this._markRebuild();
        redraw(this);
    }

    onGeometryRemove(geometries) {
        if (!geometries || !geometries.length) {
            return;
        }
        for (let i = 0; i < geometries.length; i++) {
            const geo = geometries[i];
            if (geo[ID_PROP] !== undefined) {
                delete this.features[geo[ID_PROP]];
                delete this._geometries[geo[ID_PROP]];
            }
        }
        this._markRebuild();
        redraw(this);
    }

    onGeometrySymbolChange(e) {
        const { properties } = e;
        //TODO 判断properties中哪些只需要调用painter.updateSymbol
        // 如果有，则更新 this.painterSymbol 上的相应属性，以触发painter中的属性更新
        const marker = e.target;
        const id = marker[ID_PROP];
        if (this.features[id]) {
            const symbol = marker.getSymbol();
            const feaProps = this.features[id].properties;
            for (const p in feaProps) {
                if (p.indexOf('_symbol_') === 0) {
                    delete feaProps[p];
                }
            }
            for (const p in symbol) {
                feaProps['_symbol_' + p] = symbol[p];
            }
        }

        if (this._dirtyAll) {
            redraw(this);
            return;
        }


        let rebuild = false;
        for (const p in properties) {
            if (!SYMBOL_SIMPLE_PROPS[p]) {
                rebuild = true;
                break;
            }
        }
        if (!rebuild) {
            if (!this._dirtyGeo || !this._dirtySymbol) {
                for (const p in properties) {
                    const old = this.painterSymbol[p];
                    //new symbol property to force painter refresh geometry's attribute
                    this.painterSymbol[p] = {
                        type: old.type,
                        default: old.default,
                        property: old.property
                    };

                }
                this._markUpdateSymbol();
            }
        } else {
            this._markRebuild();
        }
        redraw(this);
    }

    onGeometryShapeChange(e) {
        this._convertGeometries([e.target]);
        this._markRebuildGeometry();
        redraw(this);
    }

    onGeometryPositionChange(e) {
        this._convertGeometries([e.target]);
        this._markRebuildGeometry();
        redraw(this);
    }

    onGeometryZIndexChange() {
        // redraw(this);
    }

    onGeometryShow() {
        this._markRebuildGeometry();
        redraw(this);
    }

    onGeometryHide() {
        this._markRebuildGeometry();
        redraw(this);
    }

    onGeometryPropertiesChange() {
        //TODO 可能会更新textName
        this._markRebuildGeometry();
        redraw(this);
    }

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            this._createREGLContext();
        }
        if (inGroup) {
            this.canvas.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        }
        this.prepareRequestors();
        this.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        this.painter = this.createPainter();
    }

    _createREGLContext() {
        const layer = this.layer;

        const attributes = layer.options.glOptions || {
            alpha: true,
            depth: true,
            antialias: false
            // premultipliedAlpha : false
        };
        attributes.preserveDrawingBuffer = true;
        attributes.stencil = true;
        this.glOptions = attributes;
        this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        this.regl = createREGL({
            gl: this.gl,
            attributes,
            extensions: reshader.Constants['WEBGL_EXTENSIONS'],
            optionalExtensions: reshader.Constants['WEBGL_OPTIONAL_EXTENSIONS']
        });
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) { }
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    clearCanvas() {
        super.clearCanvas();
        if (!this.regl) {
            return;
        }
        //这里必须通过regl来clear，如果直接调用webgl context的clear，则brdf的texture会被设为0
        this.regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
            stencil: 0
        });
    }

    resizeCanvas(canvasSize) {
        super.resizeCanvas(canvasSize);
        const canvas = this.canvas;
        if (!canvas) {
            return;
        }
        if (this.pickingFBO && (this.pickingFBO.width !== canvas.width || this.pickingFBO.height !== canvas.height)) {
            this.pickingFBO.resize(canvas.width, canvas.height);
        }
        if (this.painter) {
            this.painter.resize(canvas.width, canvas.height);
        }
    }

    onRemove() {
        super.onRemove();
        this.painter.delete();
    }

    isEnableWorkAround(key) {
        if (key === 'win-intel-gpu-crash') {
            return this.layer.options['workarounds']['win-intel-gpu-crash'] && isWinIntelGPU(this.gl);
        }
        return false;
    }

    _getCentiMeterScale(z) {
        const map = this.getMap();
        const p = map.distanceToPoint(1000, 0, z).x;
        return p / 1000 / 10;
    }
}

function redraw(renderer) {
    renderer.setToRedraw();
}

function isWinIntelGPU(gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo && typeof navigator !== 'undefined') {
        //e.g. ANGLE (Intel(R) HD Graphics 620
        const gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const win = navigator.platform === 'Win32' || navigator.platform === 'Win64';
        if (gpu && gpu.toLowerCase().indexOf('intel') >= 0 && win) {
            return true;
        }
    }
    return false;
}

export default Vector3DLayerRenderer;
