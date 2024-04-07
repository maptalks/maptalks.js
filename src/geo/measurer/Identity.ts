import { extend } from '../../core/util/common';
import Coordinate, { CoordinateJson } from '../Coordinate';
import Point from '../Point';
import Common, { type CommonMeasurer } from './Common';
import type { WithNull } from '../../types/typings';

const identity = {
    /**
     * the code of the measurer
     */
    'measure': 'IDENTITY',

    /**
     * 计算两个坐标之间的距离
     *
     * @english
     * Measure the length between 2 coordinates.
     * @param c1
     * @param c2
     */
    measureLenBetween: function (c1: Coordinate | CoordinateJson, c2: Coordinate | CoordinateJson): number {
        if (!c1 || !c2) {
            return 0;
        }
        try {
            return Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
        } catch (err) {
            return 0;
        }
    },

    /**
     * 测量给定闭合坐标的面积
     *
     * @english
     * Measure the area closed by the given coordinates.
     * @param coordinates
     */
    measureArea: function (coordinates: (Coordinate | CoordinateJson)[]): number {
        if (!Array.isArray(coordinates)) {
            return 0;
        }
        let area = 0;
        for (let i = 0, len = coordinates.length; i < len; i++) {
            const c1 = coordinates[i];
            let c2 = null;
            if (i === len - 1) {
                c2 = coordinates[0];
            } else {
                c2 = coordinates[i + 1];
            }
            area += c1.x * c2.y - c1.y * c2.x;
        }
        return Math.abs(area / 2);
    },

    /**
     * 使用 x 轴距离和 y 轴距离从给定源坐标定位坐标
     * @english
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param c
     * @param xDist
     * @param yDist
     * @param out
     */
    locate : function (c: Coordinate | CoordinateJson, xDist: number, yDist: number, out?: Coordinate) {
        out = out || new Coordinate(0, 0);
        out.set(c.x, c.y);
        return this._locate(out, xDist, yDist);
    },

    /**
     * 使用 x 轴距离和 y 轴距离从给定源坐标定位坐标（这是一个私有方法）
     * @english
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param c     - source coordinate
     * @param xDist     - x-axis distance
     * @param yDist     - y-axis distance
     * @private
     */
    _locate: function (c: Coordinate, xDist: number, yDist: number): WithNull<Coordinate> {
        if (!c) {
            return null;
        }
        if (!xDist) {
            xDist = 0;
        }
        if (!yDist) {
            yDist = 0;
        }
        if (!xDist && !yDist) {
            return c;
        }
        c.x = c.x + xDist;
        c.y = c.y + yDist;
        return c;
    },

    /**
     * 绕枢轴旋转给定角度的坐标
     *
     * @english
     * Rotate a coordinate of given angle around pivot
     * @param c  - source coordinate
     * @param pivot - pivot
     * @param angle - angle in degree
     */
    rotate: function (c: Coordinate | CoordinateJson, pivot: Coordinate, angle: number) {
        c = new Coordinate(c.x, c.y);
        return this._rotate(c as Coordinate, pivot, angle);
    },

    /**
     * 绕枢轴旋转给定角度的坐标
     *
     * @english
     * Rotate a coordinate of given angle around pivot
     * @param c  - source coordinate
     * @param pivot - pivot
     * @param angle - angle in degree
     * @private
     */
    _rotate: function () {
        const tmp = new Point(0, 0);
        return function (c: Coordinate, pivot: Coordinate, angle: number): Coordinate {
            tmp.x = c.x - pivot.x;
            tmp.y = c.y - pivot.y;
            tmp._rotate(angle * Math.PI / 180);
            c.x = pivot.x + tmp.x;
            c.y = pivot.y + tmp.y;
            return c;
        };
    }()
};

const extended = extend<typeof identity, CommonMeasurer>(identity, Common);

export type IdentityMeasurerType = typeof extended;

/**
 * Identity 的measurer，适用于笛卡尔坐标系
 * @english
 * Identity measurer, a measurer for Cartesian coordinate system.
 *
 * @category geo
 * @protected
 * @group measurer
 * @module Identity
 * {@inheritDoc measurer.Common}
 */
export default extended;
