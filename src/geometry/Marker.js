/**
 * @classdesc
 * Represents a Point type Geometry.
 * @class
 * @category geometry
 * @extends maptalks.Geometry
 * @mixes maptalks.Geometry.Center
 * @param {maptalks.Coordinate} center      - center of the marker
 * @param {Object} [options=null]           - construct options defined in [maptalks.Marker]{@link maptalks.Marker#options}
 * @example
 * var marker = new maptalks.Marker([100, 0], {
 *     'id' : 'marker0',
 *     'symbol' : {
 *         'markerFile'  : 'foo.png',
 *         'markerWidth' : 20,
 *         'markerHeight': 20,
 *     },
 *     'properties' : {
 *         'foo' : 'value'
 *     }
 * });
 */
Z.Marker = Z.Geometry.extend(/** @lends maptalks.Marker.prototype */{
    includes:[Z.Geometry.Center],

    type: Z.Geometry['TYPE_POINT'],

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
            'markerWidth'   : 24,
            'markerHeight'  : 34
        }
    },

    initialize:function (coordinates, opts) {
        if (coordinates && !(coordinates instanceof Z.Coordinate)) {
            coordinates = new Z.Coordinate(coordinates);
        }
        this._coordinates = coordinates;
        this._initOptions(opts);
    },

    /**
     * Can be edited, only marker with a vector symbol, vector path symbol or a image symbol can be edited.
     * @return {Boolean}
     * @private
     */
    _canEdit:function () {
        var symbol = this._getInternalSymbol();
        if (Z.Util.isArray(symbol)) {
            return false;
        }
        return Z.symbolizer.VectorMarkerSymbolizer.test(symbol) || Z.symbolizer.VectorPathMarkerSymbolizer.test(symbol) ||
                    Z.symbolizer.ImageMarkerSymbolizer.test(symbol);
    },

    _containsPoint: function (point) {
        var pxExtent = this._getPainter().get2DExtent();
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
    },

    _getSprite: function (resources) {
        if (this._getPainter()) {
            return this._getPainter().getSprite(resources);
        }
        return new Z.Painter(this).getSprite(resources);
    }
});
