import { forEachCoord, sign, wrap } from '../../core/util/util';
import Coordinate from '../Coordinate';
import Extent from '../Extent';

const CommonProjection = {
    code: '',

    is(code: string) {
        if (this.code === code) {
            return true;
        }
        if (!this.aliases) {
            return false;
        }
        for (let i = 0; i < this.aliases.length; i++) {
            if (this.aliases[i] === code) {
                return true;
            }
        }
        return false;
    },

    /**
     * 将地理坐标投影到投影坐标（二维坐标）
     * @english
     * Project a geographical coordinate to a projected coordinate (2d coordinate)
     * @param p - coordinate to project
     * @function projection.Common.project
     */
    project(p: Coordinate): Coordinate {
        return p;
    },

    /**
     * 将投影坐标转到地理坐标（二维坐标）
     *
     * @english
     * Unproject a projected coordinate to a geographical coordinate (2d coordinate)
     * @param p - coordinate to project
     * @function projection.Common.unproject
     */
    unproject(p: Coordinate): Coordinate {
        return p;
    },

    /**
     * 批量将地理坐标投影到投影坐标
     *
     * @english
     * Project a group of geographical coordinates to projected coordinates.
     * @param coordinates - coordinates to project
     * @function projection.Common.projectCoords
     */
    projectCoords(coordinates: Coordinate[] | Coordinate[][] | Coordinate[][][], antiMeridian?: boolean): Coordinate[] | Coordinate[][] | Coordinate[][][] {
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
            return coordinates.map(coords => this.projectCoords(coords, antiMeridian));
        } else {
            const antiMeridianEnable = antiMeridian !== false;
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
                if (Math.abs(dx) > 180 && antiMeridianEnable) {
                    if (wrapX === undefined) {
                        wrapX = current.x > pre.x;
                    }
                    if (wrapX) {
                        p._add(-circum.x * sign(dx) * sx, 0);
                        current._add(-360 * sign(dx), 0);
                    }
                }
                if (Math.abs(dy) > 90 && antiMeridianEnable) {
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
     * 批量将投影坐标转到地理坐标
     *
     * @english
     * Unproject a group of projected coordinates to geographical coordinates.
     * @param projCoords - projected coordinates to unproject
     * @function projection.Common.unprojectCoords
     */
    unprojectCoords(projCoords: Coordinate[] | Coordinate[][] | Coordinate[][][]): Coordinate[] | Coordinate[][] | Coordinate[][][] {
        if (!projCoords) {
            return [];
        }
        if (!Array.isArray(projCoords)) {
            return this.unproject(projCoords);
        }
        return forEachCoord(projCoords, this.unproject, this);
    },

    /**
     * 投影是否为球面
     *
     * @english
     * Whether the projection is spherical
     */
    isSphere(): boolean {
        return !!this.sphere;
    },

    /**
     * 判断传入的投影坐标是否超出椭球体范围
     *
     * @english
     * If the projected coord out of the sphere
     * @param pcoord projected coord
     * @return {Boolean}
     */
    isOutSphere(pcoord: Coordinate): boolean {
        if (!this.isSphere()) {
            return false;
        }
        const extent = this.getSphereExtent();
        return !extent.contains(pcoord);
    },

    /**
     * 限制投影坐标在球体中
     *
     * @english
     * Wrap the projected coord in the sphere
     * @param pcoord projected coord
     * @returns wrapped projected coord
     */
    wrapCoord(pcoord: Coordinate): Coordinate {
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

    getCircum(): Record<string, number> {
        if (!this.circum && this.isSphere()) {
            const extent = this.getSphereExtent();
            this.circum = {
                x: extent.getWidth(),
                y: extent.getHeight()
            };
        }
        return this.circum;
    },

    getSphereExtent(): Extent {
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

export type CommonProjectionType = typeof CommonProjection;

/**
 * 投影公共方法
 * @english
 * Common Methods of Projections.
 * @protected
 * @group projection
 * @namespace Common
 */
export default CommonProjection;
