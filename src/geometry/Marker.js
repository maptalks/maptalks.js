/**
 * @classdesc
 * Represents a Point type Geometry.
 * @class
 * @category geometry
 * @extends maptalks.Geometry
 * @mixes maptalks.Geometry.Center
 * @param {maptalks.Coordinate} center      - center of the marker
 * @param {Object} [options=null]           - specific construct options for marker, also support options defined in [Geometry]{@link maptalks.Geometry#options}
 * @param {Object} [options.symbol=object]  - default symbol of the marker.
 * @example
 * var marker = new maptalks.Marker([100, 0], {
 *     id : 'marker-id'
 * });
 */
Z.Marker = Z.Geometry.extend(/** @lends maptalks.Marker.prototype */{
    includes:[Z.Geometry.Center],

    type: Z.Geometry['TYPE_POINT'],
    /**
     * @property {Object} [options=null]           - options for marker, also support options defined in [Geometry]{@link maptalks.Geometry#options}
     * @property {Object} [options.symbol=object]  - default symbol of the marker.
     */
    options:{
        'symbol': {
            'markerType'    : 'path',
            'markerPath'    : [
                {
                    'path' : 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M5,9 a3,3 0,1,0,0,-0.9Z',
                    'fill' : '#DE3333'
                }
            ],
            'markerPathWidth' : 16,
            'markerPathHeight' : 23,
            'markerWidth'   : 32,
            'markerHeight'  : 46
        }
    },

    initialize:function (coordinates, opts) {
        this._coordinates = new Z.Coordinate(coordinates);
        this._initOptions(opts);
    },

    /**
     * Can be edited, only marker with a vector symbol, vector path symbol or a image symbol can be edited.
     * @return {Boolean}
     * @private
     */
    _canEdit:function () {
        var symbol = this.getSymbol();
        if (Z.Util.isArray(symbol)) {
            return false;
        }
        return Z.symbolizer.VectorMarkerSymbolizer.test(this, symbol) || Z.symbolizer.VectorPathMarkerSymbolizer.test(this, symbol) ||
                    Z.symbolizer.ImageMarkerSymbolizer.test(this, symbol);
    },

    _containsPoint: function (point) {
        var pxExtent = this._getPainter().getPixelExtent();
        return pxExtent.contains(point);
    },

    _computeExtent: function () {
        var coordinates = this.getCenter();
        if (!coordinates) { return null; }
        return new Z.Extent(coordinates, coordinates);
    },

    _computeGeodesicLength:function () {
        return 0;
    },

    _computeGeodesicArea:function () {
        return 0;
    }
});
