import Vector3DLayer from './Vector3DLayer';
import PointLayerRenderer from './PointLayerRenderer';

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
}

PointLayer.mergeOptions(defaultOptions);

PointLayer.registerJSONType('PointLayer');

PointLayer.registerRenderer('gl', PointLayerRenderer);
PointLayer.registerRenderer('canvas', null);

export default PointLayer;
