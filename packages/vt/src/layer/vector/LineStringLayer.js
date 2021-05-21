import * as maptalks from 'maptalks';
import Vector3DLayer from './Vector3DLayer';
import Vector3DLayerRenderer from './Vector3DLayerRenderer';
import { fromJSON } from './util/from_json';

class LineStringLayer extends Vector3DLayer {
    /**
     * Reproduce a LineStringLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {LineStringLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(json) {
        return fromJSON(json, 'LineStringLayer', LineStringLayer);
    }
}

LineStringLayer.registerJSONType('LineStringLayer');

class LineStringLayerRenderer extends Vector3DLayerRenderer {
    constructor(...args) {
        super(...args);
        this.GeometryTypes = [maptalks.LineString, maptalks.MultiLineString];
    }
}

LineStringLayer.registerRenderer('gl', LineStringLayerRenderer);
LineStringLayer.registerRenderer('canvas', null);

export default LineStringLayer;
