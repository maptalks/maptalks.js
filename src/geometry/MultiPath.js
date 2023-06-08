import MultiGeometry from './MultiGeometry';
import Coordinate from '../geo/Coordinate';
import { DEFAULT_PATH_SYMBOL } from '../core/Constants';

const options = {
    'symbol': DEFAULT_PATH_SYMBOL
};

/**
 * @classdesc
 * An abstract class for MultiPolygon and MultiLineString
 * @category geometry
 * @extends MultiGeometry
 */
class MultiPath extends MultiGeometry {

    /**
     * Get center of (MultiLineString or MultiPolygon)'s intersection with give extent
     * @example
     *  const extent = map.getExtent();
     *  const center = geometry.getCenterInExtent(extent);
     * @param {Extent} extent
     * @return {Coordinate} center, null if line doesn't intersect with extent
     */
    getCenterInExtent(extent) {
        const children = this.getGeometries();
        let [sumx, sumy, counter] = [0, 0, 0];
        children.forEach(l => {
            const c = l.getCenterInExtent(extent);
            if (c) {
                sumx += c.x * c.count;
                sumy += c.y * c.count;
                counter += c.count;
            }
        });
        if (counter === 0) {
            return null;
        }
        return new Coordinate(sumx, sumy)._multi(1 / counter);
    }
}

MultiPath.mergeOptions(options);
export default MultiPath;
