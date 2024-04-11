import * as maptalks from 'maptalks';
import Vector3DLayer from './Vector3DLayer';
import Vector3DLayerRenderer from './Vector3DLayerRenderer';
import { fromJSON } from './util/from_json';
import { ICON_PAINTER_SCENECONFIG } from '../core/Constant';
import { extend } from '../../common/Util';

const defaultOptions = {
    glyphSdfLimitPerFrame: 15,
    iconErrorUrl: null,
    workarounds: {
        //#94, text rendering crashes on windows with intel gpu
        'win-intel-gpu-crash': true
    },
    collision: false,
    collisionFrameLimit: 1
};

class PointLayer extends Vector3DLayer {
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

    constructor(...args) {
        super(...args);
        if (!this.options.sceneConfig) {
            this.options.sceneConfig = extend({}, ICON_PAINTER_SCENECONFIG);
        }
    }

    getPolygonOffsetCount() {
        return 0;
    }

    getPolygonOffset() {
        return 0;
    }
}

PointLayer.mergeOptions(defaultOptions);

PointLayer.registerJSONType('PointLayer');

PointLayer.registerRenderer('canvas', null);

export default PointLayer;


const MAX_MARKER_SIZE = 255;

class PointLayerRenderer extends Vector3DLayerRenderer {
    constructor(...args) {
        super(...args);
        this.GeometryTypes = [maptalks.Marker, maptalks.MultiPoint];
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
}

PointLayer.registerRenderer('gl', PointLayerRenderer);
