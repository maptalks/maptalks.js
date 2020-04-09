import Vector3DLayer from './Vector3DLayer';
import LineLayerRenderer from './LineLayerRenderer';

class LineLayer extends Vector3DLayer {

}

LineLayer.registerJSONType('LineLayer');

LineLayer.registerRenderer('gl', LineLayerRenderer);
LineLayer.registerRenderer('canvas', null);

export default LineLayer;
