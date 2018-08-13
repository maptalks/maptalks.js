import { extend, isNil } from '../core/util';
import { withInEllipse } from '../core/util/path';
import Coordinate from '../geo/Coordinate';
import Extent from '../geo/Extent';
import CenterMixin from './CenterMixin';
import Polygon from './Polygon';

/**
 * @property {Object} options
 * @property {Number} [options.numberOfShellPoints=60]   - number of shell points when converting the circle to a polygon.
 * @memberOf Circle
 * @instance
 */
const options = {
    'numberOfShellPoints': 60
};

/**
 * @classdesc
 * Represents a Circle Geometry. <br>
 * @category geometry
 * @extends Polygon
 * @mixes Geometry.Center
 * @example
 * var circle = new Circle([100, 0], 1000, {
 *     id : 'circle0',
 *     properties : {
 *         foo : 'bar'
 *     }
 * });
 * @mixes CenterMixin
 */
class Circle extends CenterMixin(Polygon) {

    static fromJSON(json) {
        const feature = json['feature'];
        const circle = new Circle(json['coordinates'], json['radius'], json['options']);
        circle.setProperties(feature['properties']);
        return circle;
    }

    /**
     * @param {Coordinate} center - center of the circle
     * @param {Number} radius           - radius of the circle, in meter
     * @param {Object} [options=null]   - construct options defined in [Circle]{@link Circle#options}
     */
    constructor(coordinates, radius, opts) {
        super(null, opts);
        if (coordinates) {
            this.setCoordinates(coordinates);
        }
        this._radius = radius;
    }

    /**
     * Get radius of the circle
     * @return {Number}
     */
    getRadius() {
        return this._radius;
    }

    /**
     * Set a new radius to the circle
     * @param {Number} radius - new radius
     * @return {Circle} this
     * @fires Circle#shapechange
     */
    setRadius(radius) {
        this._radius = radius;
        this.onShapeChanged();
        return this;
    }

    /**
     * Gets the shell of the circle as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link Circle#options}
     * @return {Coordinate[]} - shell coordinates
     */
    getShell() {
        const measurer = this._getMeasurer(),
            center = this.getCoordinates(),
            numberOfPoints = this.options['numberOfShellPoints'],
            radius = this.getRadius();
        const shell = [];
        let rad, dx, dy;
        for (let i = 0, len = numberOfPoints - 1; i < len; i++) {
            rad = (360 * i / len) * Math.PI / 180;
            dx = radius * Math.cos(rad);
            dy = radius * Math.sin(rad);
            const vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        shell.push(shell[0]);
        return shell;
    }

    /**
     * Circle won't have any holes, always returns null
     * @return {Object[]} an empty array
     */
    getHoles() {
        return [];
    }

    animateShow() {
        return this.show();
    }

    _containsPoint(point, tolerance) {
        const map = this.getMap();
        if (map.getPitch()) {
            return super._containsPoint(point, tolerance);
        }
        const center = map._pointToContainerPoint(this._getCenter2DPoint()),
            size = this.getSize(),
            t = isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            se = center.add(size.width / 2, size.height / 2);
        return withInEllipse(point, center, se, t);
    }

    _computePrjExtent(projection) {
        const minmax = this._getMinMax(projection);
        if (!minmax) {
            return null;
        }
        const pcenter = this._getPrjCoordinates();
        const pminmax = minmax.map(c => projection.project(c));
        const dx = Math.min(Math.abs(pminmax[0].x - pcenter.x), Math.abs(pminmax[1].x - pcenter.x)),
            dy = Math.min(Math.abs(pminmax[2].y - pcenter.y), Math.abs(pminmax[3].y - pcenter.y));
        return new Extent(pcenter.sub(dx, dy), pcenter.add(dx, dy));
    }

    _computeExtent(measurer) {
        const minmax = this._getMinMax(measurer);
        if (!minmax) {
            return null;
        }
        return new Extent(minmax[0].x, minmax[2].y, minmax[1].x, minmax[3].y, this._getProjection());
    }

    _getMinMax(measurer) {
        if (!measurer || !this._coordinates || isNil(this._radius)) {
            return null;
        }
        const radius = this._radius;
        const p1 = measurer.locate(this._coordinates, -radius, 0),
            p2 = measurer.locate(this._coordinates, radius, 0),
            p3 = measurer.locate(this._coordinates, 0, radius),
            p4 = measurer.locate(this._coordinates, 0, -radius);
        return [p1, p2, p3, p4];
    }

    _computeGeodesicLength() {
        if (isNil(this._radius)) {
            return 0;
        }
        return Math.PI * 2 * this._radius;
    }

    _computeGeodesicArea() {
        if (isNil(this._radius)) {
            return 0;
        }
        return Math.PI * Math.pow(this._radius, 2);
    }

    _exportGeoJSONGeometry() {
        const coordinates = Coordinate.toNumberArrays([this.getShell()]);
        return {
            'type': 'Polygon',
            'coordinates': coordinates
        };
    }

    _toJSON(options) {
        const center = this.getCenter();
        const opts = extend({}, options);
        opts.geometry = false;
        const feature = this.toGeoJSON(opts);
        feature['geometry'] = {
            'type': 'Polygon'
        };
        return {
            'feature': feature,
            'subType': 'Circle',
            'coordinates': [center.x, center.y],
            'radius': this.getRadius()
        };
    }

}

Circle.mergeOptions(options);

Circle.registerJSONType('Circle');

export default Circle;
