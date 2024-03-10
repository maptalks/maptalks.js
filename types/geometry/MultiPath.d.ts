import MultiGeometry from './MultiGeometry';
import Coordinate from '../geo/Coordinate';
/**
 * @classdesc
 * An abstract class for MultiPolygon and MultiLineString
 * @category geometry
 * @extends MultiGeometry
 */
declare class MultiPath extends MultiGeometry {
    /**
     * Get center of (MultiLineString or MultiPolygon)'s intersection with give extent
     * @example
     *  const extent = map.getExtent();
     *  const center = geometry.getCenterInExtent(extent);
     * @param {Extent} extent
     * @return {Coordinate} center, null if line doesn't intersect with extent
     */
    getCenterInExtent(extent: any): Coordinate;
}
export default MultiPath;
