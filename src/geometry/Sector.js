/**
 * @classdesc
 * Represents a sector Geometry, a child class of [maptalks.Polygon]{@link maptalks.Polygon}. <br>
 *     It means it shares all the methods defined in [maptalks.Polygon]{@link maptalks.Polygon} besides some overrided ones.
 * @class
 * @category geometry
 * @extends maptalks.Polygon
 * @mixes maptalks.Geometry.Center
 * @param {maptalks.Coordinate} center - center of the sector
 * @param {Number} radius           - radius of the sector
 * @param {Number} startAngle       - start angle of the sector
 * @param {Number} endAngle         - end angle of the sector
 * @param {Object} [options=null]   - specific construct options for sector, also support options defined in [Polygon]{@link maptalks.Polygon#options}
 * @param {Number} [options.numberOfShellPoints=60]   - number of shell points when exporting the sector's shell coordinates as a polygon.
 * @example
 * var sector = new maptalks.Sector([100, 0], 1000, 30, 120, {
 *     id : 'sector-id'
 * });
 */
Z.Sector=Z.Polygon.extend(/** @lends maptalks.Sector.prototype */{
    includes:[Z.Geometry.Center],

    /**
     * @property {Object} options - specific options of sector, also support options defined in [Polygon]{@link maptalks.Polygon#options}
     * @property {Number} [options.numberOfShellPoints=60]   - number of shell points when converting the sector to a polygon.
     */
    options:{
        'numberOfShellPoints':60
    },

    type:Z.Geometry['TYPE_SECTOR'],

    initialize:function(coordinates,radius,startAngle,endAngle,opts) {
        this._coordinates = new Z.Coordinate(coordinates);
        this._radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this._initOptions(opts);
    },

    /**
     * Get radius of the sector
     * @return {Number}
     */
    getRadius:function() {
        return this._radius;
    },

    /**
     * Set a new radius to the sector
     * @param {Number} radius - new radius
     * @return {maptalks.Sector} this
     * @fires maptalks.Geometry#shapechange
     */
    setRadius:function(radius) {
        this._radius = radius;
        this._onShapeChanged();
        return this;
    },

    /**
     * Get the sector's start angle
     * @return {Number}
     */
    getStartAngle:function() {
        return this.startAngle;
    },

    /**
     * Set a new start angle to the sector
     * @param {Number} startAngle
     * @return {maptalks.Sector} this
     * @fires maptalksGeometry#shapechange
     */
    setStartAngle:function(startAngle) {
        this.startAngle = startAngle;
        this._onShapeChanged();
        return this;
    },

    /**
     * Get the sector's end angle
     * @return {Number}
     */
    getEndAngle:function() {
        return this.endAngle;
    },

    /**
     * Set a new end angle to the sector
     * @param {Number} endAngle
     * @return {maptalks.Sector} this
     * @fires maptalksGeometry#shapechange
     */
    setEndAngle:function(endAngle) {
        this.endAngle = endAngle;
        this._onShapeChanged();
        return this;
    },

    /**
     * Gets the shell of the sector as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link maptalks.Sector#options}
     * @return {maptalks.Coordinate[]} - shell coordinates
     */
    getShell:function() {
        var measurer = this._getMeasurer();
        var center = this.getCoordinates();
        var numberOfPoints = this.options['numberOfShellPoints'];
        var radius = this.getRadius();
        var shell = [];
        var angle = this.getEndAngle()-this.getStartAngle();
        for (var i=0;i<numberOfPoints;i++) {
            var rad = (angle*i/numberOfPoints+this.getStartAngle())*Math.PI/180;
            var dx = radius*Math.cos(rad);
            var dy = radius*Math.sin(rad);
            var vertex = measurer.locate(center, dx, dy);
            shell.push(vertex);
        }
        return shell;

    },

    /**
     * Sector won't have any holes, always returns null
     * @return {null}
     */
    getHoles:function() {
        return null;
    },

    _containsPoint: function(point) {
        var center = this._getCenterViewPoint(),
            t = this._hitTestTolerance(),
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
        return pp.distanceTo(pc) <= size.width / 2 && between;
    },

    _computeExtent:function(measurer) {
        if (!measurer || !this._coordinates || Z.Util.isNil(this._radius)) {
            return null;
        }

        var radius = this._radius;
        var p1 = measurer.locate(this._coordinates,radius,radius);
        var p2 = measurer.locate(this._coordinates,-radius,-radius);
        return new Z.Extent(p1,p2);
    },

    _computeGeodesicLength:function(measurer) {
        if (Z.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI*2*this._radius*Math.abs(this.startAngle-this.endAngle)/360+2*this._radius;
    },

    _computeGeodesicArea:function(measurer) {
        if (Z.Util.isNil(this._radius)) {
            return 0;
        }
        return Math.PI*Math.pow(this._radius,2)*Math.abs(this.startAngle-this.endAngle)/360;
    },

    _exportGeoJSONGeometry:function() {
        var center  = this.getCenter();
        return {
            'type':         "Sector",
            'coordinates':  [center.x,center.y],
            'radius':       this.getRadius(),
            'startAngle':   this.getStartAngle(),
            'endAngle':     this.getEndAngle()
        };
    }
});
