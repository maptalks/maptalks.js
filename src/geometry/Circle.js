/**
 * @classdesc
 * Represents a Circle Geometry, a child class of [maptalks.Polygon]{@link maptalks.Polygon}. <br>
 *     It means it shares all the methods defined in [maptalks.Polygon]{@link maptalks.Polygon} besides some overrided ones.
 * @class
 * @category geometry
 * @extends maptalks.Polygon
 * @mixes maptalks.Geometry.Center
 * @param {maptalks.Coordinate} center - center of the circle
 * @param {Number} radius           - radius of the circle
 * @param {Object} [options=null]   - specific construct options for circle, also support options defined in [Polygon]{@link maptalks.Polygon#options}
 * @param {Number} [options.numberOfShellPoints=60]   - number of shell points when exporting the circle's shell coordinates as a polygon.
 * @example
 * var circle = new maptalks.Circle([100, 0], 1000, {
 *     id : 'circle-id'
 * });
 */
Z.Circle = Z.Polygon.extend(/** @lends maptalks.Circle.prototype */{
    includes:[Z.Geometry.Center],

    /**
     * @property {Object} options - specific options of circle, also support options defined in [Polygon]{@link maptalks.Polygon#options}
     * @property {Number} [options.numberOfShellPoints=60]   - number of shell points when converting the circle to a polygon.
     */
    options:{
        'numberOfShellPoints':60
    },

    initialize:function (coordinates, radius, opts) {
        this._coordinates = new Z.Coordinate(coordinates);
        this._radius = radius;
        this._initOptions(opts);
    },

    /**
     * Get radius of the circle
     * @return {Number}
     */
    getRadius:function () {
        return this._radius;
    },

    /**
     * Set a new radius to the circle
     * @param {Number} radius - new radius
     * @return {maptalks.Circle} this
     * @fires maptalks.Geometry#shapechange
     */
    setRadius:function (radius) {
        this._radius = radius;
        this._onShapeChanged();
        return this;
    },

    /**
     * Gets the shell of the circle as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link maptalks.Circle#options}
     * @return {maptalks.Coordinate[]} - shell coordinates
     */
    getShell:function () {
        var measurer = this._getMeasurer();
        var center = this.getCoordinates();
        var numberOfPoints = this.options['numberOfShellPoints'];
        var radius = this.getRadius();
        var shell = [];
        for (var i = 0; i < numberOfPoints; i++) {
            var rad = (360 * i / numberOfPoints) * Math.PI / 180;
            var dx = radius * Math.cos(rad);
            var dy = radius * Math.sin(rad);
            var vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        return shell;
    },

    /**
     * Circle won't have any holes, always returns null
     * @return {null}
     */
    getHoles:function () {
        return null;
    },

    _containsPoint: function (point, tolerance) {
        var center = this._getCenterViewPoint(),
            size = this.getSize(),
            t = Z.Util.isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            pc = new Z.Point(center.x, center.y),
            pp = new Z.Point(point.x, point.y);

        return pp.distanceTo(pc) <= size.width / 2 + t;
    },

    _computeExtent:function (measurer) {
        if (!measurer || !this._coordinates || Z.Util.isNil(this._radius)) {
            return null;
        }

        var radius = this._radius;
        var p1 = measurer.locate(this._coordinates, radius, radius);
        var p2 = measurer.locate(this._coordinates, -radius, -radius);
        return new Z.Extent(p1, p2);
    },

    _computeGeodesicLength:function () {
        if (Z.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI * 2 * this._radius;
    },

    _computeGeodesicArea:function () {
        if (Z.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI * Math.pow(this._radius, 2);
    },

    _exportGeoJSONGeometry: function () {
        var coordinates = Z.GeoJSON.toNumberArrays([this.getShell()]);
        return {
            'type' : 'Polygon',
            'coordinates' : coordinates
        };
    },

    _toJSON:function (options) {
        var center = this.getCenter();
        var opts = Z.Util.extend({}, options);
        opts.geometry = false;
        var feature = this.toGeoJSON(opts);
        feature['geometry'] = {
            'type' : 'Polygon'
        };
        return {
            'feature' : feature,
            'subType' : 'Circle',
            'coordinates'  : [center.x, center.y],
            'radius'  : this.getRadius()
        };
    }

});

Z.Circle._fromJSON = function (json) {
    var feature = json['feature'];
    var circle = new Z.Circle(json['coordinates'], json['radius'], json['options']);
    circle.setProperties(feature['properties']);
    return circle;
};
