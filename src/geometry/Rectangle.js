import { extend, isNil } from 'core/util';
import Coordinate from 'geo/Coordinate';
import Point from 'geo/Point';
import PointExtent from 'geo/PointExtent';
import Extent from 'geo/Extent';
import Polygon from './Polygon';
import GeoJSON from './GeoJSON';

/**
 * @classdesc
 * Represents a Rectangle geometry, a child class of [Polygon]{@link Polygon}. <br>
 *     It means it shares all the methods defined in [Polygon]{@link Polygon} besides some overrided ones.
 * @class
 * @category geometry
 * @extends {Polygon}
 * @param {Coordinate} coordinates  - northwest of the rectangle
 * @param {Number} width                     - width of the rectangle
 * @param {Number} height                    - height of the rectangle
 * @param {Object} [options=null]            - options defined in [Rectangle]{@link Rectangle#options}
 * @example
 * var rectangle = new Rectangle([100, 0], 1000, 500, {
 *     id : 'rectangle0'
 * });
 */
const Rectangle = Polygon.extend(/** @lends Rectangle.prototype */ {

    initialize: function (coordinates, width, height, opts) {
        this._coordinates = new Coordinate(coordinates);
        this._width = width;
        this._height = height;
        this._initOptions(opts);
    },

    /**
     * Get coordinates of rectangle's northwest
     * @return {Coordinate}
     */
    getCoordinates: function () {
        return this._coordinates;
    },

    /**
     * Set a new coordinate for northwest of the rectangle
     * @param {Coordinate} nw - coordinates of new northwest
     * @return {Rectangle} this
     * @fires Rectangle#positionchange
     */
    setCoordinates: function (nw) {
        this._coordinates = new Coordinate(nw);

        if (!this._coordinates || !this.getMap()) {
            this.onPositionChanged();
            return this;
        }
        var projection = this._getProjection();
        this._setPrjCoordinates(projection.project(this._coordinates));
        return this;
    },

    /**
     * Get rectangle's width
     * @return {Number}
     */
    getWidth: function () {
        return this._width;
    },

    /**
     * Set new width to the rectangle
     * @param {Number} width - new width
     * @fires Rectangle#shapechange
     * @return {Rectangle} this
     */
    setWidth: function (width) {
        this._width = width;
        this.onShapeChanged();
        return this;
    },

    /**
     * Get rectangle's height
     * @return {Number}
     */
    getHeight: function () {
        return this._height;
    },

    /**
     * Set new height to rectangle
     * @param {Number} height - new height
     * @fires Rectangle#shapechange
     * @return {Rectangle} this
     */
    setHeight: function (height) {
        this._height = height;
        this.onShapeChanged();
        return this;
    },

    /**
     * Gets the shell of the rectangle as a polygon
     * @return {Coordinate[]} - shell coordinates
     */
    getShell: function () {
        var measurer = this._getMeasurer();
        var nw = this._coordinates;
        var map = this.getMap();
        var r = -1;
        if (map) {
            var fExt = map.getFullExtent();
            if (fExt['bottom'] > fExt['top']) {
                r = 1;
            }
        }
        var points = [];
        points.push(nw);
        points.push(measurer.locate(nw, this._width, 0));
        points.push(measurer.locate(nw, this._width, r * this._height));
        points.push(measurer.locate(nw, 0, r * this._height));
        points.push(nw);
        return points;

    },

    /**
     * Rectangle won't have any holes, always returns null
     * @return {null}
     */
    getHoles: function () {
        return null;
    },

    _getPrjCoordinates: function () {
        var projection = this._getProjection();
        if (!projection) {
            return null;
        }
        if (!this._pnw) {
            if (this._coordinates) {
                this._pnw = projection.project(this._coordinates);
            }
        }
        return this._pnw;
    },

    _setPrjCoordinates: function (pnw) {
        this._pnw = pnw;
        this.onPositionChanged();
    },

    //update cached variables if geometry is updated.
    _updateCache: function () {
        delete this._extent;
        var projection = this._getProjection();
        if (this._pnw && projection) {
            this._coordinates = projection.unproject(this._pnw);
        }
    },

    _clearProjection: function () {
        this._pnw = null;
    },

    _computeCenter: function (measurer) {
        return measurer.locate(this._coordinates, this._width / 2, -this._height / 2);
    },

    _containsPoint: function (point, tolerance) {
        var map = this.getMap(),
            t = isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            sp = map.coordinateToPoint(this._coordinates),
            pxSize = map.distanceToPixel(this._width, this._height);

        var pxMin = new Point(sp.x, sp.y),
            pxMax = new Point(sp.x + pxSize.width, sp.y + pxSize.height),
            pxExtent = new PointExtent(pxMin.x - t, pxMin.y - t,
                pxMax.x + t, pxMax.y + t);

        point = new Point(point.x, point.y);

        return pxExtent.contains(point);
    },

    _computeExtent: function (measurer) {
        if (!measurer || !this._coordinates || isNil(this._width) || isNil(this._height)) {
            return null;
        }
        var width = this.getWidth(),
            height = this.getHeight();
        var p1 = measurer.locate(this._coordinates, width, -height);
        return new Extent(p1, this._coordinates);
    },

    _computeGeodesicLength: function () {
        if (isNil(this._width) || isNil(this._height)) {
            return 0;
        }
        return 2 * (this._width + this._height);
    },

    _computeGeodesicArea: function () {
        if (isNil(this._width) || isNil(this._height)) {
            return 0;
        }
        return this._width * this._height;
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
        var nw = this.getCoordinates();
        opts.geometry = false;
        var feature = this.toGeoJSON(opts);
        feature['geometry'] = {
            'type': 'Polygon'
        };
        return {
            'feature': feature,
            'subType': 'Rectangle',
            'coordinates': [nw.x, nw.y],
            'width': this.getWidth(),
            'height': this.getHeight()
        };
    }

});

Rectangle.fromJSON = function (json) {
    var feature = json['feature'];
    var rect = new Rectangle(json['coordinates'], json['width'], json['height'], json['options']);
    rect.setProperties(feature['properties']);
    return rect;
};

export default Rectangle;
