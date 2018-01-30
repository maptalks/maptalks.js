import { extend, isNil } from '../core/util';
import Circle from './Circle';

/**
 * @property {Object} options -
 * @property {Number} [options.numberOfShellPoints=60]   - number of shell points when converting the sector to a polygon.
 * @memberOf Sector
 * @instance
 */
const options = {
    'numberOfShellPoints': 60
};

/**
 * @classdesc
 * Represents a sector Geometry.
 * @category geometry
 * @extends Circle
 * @example
 * var sector = new Sector([100, 0], 1000, 30, 120, {
 *     id : 'sector0'
 * });
 */
class Sector extends Circle {

    static fromJSON(json) {
        const feature = json['feature'];
        const sector = new Sector(json['coordinates'], json['radius'], json['startAngle'], json['endAngle'], json['options']);
        sector.setProperties(feature['properties']);
        return sector;
    }

    /**
     * @param {Coordinate} center - center of the sector
     * @param {Number} radius           - radius of the sector, in meter
     * @param {Number} startAngle       - start angle of the sector, in degree
     * @param {Number} endAngle         - end angle of the sector, in degree
     * @param {Object} [options=null]   - construct options defined in [Sector]{@link Sector#options}
     */
    constructor(coordinates, radius, startAngle, endAngle, opts) {
        super(coordinates, radius, opts);
        this.startAngle = startAngle;
        this.endAngle = endAngle;
    }

    /**
     * Get the sector's start angle
     * @return {Number}
     */
    getStartAngle() {
        return this.startAngle;
    }

    /**
     * Set a new start angle to the sector
     * @param {Number} startAngle
     * @return {Sector} this
     * @fires Sector#shapechange
     */
    setStartAngle(startAngle) {
        this.startAngle = startAngle;
        this.onShapeChanged();
        return this;
    }

    /**
     * Get the sector's end angle
     * @return {Number}
     */
    getEndAngle() {
        return this.endAngle;
    }

    /**
     * Set a new end angle to the sector
     * @param {Number} endAngle
     * @return {Sector} this
     * @fires Sector#shapechange
     */
    setEndAngle(endAngle) {
        this.endAngle = endAngle;
        this.onShapeChanged();
        return this;
    }

    /**
     * Gets the shell of the sector as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link Sector#options}
     * @return {Coordinate[]} - shell coordinates
     */
    getShell() {
        const measurer = this._getMeasurer(),
            center = this.getCoordinates(),
            numberOfPoints = this.options['numberOfShellPoints'] - 2,
            radius = this.getRadius(),
            shell = [center.copy()],
            startAngle = this.getStartAngle(),
            angle = this.getEndAngle() - startAngle;
        let rad, dx, dy;
        for (let i = 0; i < numberOfPoints; i++) {
            rad = (angle * i / (numberOfPoints - 1) + startAngle) * Math.PI / 180;
            dx = radius * Math.cos(rad);
            dy = radius * Math.sin(rad);
            const vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        shell.push(center.copy());
        return shell;
    }

    _containsPoint(point, tolerance) {
        const map = this.getMap();
        if (map.isTransforming()) {
            return super._containsPoint(point, tolerance);
        }
        const center = map._pointToContainerPoint(this._getCenter2DPoint()),
            t = isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            size = this.getSize(),
            pc = center,
            pp = point,
            x = pp.x - pc.x,
            y = pc.y - pp.y,
            atan2 = Math.atan2(y, x),
            // [0.0, 360.0)
            angle = atan2 < 0 ? (atan2 + 2 * Math.PI) * 360 / (2 * Math.PI) :
                atan2 * 360 / (2 * Math.PI);
        const sAngle = this.startAngle % 360,
            eAngle = this.endAngle % 360;
        let between = false;
        if (sAngle > eAngle) {
            between = !(angle > eAngle && angle < sAngle);
        } else {
            between = (angle >= sAngle && angle <= eAngle);
        }
        return pp.distanceTo(pc) <= (size.width / 2 + t) && between;
    }

    _computeGeodesicLength() {
        if (isNil(this._radius)) {
            return 0;
        }
        return Math.PI * 2 * this._radius * Math.abs(this.startAngle - this.endAngle) / 360 + 2 * this._radius;
    }

    _computeGeodesicArea() {
        if (isNil(this._radius)) {
            return 0;
        }
        return Math.PI * Math.pow(this._radius, 2) * Math.abs(this.startAngle - this.endAngle) / 360;
    }

    _toJSON(options) {
        const opts = extend({}, options);
        const center = this.getCenter();
        opts.geometry = false;
        const feature = this.toGeoJSON(opts);
        feature['geometry'] = {
            'type': 'Polygon'
        };
        return {
            'feature': feature,
            'subType': 'Sector',
            'coordinates': [center.x, center.y],
            'radius': this.getRadius(),
            'startAngle': this.getStartAngle(),
            'endAngle': this.getEndAngle()
        };
    }

}

Sector.mergeOptions(options);

Sector.registerJSONType('Sector');

export default Sector;
