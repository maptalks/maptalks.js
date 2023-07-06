import * as maptalks from 'maptalks';
import { extend, isNil, pushIn } from '../../common/Util';
import Vector3DLayer from './Vector3DLayer';
import { PolygonLayerRenderer } from './PolygonLayer';
import { fromJSON } from './util/from_json';
import { build3DExtrusion } from '../../worker/builder/';
import { ID_PROP } from './util/convert_to_feature';
import { PROP_OMBB } from '../../common/Constant';
import computeOMBB from '../../worker/builder/ombb.js';

const options = {
    cullFace: false
};

class ExtrudePolygonLayer extends Vector3DLayer {
    /**
     * Reproduce a PolygonLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {PolygonLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(json) {
        return fromJSON(json, 'ExtrudePolygonLayer', ExtrudePolygonLayer);
    }

    onConfig(conf) {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.onConfig(conf);
        }
        return super.onConfig(conf);
    }

    updateMaterial(matInfo) {
        if (!matInfo) {
            return this;
        }
        if (!this.options.material) {
            this.options.material = {};
        }
        extend(this.options.material, matInfo);
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.updateMaterial(matInfo);
        }
        return this;
    }

    updateSideMaterial(matInfo) {
        if (!matInfo) {
            return this;
        }
        if (!this.options.sideMaterial) {
            this.options.sideMaterial = {};
        }
        extend(this.options.sideMaterial, matInfo);
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.updateSideMaterial(matInfo);
        }
        return this;
    }

    updateDataConfig(dataConfig) {
        if (!dataConfig) {
            return this;
        }
        if (!this.options.dataConfig) {
            this.options.dataConfig = {};
        }
        extend(this.options.dataConfig, dataConfig);
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.updateDataConfig(dataConfig);
        }
        return this;
    }
}

ExtrudePolygonLayer.registerJSONType('ExtrudePolygonLayer');
ExtrudePolygonLayer.mergeOptions(options);

const SYMBOL = {
    polygonFill: {
        type: 'identity',
        default: [1, 1, 1, 1],
        property: '_symbol_polygonFill'
    },
    polygonOpacity: {
        type: 'identity',
        default: 1,
        property: '_symbol_polygonOpacity'
    },
    topPolygonFill: {
        type: 'identity',
        default: [1, 1, 1, 1],
        property: '_symbol_topPolygonFill'
    },
    bottomPolygonFill: {
        type: 'identity',
        default: [1, 1, 1, 1],
        property: '_symbol_bottomPolygonFill'
    }
};

const DEFAULT_DATACONFIG = {
    defaultAltitude: 20
};

const topFilter = mesh => {
    return mesh.properties.top === 1;
};

const sideFilter = mesh => {
    return mesh.properties.side === 1;
};

class ExtrudePolygonLayerRenderer extends PolygonLayerRenderer {
    constructor(...args) {
        super(...args);
        this.GeometryTypes = [maptalks.Polygon, maptalks.MultiPolygon];
    }

    _groupPolygonFeatures(features) {
        return [features];
    }

    onConfig(conf) {
        if (!this.painter) {
            return;
        }
        if (!isNil(conf.cullFace)) {
            this.painter.updateSceneConfig({
                cullFace: conf.cullFace
            });
        }
    }

    updateMaterial(matInfo) {
        if (!this.painter) {
            return;
        }
        this.painter._updateMaterial(matInfo);
        if (!this.layer.options.sideMaterial) {
            this.sidePainter._updateMaterial(matInfo);
        }
        this.setToRedraw();
    }

    updateSideMaterial(matInfo) {
        if (!this.sidePainter) {
            return;
        }
        this.sidePainter._updateMaterial(matInfo);
        this.setToRedraw();
    }

    updateDataConfig(dataConfig) {
        if (!this.painter) {
            return;
        }
        this.painter.updateDataConfig(dataConfig);
        this._markRebuild();
    }

    needCheckPointLineSymbols() {
        return false;
    }

    draw(timestamp, parentContext) {
        return super.draw(timestamp, parentContext);
    }

    createPainter() {
        const StandardPainter = Vector3DLayer.get3DPainterClass('lit');
        this.painterSymbol = extend({}, SYMBOL);
        this.sidePainterSymbol = extend({}, SYMBOL);
        this._defineSymbolBloom(this.painterSymbol, 'bloom');
        const dataConfig = extend({}, DEFAULT_DATACONFIG, this.layer.options.dataConfig || {});
        if (this.layer.options.material) {
            this.painterSymbol.material = this.layer.options.material;
        }
        if (this.layer.options.sideMaterial) {
            this.sidePainterSymbol.material = this.layer.options.sideMaterial;
        } else {
            this.sidePainterSymbol.material = this.layer.options.material;
        }
        const sceneConfig = {
            cullFace: this.layer.options.cullFace
        };
        const painter = new StandardPainter(this.regl, this.layer, this.painterSymbol, sceneConfig, 0, dataConfig);
        this.sidePainter = new StandardPainter(this.regl, this.layer, this.sidePainterSymbol, sceneConfig, 0, dataConfig);
        return painter;
    }

    _startFrame(...args) {
        super._startFrame(...args);
        const painter = this.painter;
        this.painter = this.sidePainter;
        super._startFrame(...args);
        this.painter = painter;
    }

    _renderMeshes(...args) {
        const context = args[0];
        const sceneFilter = context.sceneFilter;
        context.sceneFilter = mesh => {
            return (!sceneFilter || sceneFilter(mesh)) && topFilter(mesh);
        };
        super._renderMeshes(...args);
        context.sceneFilter = mesh => {
            return (!sceneFilter || sceneFilter(mesh)) && topFilter(mesh);
        };
        const painter = this.painter;
        this.painter = this.sidePainter;
        context.sceneFilter = mesh => {
            return (!sceneFilter || sceneFilter(mesh)) && sideFilter(mesh);
        };
        super._renderMeshes(...args);
        this.painter = painter;
        context.sceneFilter = sceneFilter;
    }

    createMesh(painter, PackClass, symbol, features, atlas, center) {
        const meshes = [];
        this._extrudeCenter = center;
        const data = this._createPackData(features, symbol, true, false);
        const sideData = this._createPackData(features, symbol, false, true);
        if (data) {
            const topMesh = this._createMesh(data, painter, PackClass, symbol, features, null, center);
            topMesh.meshes[0].properties.top = 1;
            meshes.push(topMesh);
        }
        if (sideData) {
            const sideMesh = this._createMesh(sideData, painter, PackClass, symbol, features, null, center);
            sideMesh.meshes[0].properties.side = 1;
            meshes.push(sideMesh);
        }
        return meshes;
    }

    _createPackData(features, symbol, top, side) {
        const map = this.getMap();
        symbol = SYMBOL;
        const center = this._extrudeCenter;
        const extent = Infinity;
        const localScale = 1;
        // 原zoom是用来计算functiont-type 的symbol属性值
        const zoom = map.getZoom();
        const tilePoint = new maptalks.Point(0, 0);
        const dataConfig = extend({}, DEFAULT_DATACONFIG, this.layer.options.dataConfig);
        dataConfig.uv = 1;
        if (dataConfig.top) {
            dataConfig.top = top;
        }
        if (dataConfig.side) {
            dataConfig.side = side;
        }
        if (dataConfig.top === false && dataConfig.side === false) {
            return null;
        }
        const debugIndex = undefined;
        if (!features.length) {
            return null;
        }
        const projectionCode = map.getProjection().code;
        const data = build3DExtrusion(features, dataConfig, extent, tilePoint, map.getGLRes(), 1,
            localScale, this._zScale, symbol, zoom, projectionCode, debugIndex, Float32Array, center);
        return data;
    }

    updateMesh(polygon) {
        const uid = polygon[ID_PROP];
        let feature = this.features[uid];
        if (!feature) {
            return;
        }
        const data = this._createPackData([feature], this.painterSymbol, 1, 0);
        let index = 0;
        if (data && data.data) {
            this._updateMeshData(this.meshes[index++], feature.id, data);
        }
        const sideData = this._createPackData([feature], this.painterSymbol, 0, 1);
        if (sideData && sideData.data) {
            this._updateMeshData(this.meshes[index++], feature.id, sideData);
        }
    }

    _convertGeo(geo) {
        if (!geo.getProperties()) {
            geo.setProperties({});
        }
        if (!geo.getProperties()[PROP_OMBB]) {
            const coordinates = geo.getCoordinates();
            if (geo instanceof maptalks.MultiPolygon) {
                const ombb = [];
                for (let i = 0; i < coordinates.length; i++) {
                    const shell = coordinates[i] && coordinates[i][0];
                    ombb[i] = computeOMBB(shell);
                }
                geo.getProperties()[PROP_OMBB] = ombb;
            } else {
                const ombb = computeOMBB(coordinates[0]);
                geo.getProperties()[PROP_OMBB] = ombb;
            }

        }
        return super._convertGeo(geo);
    }

    resizeCanvas(canvasSize) {
        super.resizeCanvas(canvasSize);
        if (this.sidePainter) {
            this.sidePainter.resize(this.canvas.width, this.canvas.height);
        }
    }

    onRemove() {
        super.onRemove();
        if (this.sidePainter) {
            this.sidePainter.delete();
            delete this.sidePainter;
        }
    }

    drawOutline(fbo) {
        super.drawOutline(fbo);
        if (this._outlineAll) {
            if (this.sidePainter) {
                this.sidePainter.outlineAll(fbo);
            }
        }
        if (this._outlineFeatures) {
            for (let i = 0; i < this._outlineFeatures.length; i++) {
                if (this.sidePainter) {
                    this.sidePainter.outline(fbo, this._outlineFeatures[i]);
                }
            }
        }
    }

    getShadowMeshes() {
        if (!this.painter) {
            return [];
        }
        const meshes = this.painter.getShadowMeshes();
        const sideMeshes = this.sidePainter.getShadowMeshes();
        pushIn(meshes, sideMeshes);
        return meshes;
    }
}

ExtrudePolygonLayer.registerRenderer('gl', ExtrudePolygonLayerRenderer);
ExtrudePolygonLayer.registerRenderer('canvas', null);

export default ExtrudePolygonLayer;
