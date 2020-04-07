import Vector3DLayer from './Vector3DLayer';
import Point3DLayerRenderer from './Point3DLayerRenderer';

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

class Point3DLayer extends Vector3DLayer {
    constructor(...args) {
        super(...args);
        if (!this.options.sceneConfig) {
            this.options.sceneConfig = {};
        }
        //disable unique placement
        this.options.sceneConfig['uniquePlacement'] = false;
        this.options.sceneConfig.collision = true;
    }
}

Point3DLayer.mergeOptions(defaultOptions);

Point3DLayer.registerJSONType('Point3DLayer');

Point3DLayer.registerRenderer('gl', Point3DLayerRenderer);
Point3DLayer.registerRenderer('canvas', null);

export default Point3DLayer;
