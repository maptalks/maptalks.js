import { forEachCoord, sign, wrap } from '../../core/util';
import Coordinate from '../Coordinate';
import Extent from '../Extent';

/**
 * Common Methods of Projections.
 * @mixin
 * @protected
 * @memberOf projection
 * @name Common
 */
export default /** @lends projection.Common */ {
    /**
     * Project a geographical coordinate to a projected coordinate (2d coordinate)
     * @param  {Coordinate} p - coordinate to project
     * @return {Coordinate}
     * @function projection.Common.project
     */
    project() {},
    /**
     * Unproject a projected coordinate to a geographical coordinate (2d coordinate)
     * @param  {Coordinate} p - coordinate to project
     * @return {Coordinate}
     * @function projection.Common.unproject
     */
    unproject() {},
    /**
     * Project a group of geographical coordinates to projected coordinates.
     * @param  {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates - coordinates to project
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]}
     * @function projection.Common.projectCoords
     */
    projectCoords(coordinates) {
        if (!coordinates) {
            return [];
        }
        if (!Array.isArray(coordinates)) {
            return this.project(coordinates);
        }
        if (coordinates.length === 0) {
            return [];
        }
        if (!this.isSphere()) {
            return forEachCoord(coordinates, this.project, this);
        }
        if (Array.isArray(coordinates[0])) {
            return coordinates.map(coords => this.projectCoords(coords));
        } else {
            const circum = this.getCircum();
            const extent = this.getSphereExtent(),
                sx = extent.sx,
                sy = extent.sy;
            let wrapX, wrapY;
            let pre = coordinates[0], current, dx, dy, p;
            const prj = [this.project(pre)];
            for (let i = 1, l = coordinates.length; i < l; i++) {
                current = coordinates[i];
                dx = current.x - pre.x;
                dy = current.y - pre.y;
                p = this.project(current);
                if (Math.abs(dx) > 180) {
                    if (wrapX === undefined) {
                        wrapX = current.x < pre.x;
                    }
                    if (wrapX) {
                        p._add(-circum.x * sign(dx) * sx, 0);
                        current._add(-360 * sign(dx), 0);
                    }
                }
                if (Math.abs(dy) > 90) {
                    if (wrapY === undefined) {
                        wrapY = current.y < pre.y;
                    }
                    if (wrapY) {
                        p._add(0, -circum.y * sign(dy) * sy);
                        current._add(0, -180 * sign(dy));
                    }
                }
                pre = current;
                prj.push(p);
            }
            return prj;
        }
    },

    /**
     * Unproject a group of projected coordinates to geographical coordinates.
     * @param  {Coordinate[]|Coordinate[][]|Coordinate[][][]} projCoords - projected coordinates to unproject
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]}
     * @function projection.Common.unprojectCoords
     */
    unprojectCoords(projCoords) {
        if (!projCoords) {
            return [];
        }
        if (!Array.isArray(projCoords)) {
            return this.unproject(projCoords);
        }
        return forEachCoord(projCoords, this.unproject, this);
    },

    /**
     * Whether the projection is spherical
     * @return {Boolean}
     */
    isSphere() {
        return !!this.sphere;
    },

    /**
     * If the projected coord out of the sphere
     * @param  {Coordinate}  pcoord projected coord
     * @return {Boolean}
     */
    isOutSphere(pcoord) {
        if (!this.isSphere()) {
            return false;
        }
        const extent = this.getSphereExtent();
        return !extent.contains(pcoord);
    },

    /**
     * Wrap the projected coord in the sphere
     * @param  {Coordinate} pcoord projected coord
     * @return {Coordinate} wrapped projected coord
     */
    wrapCoord(pcoord) {
        if (!this.isSphere()) {
            return pcoord;
        }
        const extent = this.getSphereExtent();
        const wrapped = new Coordinate(pcoord);
        if (!extent.contains(wrapped)) {
            wrapped.x = wrap(pcoord.x, extent.xmin, extent.xmax);
            wrapped.y = wrap(pcoord.y, extent.ymin, extent.ymax);
        }
        return wrapped;
    },

    getCircum() {
        if (!this.circum && this.isSphere()) {
            const extent = this.getSphereExtent();
            this.circum = {
                x : extent.getWidth(),
                y : extent.getHeight()
            };
        }
        return this.circum;
    },

    getSphereExtent() {
        if (!this.extent && this.isSphere()) {
            const max = this.project(new Coordinate(180, 90)),
                min = this.project(new Coordinate(-180, -90));
            this.extent = new Extent(min, max, this);
            this.extent.sx = max.x > min.x ? 1 : -1;
            this.extent.sy = max.y > min.y ? 1 : -1;
        }
        return this.extent;
    }
};
