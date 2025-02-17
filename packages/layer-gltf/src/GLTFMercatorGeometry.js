import GLTFMarker from './GLTFMarker';
import { Coordinate, Point, projection } from 'maptalks';
const COORD = new Coordinate(0, 0), POINT = new Point(0, 0), TEMP_POINT1 = new Point(0, 0), TEMP_POINT2 = new Point(0, 0);
export default class GLTFMercatorGeometry extends GLTFMarker {
    _calSpatialScale(out) {
        const map = this.getMap();
        const glRes = map.getGLRes();
        const coordinate = this.getCoordinates();
        const currentPoint =  map.coordToPointAtRes(coordinate, glRes, TEMP_POINT1);
        const mercatorPoint = projection.EPSG3857.project(coordinate, COORD);
        const targetMercatorPoint = mercatorPoint['_add'](1, 1);
        const targetCoordinate = projection.EPSG3857.unproject(targetMercatorPoint, POINT);
        const point = map.coordToPointAtRes(targetCoordinate, glRes, TEMP_POINT2);
        const disX = point.x - currentPoint.x, disY = point.y - currentPoint.y;
        const scaleZ = map.altitudeToPoint(100, glRes);
        out[0] *= disX;
        out[1] *= disY;
        out[2] *= scaleZ / 100;
        return out;
    }
}
