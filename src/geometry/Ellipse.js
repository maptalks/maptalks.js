import { extend, isNil } from '../core/util';
import { withInEllipse } from '../core/util/path';
import Coordinate from '../geo/Coordinate';
import CenterMixin from './CenterMixin';
import Polygon from './Polygon';
import Circle from './Circle';

/**
 * @property {Object} [options=null]
 * @property {Number} [options.numberOfShellPoints=60]   - number of shell points when exporting the ellipse's shell coordinates as a polygon.
 * @memberOf Ellipse
 * @instance
 */
const options = {
    'numberOfShellPoints': 80
};

/**
 * Represents a Ellipse Geometry. <br>
 * @category geometry
 * @extends Polygon
 * @mixes CenterMixin
 * @example
 * var ellipse = new Ellipse([100, 0], 1000, 500, {
 *     id : 'ellipse0'
 * });
 */
class Ellipse extends CenterMixin(Polygon) {

    static fromJSON(json) {
        const feature = json['feature'];
        const ellipse = new Ellipse(json['coordinates'], json['width'], json['height'], json['options']);
        ellipse.setProperties(feature['properties']);
        return ellipse;
    }

    /**
     * @param {Coordinate} center  - center of the ellipse
     * @param {Number} width  - width of the ellipse, in meter
     * @param {Number} height - height of the ellipse, in meter
     * @param {Object}  [options=null] - construct options defined in [Ellipse]{@link Ellipse#options}
     */
    constructor(coordinates, width, height, opts) {
        super(null, opts);
        if (coordinates) {
            this.setCoordinates(coordinates);
        }
        this.width = width;
        this.height = height;
    }

    /**
     * Get ellipse's width
     * @return {Number}
     */
    getWidth() {
        return this.width;
    }

    /**
     * Set new width to ellipse
     * @param {Number} width - new width
     * @fires Ellipse#shapechange
     * @return {Ellipse} this
     */
    setWidth(width) {
        this.width = width;
        this.onShapeChanged();
        return this;
    }

    /**
     * Get ellipse's height
     * @return {Number}
     */
    getHeight() {
        return this.height;
    }

    /**
     * Set new height to ellipse
     * @param {Number} height - new height
     * @fires Ellipse#shapechange
     * @return {Ellipse} this
     */
    setHeight(height) {
        this.height = height;
        this.onShapeChanged();
        return this;
    }

    /**
     * Gets the shell of the ellipse as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link Circle#options}
     * @return {Coordinate[]} - shell coordinates
     */
    getShell() {
        const measurer = this._getMeasurer(),
            center = this.getCoordinates(),
            numberOfPoints = this.options['numberOfShellPoints'],
            width = this.getWidth(),
            height = this.getHeight();
        const shell = [];
        const s = Math.pow(width / 2, 2) * Math.pow(height / 2, 2),
            sx = Math.pow(width / 2, 2),
            sy = Math.pow(height / 2, 2);
        let deg, rad, dx, dy;
        for (let i = 0; i < numberOfPoints; i++) {
            deg = 360 * i / numberOfPoints;
            rad = deg * Math.PI / 180;
            dx = Math.sqrt(s / (sx * Math.pow(Math.tan(rad), 2) + sy));
            dy = Math.sqrt(s / (sy * Math.pow(1 / Math.tan(rad), 2) + sx));
            if (deg > 90 && deg < 270) {
                dx *= -1;
            }
            if (deg > 180 && deg < 360) {
                dy *= -1;
            }
            const vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        return shell;
    }

    /**
     * Ellipse won't have any holes, always returns null
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
        if (map.isTransforming()) {
            return super._containsPoint(point, tolerance);
        }
        const projection = map.getProjection();
        const t = isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            pps = projection.projectCoords([this._coordinates, map.locate(this._coordinates, this.getWidth() / 2, this.getHeight() / 2)], this.options['antiMeridian']),
            p0 = map._prjToContainerPoint(pps[0]),
            p1 = map._prjToContainerPoint(pps[1]);
        return withInEllipse(point, p0, p1, t);
    }

    _computePrjExtent() {
        return Circle.prototype._computePrjExtent.apply(this, arguments);
    }

    _computeExtent() {
        return Circle.prototype._computeExtent.apply(this, arguments);
    }

    _getMinMax(measurer) {
        if (!measurer || !this._coordinates || isNil(this.width) || isNil(this.height)) {
            return null;
        }
        const width = this.getWidth(),
            height = this.getHeight();
        const p1 = measurer.locate(this._coordinates, -width / 2, 0),
            p2 = measurer.locate(this._coordinates, width / 2, 0),
            p3 = measurer.locate(this._coordinates, 0, -height / 2),
            p4 = measurer.locate(this._coordinates, 0, height / 2);
        return [p1, p2, p3, p4];
    }

    _computeGeodesicLength() {
        if (isNil(this.width) || isNil(this.height)) {
            return 0;
        }
        //L=2πb+4(a-b)
        //近似值
        const longer = (this.width > this.height ? this.width : this.height);
        return 2 * Math.PI * longer / 2 - 4 * Math.abs(this.width - this.height);
    }

    _computeGeodesicArea() {
        if (isNil(this.width) || isNil(this.height)) {
            return 0;
        }
        return Math.PI * this.width * this.height / 4;
    }

    _exportGeoJSONGeometry() {
        const coordinates = Coordinate.toNumberArrays([this.getShell()]);
        return {
            'type': 'Polygon',
            'coordinates': coordinates
        };
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
            'subType': 'Ellipse',
            'coordinates': [center.x, center.y],
            'width': this.getWidth(),
            'height': this.getHeight()
        };
    }

}

Ellipse.mergeOptions(options);

Ellipse.registerJSONType('Ellipse');

export default Ellipse;
