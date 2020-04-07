import * as maptalks from 'maptalks';
import { PointPack } from '@maptalks/vector-packer';
import { mat4, createREGL, reshader } from '@maptalks/gl';
import { convertToFeature, ID_PROP } from './util/build_geometry';
import { extend, isNil } from '../../common/Util';
import { IconRequestor, GlyphRequestor } from '@maptalks/vector-packer';
import Vector3DLayer from './Vector3DLayer';
import Promise from '../../common/Promise';

const SYMBOL = {
    markerFile: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerFile'
    },
    markerWidth: {
        type: 'identity',
        default: 20,
        property: '_symbol_markerWidth'
    },
    markerHeight: {
        type: 'identity',
        default: 20,
        property: '_symbol_markerHeight'
    },
    markerDx: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerDx'
    },
    markerDy: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerDy'
    },
    //marker type properties
    markerType: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerType'
    },
    markerFill: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerFill'
    },
    markerFillPatternFile: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerFillPatternFile'
    },
    markerFillOpacity: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerFillOpacity'
    },
    markerLineColor: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerLineColor'
    },
    markerLineWidth: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerLineWidth'
    },
    markerLineOpacity: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerLineOpacity'
    },
    markerLineDasharray: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerLineDasharray'
    },
    markerLinePatternFile: {
        type: 'identity',
        default: undefined,
        property: '_symbol_markerLinePatternFile'
    },
    markerVerticalAlignment: {
        type: 'identity',
        default: 'bottom',
        property: '_symbol_markerVerticalAlignment'
    },
    markerHorizontalAlignment: {
        type: 'identity',
        default: 'middle',
        property: '_symbol_markerHorizontalAlignment'
    },

    textName: {
        type: 'identity',
        default: 'middle',
        property: '_symbol_textName'
    },
};

class PointLayerRenderer extends maptalks.renderer.CanvasRenderer {
    constructor(...args) {
        super(...args);
        this._features = {};
        this._counter = 1;
        this._SYMBOLS = PointPack.splitPointSymbol(SYMBOL);
    }

    hasNoAARendering() {
        return true;
    }

    //always redraw when map is interacting
    needToRedraw() {
        const redraw = super.needToRedraw();
        if (!redraw) {
            return this._painter.needToRedraw();
        }
        return redraw;
    }

    draw(timestamp, parentContext) {
        const layer = this.layer;
        this.prepareCanvas();
        if (this._dirtyTex) {
            this._buildMesh();
            this._dirtyTex = false;
            this._dirtyGeo = false;
        } else if (this._dirtyGeo) {
            this._buildMesh(this._atlas);
            this._dirtyGeo = false;
        }
        if (!this._meshes) {
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
        this._painter.startFrame(context);
        this._painter.addMesh(this._meshes);
        this._painter.render(context);
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

    _buildMesh(atlas) {
        let hasText = false;
        const features = [];
        const center = [0, 0, 0, 0];
        for (const p in this._features) {
            if (this._features.hasOwnProperty(p)) {
                const feature = this._features[p];
                if (!isNil(feature.properties['_symbol_textName'])) {
                    hasText = true;
                }
                if (feature.visible) {
                    appendCoords(feature.geometry, center);
                    features.push(feature);
                }
            }
        }
        if (!features.length) {
            if (this._meshes) {
                this._painter.deleteMesh(this._meshes);
                delete this._meshes;
            }
            return;
        }
        center[0] /= center[3];
        center[1] /= center[3];
        this._prepareRequestors();
        const options = {
            zoom: this.getMap().getZoom(),
            EXTENT: Infinity,
            requestor: this._fetchIconGlyphs.bind(this),
            atlas,
            center,
            positionType: Float32Array
        };

        let symbols = this._SYMBOLS;
        if (!hasText) {
            symbols = [symbols[0]];
        }
        const pointPacks = symbols.map(symbol => new PointPack(features, symbol, options).load());

        Promise.all(pointPacks).then(packData => {
            const geometries = this._painter.createGeometry(packData.map(d => d.data), features);
            for (let i = 0; i < geometries.length; i++) {
                this._fillCommonProps(geometries[i]);
            }

            this._atlas = {
                iconAltas: packData[0] && packData[0].data.iconAtlas,
                glyphAtlas: packData[1] && packData[1].data.glyphAtlas
            };
            // const transform = mat4.identity([]);
            const transform = mat4.translate([], mat4.identity([]), center);
            // mat4.translate(posMatrix, posMatrix, vec3.set(v0, tilePos.x * glScale, tilePos.y * glScale, 0));
            const meshes = this._painter.createMesh(geometries, transform);
            if (this._meshes) {
                this._painter.deleteMesh(this._meshes);
            }
            for (let i = 0; i < meshes.length; i++) {
                meshes[i].properties.meshKey = this.layer.getId() + '_icon';
                // meshes[i].setLocalTransform(mat4.fromScaling([], [2, 2, 1]));
            }

            this._meshes = meshes;
            this.setToRedraw();
        });
    }

    _fillCommonProps(geometry) {
        const map = this.getMap();
        const props = geometry.properties;
        Object.defineProperty(props, 'tileResolution', {
            enumerable: true,
            get: function () {
                return map.getResolution();
            }
        });
        props.tileRatio = 1;
        props.z = map.getGLZoom();
        props.tileExtent = 1;
    }

    _markGeometry() {
        this._dirtyGeo = true;
    }

    _markTexture() {
        this._dirtyTex = true;
    }

    _prepareRequestors() {
        if (this._iconRequestor) {
            return;
        }
        const layer = this.layer;
        this._iconRequestor = new IconRequestor({ iconErrorUrl: layer.options['iconErrorUrl'] });
        const useCharBackBuffer = !this.isEnableWorkAround('win-intel-gpu-crash');
        this._glyphRequestor = new GlyphRequestor(fn => {
            layer.getMap().getRenderer().callInNextFrame(fn);
        }, layer.options['glyphSdfLimitPerFrame'], useCharBackBuffer);
    }

    _fetchIconGlyphs(icons, glyphs, cb) {
        //error, data, buffers
        this._glyphRequestor.getGlyphs(glyphs, (err, glyphData) => {
            if (err) {
                throw err;
            }
            const dataBuffers = glyphData.buffers || [];
            this._iconRequestor.getIcons(icons, (err, data) => {
                if (err) {
                    throw err;
                }
                if (data.buffers) {
                    dataBuffers.push(...data.buffers);
                }
                cb(null, { icons: data.icons, glyphs: glyphData.glyphs }, dataBuffers);
            });
        });

        //error, data, buffers

    }

    onGeometryAdd(geometries) {
        if (!geometries || !geometries.length) {
            return;
        }
        for (let i = 0; i < geometries.length; i++) {
            const geo = geometries[i];
            if (geo instanceof maptalks.Marker || geo instanceof maptalks.MultiPoint) {
                if (!geo[ID_PROP]) {
                    geo[ID_PROP] = this._counter++;
                }
                if (!this._features[geo[ID_PROP]]) {
                    this._features[geo[ID_PROP]] = convertToFeature(geo);
                }
            }
        }
        this._markTexture();
        redraw(this);
    }

    onGeometryRemove(geometries) {
        if (!geometries || !geometries.length) {
            return;
        }
        for (let i = 0; i < geometries.length; i++) {
            const geo = geometries[i];
            if (geo[ID_PROP]) {
                delete this._features[geo[ID_PROP]];
            }
        }
        this._markTexture();
        redraw(this);
    }

    onGeometrySymbolChange() {
        this._markTexture();
        redraw(this);
    }

    onGeometryShapeChange() {
        this._markGeometry();
        redraw(this);
    }

    onGeometryPositionChange() {
        this._markGeometry();
        redraw(this);
    }

    onGeometryZIndexChange() {
        // redraw(this);
    }

    onGeometryShow() {
        this._markGeometry();
        redraw(this);
    }

    onGeometryHide() {
        this._markGeometry();
        redraw(this);
    }

    onGeometryPropertiesChange() {
        this._markGeometry();
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
        this.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        const IconPainter = Vector3DLayer.getPainterClass('icon');
        this._painter = new IconPainter(this.regl, this.layer, SYMBOL, this.layer.options.sceneConfig, 0);
        if (this.layer.getGeometries()) {
            this.onGeometryAdd(this.layer.getGeometries());
        }
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
        if (this._painter) {
            this._painter.resize(canvas.width, canvas.height);
        }
    }

    onRemove() {
        super.onRemove();
        this._painter.delete();
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
    if (renderer.layer.options['drawImmediate']) {
        renderer.render();
    }
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

function appendCoords(geometry, center) {
    for (let i = 0; i < geometry.length; i++) {
        center[0] += geometry[i][0];
        center[1] += geometry[i][1];
        center[3] += 1;
    }
}

export default PointLayerRenderer;
