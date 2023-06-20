import * as maptalks from 'maptalks';
import { extend, isNil } from '../../common/Util';
import Vector3DLayer from './Vector3DLayer';
import { PolygonLayerRenderer } from './PolygonLayer';
import { fromJSON } from './util/from_json';
import { build3DExtrusion } from '../../worker/builder/';
import { hasTexture } from '../../worker/layer/BaseLayerWorker';
import { ID_PROP } from './util/convert_to_feature';
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
        default: undefined,
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
        this._defineSymbolBloom(this.painterSymbol, 'bloom');
        const dataConfig = extend({}, DEFAULT_DATACONFIG, this.layer.options.dataConfig || {});
        if (this.layer.options.material) {
            this.painterSymbol.material = this.layer.options.material;
        }
        const sceneConfig = {
            cullFace: this.layer.options.cullFace
        };
        const painter = new StandardPainter(this.regl, this.layer, this.painterSymbol, sceneConfig, 0, dataConfig);
        return painter;
    }

    createMesh(painter, PackClass, symbol, features, atlas, center) {
        this._extrudeCenter = center;
        const data = this._createPackData(features, symbol)
        return this._createMesh(data, painter, PackClass, symbol, features, null, center);
    }

    _createPackData(features, symbol) {
        symbol = SYMBOL;
        const center = this._extrudeCenter;
        const extent = Infinity;
        const localScale = 1;
        // 原zoom是用来计算functiont-type 的symbol属性值
        const zoom = this.getMap().getZoom();
        const tilePoint = center;
        const dataConfig = extend({}, DEFAULT_DATACONFIG, this.layer.options.dataConfig || {});
        dataConfig.uv = 1;
        const debugIndex = undefined;
        if (!features.length) {
            return Promise.resolve([]);
        }

        const data = build3DExtrusion(features, dataConfig, extent, tilePoint,
            localScale, this._zScale, symbol, zoom, debugIndex, Float32Array);
        const aPosition = data.data.data.aPosition;
        for (let i = 0; i < aPosition.length; i += 3) {
            aPosition[i] -= center[0];
            aPosition[i + 1] -= center[1];
        }
        return data;
    }

    updateMesh(polygon) {
        const uid = polygon[ID_PROP];
        let feature = this.features[uid];
        const data = this._createPackData([feature], this.painterSymbol);
        if (!data || !data.data) {
            return;
        }
        this._updateMeshData(this.meshes[0], feature.id, data);
    }


}

ExtrudePolygonLayer.registerRenderer('gl', ExtrudePolygonLayerRenderer);
ExtrudePolygonLayer.registerRenderer('canvas', null);

export default ExtrudePolygonLayer;
