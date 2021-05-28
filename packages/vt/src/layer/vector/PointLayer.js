import * as maptalks from 'maptalks';
import Vector3DLayer from './Vector3DLayer';
import Vector3DLayerRenderer from './Vector3DLayerRenderer';
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
        sceneConfig.depthFunc = sceneConfig.depthFunc || 'always';
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
