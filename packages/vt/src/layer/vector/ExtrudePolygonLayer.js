import * as maptalks from 'maptalks';
import { extend } from '../../common/Util';
import Vector3DLayer from './Vector3DLayer';
import { PolygonLayerRenderer } from './PolygonLayer';
import { fromJSON } from './util/from_json';
import { ID_PROP } from './util/convert_to_feature';
import { build3DExtrusion } from '../../worker/builder/';
import { hasTexture } from '../../worker/layer/BaseLayerWorker';

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
}

ExtrudePolygonLayer.registerJSONType('ExtrudePolygonLayer');

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
        const painter = new StandardPainter(this.regl, this.layer, this.painterSymbol, this.layer.options.sceneConfig || {}, 0, dataConfig);
        return painter;
    }

    createMesh(painter, PackClass, symbol, features, atlas, center) {
        const extent = Infinity;
        const localScale = 1;
        // 原zoom是用来计算functiont-type 的symbol属性值
        const zoom = this.getMap().getZoom();
        const tilePoint = center;
        const t = hasTexture(this.layer.options.material);
        if (t) {
            dataConfig.uv = 1;
            if (t === 2) {
                dataConfig.tangent = 1;
            }
        }
        const dataConfig = extend({}, DEFAULT_DATACONFIG, this.layer.options.dataConfig || {});
        const debugIndex = undefined;
        if (!features.length) {
            return Promise.resolve([]);
        }

        const data = build3DExtrusion(features, dataConfig, extent, tilePoint,
            localScale, this._zScale, symbol, zoom, debugIndex, Float32Array);
        console.log(data);
        const aPosition = data.data.data.aPosition;
        for (let i = 0; i < aPosition.length; i += 3) {
            aPosition[i] -= center[0];
            aPosition[i + 1] -= center[1];
        }

        return this._createMesh(data, painter, PackClass, symbol, features, null, center);
    }

    updateMesh(polygon) {
        // return this._updateMesh(polygon, this.meshes, null, this._meshCenter, this.painter, null, SYMBOL, this._groupPolygonFeatures);
    }


}

ExtrudePolygonLayer.registerRenderer('gl', ExtrudePolygonLayerRenderer);
ExtrudePolygonLayer.registerRenderer('canvas', null);

export default ExtrudePolygonLayer;
