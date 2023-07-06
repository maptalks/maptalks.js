import GLTFMarker from './GLTFMarker';

export default class GLTFGeometry extends GLTFMarker {
    _calSpatialScale(out) {
        const map = this.getMap();
        const glRes = map.getGLRes();
        const point = map.distanceToPointAtRes(100, 100, glRes, this.getCenter());
        const scaleZ = map.altitudeToPoint(100, glRes);
        out[0] *= point.x / 100;
        out[1] *= point.y / 100;
        out[2] *= scaleZ / 100;
        return out;
    }
}
