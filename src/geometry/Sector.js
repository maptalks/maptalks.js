import { extend, isNil } from 'core/util';
import Coordinate from 'geo/Coordinate';
import Extent from 'geo/Extent';
import { Geometry } from './Geometry';
import { GeoJSON } from './GeoJSON';
import { Polygon } from './Polygon';

/**
 * @classdesc
 * Represents a sector Geometry, a child class of [Polygon]{@link Polygon}. <br>
 *     It means it shares all the methods defined in [Polygon]{@link Polygon} besides some overrided ones.
 * @class
 * @category geometry
 * @extends Polygon
 * @mixes Geometry.Center
 * @param {Coordinate} center - center of the sector
 * @param {Number} radius           - radius of the sector
 * @param {Number} startAngle       - start angle of the sector
 * @param {Number} endAngle         - end angle of the sector
 * @param {Object} [options=null]   - construct options defined in [Sector]{@link Sector#options}
 * @example
 * var sector = new Sector([100, 0], 1000, 30, 120, {
 *     id : 'sector0'
 * });
 */
export const Sector = Polygon.extend(/** @lends Sector.prototype */ {
    includes: [Geometry.Center],

    /**
     * @property {Object} options -
     * @property {Number} [options.numberOfShellPoints=60]   - number of shell points when converting the sector to a polygon.
     */
    options: {
        'numberOfShellPoints': 60
    },

    initialize: function (coordinates, radius, startAngle, endAngle, opts) {
        this._coordinates = new Coordinate(coordinates);
        this._radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this._initOptions(opts);
    },

    /**
     * Get radius of the sector
     * @return {Number}
     */
    getRadius: function () {
        return this._radius;
    },

    /**
     * Set a new radius to the sector
     * @param {Number} radius - new radius
     * @return {Sector} this
     * @fires Sector#shapechange
     */
    setRadius: function (radius) {
        this._radius = radius;
        this.onShapeChanged();
        return this;
    },

    /**
     * Get the sector's start angle
     * @return {Number}
     */
    getStartAngle: function () {
        return this.startAngle;
    },

    /**
     * Set a new start angle to the sector
     * @param {Number} startAngle
     * @return {Sector} this
     * @fires Sector#shapechange
     */
    setStartAngle: function (startAngle) {
        this.startAngle = startAngle;
        this.onShapeChanged();
        return this;
    },

    /**
     * Get the sector's end angle
     * @return {Number}
     */
    getEndAngle: function () {
        return this.endAngle;
    },

    /**
     * Set a new end angle to the sector
     * @param {Number} endAngle
     * @return {Sector} this
     * @fires Sector#shapechange
     */
    setEndAngle: function (endAngle) {
        this.endAngle = endAngle;
        this.onShapeChanged();
        return this;
    },

    /**
     * Gets the shell of the sector as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link Sector#options}
     * @return {Coordinate[]} - shell coordinates
     */
    getShell: function () {
        var measurer = this._getMeasurer(),
            center = this.getCoordinates(),
            numberOfPoints = this.options['numberOfShellPoints'],
            radius = this.getRadius(),
            shell = [],
            angle = this.getEndAngle() - this.getStartAngle();
        var rad, dx, dy;
        for (var i = 0; i < numberOfPoints; i++) {
            rad = (angle * i / (numberOfPoints - 1) + this.getStartAngle()) * Math.PI / 180;
            dx = radius * Math.cos(rad);
            dy = radius * Math.sin(rad);
            var vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        return shell;

    },

    /**
     * Sector won't have any holes, always returns null
     * @return {null}
     */
    getHoles: function () {
        return null;
    },

    _containsPoint: function (point, tolerance) {
        var center = this._getCenter2DPoint(),
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
        var sAngle = this.startAngle % 360,
            eAngle = this.endAngle % 360;
        var between = false;
        if (sAngle > eAngle) {
            between = !(angle > eAngle && angle < sAngle);
        } else {
            between = (angle >= sAngle && angle <= eAngle);
        }

        // TODO: tolerance
        return pp.distanceTo(pc) <= (size.width / 2 + t) && between;
    },

    _computeExtent: function (measurer) {
        if (!measurer || !this._coordinates || isNil(this._radius)) {
            return null;
        }

        var radius = this._radius;
        var p1 = measurer.locate(this._coordinates, radius, radius);
        var p2 = measurer.locate(this._coordinates, -radius, -radius);
        return new Extent(p1, p2);
    },

    _computeGeodesicLength: function () {
        if (isNil(this._radius)) {
            return 0;
        }
        return Math.PI * 2 * this._radius * Math.abs(this.startAngle - this.endAngle) / 360 + 2 * this._radius;
    },

    _computeGeodesicArea: function () {
        if (isNil(this._radius)) {
            return 0;
        }
        return Math.PI * Math.pow(this._radius, 2) * Math.abs(this.startAngle - this.endAngle) / 360;
    },

    _exportGeoJSONGeometry: function () {
        var coordinates = GeoJSON.toNumberArrays([this.getShell()]);
        return {
            'type': 'Polygon',
            'coordinates': coordinates
        };
    },

    _toJSON: function (options) {
        var opts = extend({}, options);
        var center = this.getCenter();
        opts.geometry = false;
        var feature = this.toGeoJSON(opts);
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

});

Sector.fromJSON = function (json) {
    var feature = json['feature'];
    var sector = new Sector(json['coordinates'], json['radius'], json['startAngle'], json['endAngle'], json['options']);
    sector.setProperties(feature['properties']);
    return sector;
};
