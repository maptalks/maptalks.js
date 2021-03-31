import * as maptalks from 'maptalks';
import { PointPack } from '@maptalks/vector-packer';
import { mat4, vec3 } from '@maptalks/gl';
import { extend, isNil } from '../../common/Util';
import { IconRequestor, GlyphRequestor } from '@maptalks/vector-packer';
import Vector3DLayer from './Vector3DLayer';
import Vector3DLayerRenderer from './Vector3DLayerRenderer';
import Promise from '../../common/Promise';
import { fromJSON } from './util/from_json';

const defaultOptions = {
    glyphSdfLimitPerFrame: 15,
    iconErrorUrl: null,
    workarounds: {
        //#94, text rendering crashes on windows with intel gpu
        'win-intel-gpu-crash': true
    },
    collision: false,
    collisionFrameLimit: 1,
};

class PointLayer extends Vector3DLayer {
    constructor(...args) {
        super(...args);
        if (!this.options.sceneConfig) {
            this.options.sceneConfig = {};
        }
        const sceneConfig = this.options.sceneConfig;
        //disable unique placement
        sceneConfig['uniquePlacement'] = false;
        sceneConfig.collision = true;
        sceneConfig.depthFunc = sceneConfig.depthFunc || '<=';
    }

    /**
     * Reproduce a PointLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {PointLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(json) {
        return fromJSON(json, 'PointLayer', PointLayer);
    }
}

PointLayer.mergeOptions(defaultOptions);

PointLayer.registerJSONType('PointLayer');

PointLayer.registerRenderer('canvas', null);

export default PointLayer;


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
        default: 'top',
        property: '_symbol_markerVerticalAlignment'
    },
    markerHorizontalAlignment: {
        type: 'identity',
        default: 'middle',
        property: '_symbol_markerHorizontalAlignment'
    },
    markerOpacity: {
        type: 'identity',
        default: 1,
        property: '_symbol_markerOpacity'
    },
    markerPitchAlignment: {
        type: 'identity',
        default: 'viewport',
        property: '_symbol_markerPitchAlignment'
    },
    markerRotationAlignment: {
        type: 'identity',
        default: 'viewport',
        property: '_symbol_markerRotationAlignment'
    },

    //text properties
    textName: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textName'
    },
    textFaceName: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textFaceName'
    },
    textWeight: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textWeight'
    },
    textStyle: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textStyle'
    },
    textWrapWidth: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textWrapWidth'
    },
    textHorizontalAlignment: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textHorizontalAlignment'
    },
    textVerticalAlignment: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textVerticalAlignment'
    },
    textFill: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textFill'
    },
    textSize: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textSize'
    },
    textHaloRadius: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textHaloRadius'
    },
    textHaloFill: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textHaloFill'
    },
    textDx: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textDx'
    },
    textDy: {
        type: 'identity',
        default: undefined,
        property: '_symbol_textDy'
    },
    textOpacity: {
        type: 'identity',
        default: 1,
        property: '_symbol_textOpacity'
    },
    textPitchAlignment: {
        type: 'identity',
        default: 'viewport',
        property: '_symbol_textPitchAlignment'
    },
    textRotationAlignment: {
        type: 'identity',
        default: 'viewport',
        property: '_symbol_textRotationAlignment'
    },

};

const MAX_MARKER_SIZE = 255;

class PointLayerRenderer extends Vector3DLayerRenderer {
    constructor(...args) {
        super(...args);
        this._SYMBOLS = PointPack.splitPointSymbol(SYMBOL);
        this.GeometryTypes = [maptalks.Marker, maptalks.MultiPoint];
    }

    createPainter() {
        const IconPainter = Vector3DLayer.getPainterClass('icon');
        this.painterSymbol = extend({}, SYMBOL);
        const painter = new IconPainter(this.regl, this.layer, this.painterSymbol, this.layer.options.sceneConfig, 0);
        if (this.layer.getGeometries()) {
            this.onGeometryAdd(this.layer.getGeometries());
        }
        return painter;
    }

    onGeometryAdd(geometries) {
        if (!geometries) {
            return;
        }
        if (Array.isArray(geometries)) {
            geometries.forEach(g => {
                g.options['maxMarkerWidth'] = g.options['maxMarkerHeight'] = MAX_MARKER_SIZE;
            });
        } else {
            geometries.options['maxMarkerWidth'] = geometries.options['maxMarkerHeight'] = MAX_MARKER_SIZE;
        }
        super.onGeometryAdd(geometries);
    }

    buildMesh(atlas) {
        let hasText = false;
        const { features, center } = this._getFeaturesToRender(feature => {
            if (!isNil(feature.properties['_symbol_textName'])) {
                hasText = true;
            }
        });
        if (!features.length) {
            return;
        }
        const options = [
            {
                zoom: this.getMap().getZoom(),
                EXTENT: Infinity,
                requestor: this.requestor,
                atlas,
                center,
                positionType: Float32Array,
                altitudeProperty: 'altitude',
                defaultAltitude: 0
            }
        ];
        options.push(extend({}, options[0]));
        options[0].allowEmptyPack = 1;

        let symbols = this._SYMBOLS;
        if (!hasText) {
            symbols = [symbols[0]];
        }
        const pointPacks = symbols.map((symbol, idx) => new PointPack(features, symbol, options[idx]).load());
        const v0 = [], v1 = [];
        Promise.all(pointPacks).then(packData => {
            if (this.meshes) {
                this.painter.deleteMesh(this.meshes);
                delete this.meshes;
            }
            if (!packData || !packData.length) {
                this.setToRedraw();
                return;
            }
            const geometries = this.painter.prepareGeometry(packData.map(d => d && d.data), features.map(feature => { return { feature }; }));
            for (let i = 0; i < geometries.length; i++) {
                this.fillCommonProps(geometries[i], packData[i] && packData[i].data);
            }

            this.atlas = {
                iconAtlas: packData[0] && packData[0].data.iconAtlas,
                glyphAtlas: packData[1] && packData[1].data.glyphAtlas
            };
            const posMatrix = mat4.identity([]);
            //TODO 计算zScale时，zoom可能和tileInfo.z不同
            mat4.translate(posMatrix, posMatrix, vec3.set(v1, center[0], center[1], 0));
            mat4.scale(posMatrix, posMatrix, vec3.set(v0, 1, 1, this._zScale));
            // mat4.scale(posMatrix, posMatrix, vec3.set(v0, glScale, glScale, this._zScale))
            const meshes = this.painter.createMesh(geometries, posMatrix);
            if (this.meshes) {
                this.painter.deleteMesh(this.meshes);
            }
            for (let i = 0; i < meshes.length; i++) {
                meshes[i].setUniform('level', 0);
                meshes[i].material.set('flipY', 1);
                meshes[i].properties.meshKey = this.layer.getId() + (meshes[i].geometry.properties.iconAtlas ? '_icon' : '_text');
                // meshes[i].setLocalTransform(mat4.fromScaling([], [2, 2, 1]));
            }

            this.meshes = meshes;
            this.setToRedraw();
        });
    }

    prepareRequestors() {
        if (this._iconRequestor) {
            return;
        }
        const layer = this.layer;
        this._iconRequestor = new IconRequestor({ iconErrorUrl: layer.options['iconErrorUrl'] });
        const useCharBackBuffer = !this._isEnableWorkAround('win-intel-gpu-crash');
        this._glyphRequestor = new GlyphRequestor(fn => {
            layer.getMap().getRenderer().callInNextFrame(fn);
        }, layer.options['glyphSdfLimitPerFrame'], useCharBackBuffer);
        this.requestor = this._fetchIconGlyphs.bind(this);
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
                if (data.buffers && data.buffers.length) {
                    dataBuffers.push(...data.buffers);
                }
                cb(null, { icons: data.icons, glyphs: glyphData.glyphs }, dataBuffers);
            });
        });

        //error, data, buffers

    }

    _isEnableWorkAround(key) {
        if (key === 'win-intel-gpu-crash') {
            return this.layer.options['workarounds']['win-intel-gpu-crash'] && isWinIntelGPU(this.gl);
        }
        return false;
    }
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

PointLayer.registerRenderer('gl', PointLayerRenderer);
