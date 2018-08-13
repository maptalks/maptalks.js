import Extent from '../geo/Extent';
import CenterMixin from './CenterMixin';
import Geometry from './Geometry';
import Painter from '../renderer/geometry/Painter';
import * as Symbolizers from '../renderer/geometry/symbolizers';

/**
 * @property {String} [options.hitTestForEvent=false] - use hit testing for events, be careful, it may fail due to tainted canvas.
 * @memberOf Marker
 * @instance
 */
const options = {
    'symbol': {
        'markerType': 'path',
        'markerPath': [{
            'path': 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M3,9 a5,5 0,1,0,0,-0.9Z',
            'fill': '#DE3333'
        }],
        'markerPathWidth': 16,
        'markerPathHeight': 23,
        'markerWidth': 24,
        'markerHeight': 34
    },
    'hitTestForEvent' : false
};

/**
 * @classdesc
 * Represents a Point type Geometry.
 * @category geometry
 * @extends Geometry
 * @mixes CenterMixin
 * @example
 * var marker = new Marker([100, 0], {
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
class Marker extends CenterMixin(Geometry) {

    /**
     * @param {Coordinate} coordinates      - coordinates of the marker
     * @param {Object} [options=null]       - construct options defined in [Marker]{@link Marker#options}
     */
    constructor(coordinates, opts) {
        super(opts);
        this.type = 'Point';
        if (coordinates) {
            this.setCoordinates(coordinates);
        }
    }

    getOutline() {
        const painter = this._getPainter();
        if (!painter) {
            return null;
        }
        const coord = this.getCoordinates();
        const extent = painter.getContainerExtent();
        const anchor = this.getMap().coordToContainerPoint(coord);
        return new Marker(coord, {
            'symbol': {
                'markerType' : 'square',
                'markerWidth' : extent.getWidth(),
                'markerHeight' : extent.getHeight(),
                'markerLineWidth': 1,
                'markerLineColor': '6b707b',
                'markerFill' : 'rgba(0, 0, 0, 0)',
                'markerDx' : extent.xmin - (anchor.x - extent.getWidth() / 2),
                'markerDy' : extent.ymin - (anchor.y - extent.getHeight() / 2)
            }
        });
    }

    _isVectorMarker() {
        const symbol = this._getInternalSymbol();
        if (Array.isArray(symbol)) {
            return false;
        }
        return Symbolizers.VectorMarkerSymbolizer.test(symbol);
    }

    /**
     * Can be edited, only marker with a vector symbol, vector path symbol or a image symbol can be edited.
     * @return {Boolean}
     * @private
     */
    _canEdit() {
        const symbol = this._getInternalSymbol();
        if (Array.isArray(symbol)) {
            return false;
        }
        return Symbolizers.VectorMarkerSymbolizer.test(symbol) || Symbolizers.VectorPathMarkerSymbolizer.test(symbol) ||
            Symbolizers.ImageMarkerSymbolizer.test(symbol);
    }

    _containsPoint(point, t) {
        let extent = this.getContainerExtent();
        if (t) {
            extent = extent.expand(t);
        }
        if (extent.contains(point)) {
            if (this.options['hitTestForEvent']) {
                return super._containsPoint(point, t);
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    _computeExtent() {
        return computeExtent.call(this, 'getCenter');
    }

    _computePrjExtent() {
        return computeExtent.call(this, '_getPrjCoordinates');
    }

    _computeGeodesicLength() {
        return 0;
    }

    _computeGeodesicArea() {
        return 0;
    }

    _getSprite(resources, canvasClass) {
        if (this._getPainter()) {
            return this._getPainter().getSprite(resources, canvasClass);
        }
        return new Painter(this).getSprite(resources, canvasClass);
    }
}

Marker.mergeOptions(options);

Marker.registerJSONType('Marker');

export default Marker;

function computeExtent(fn) {
    const coordinates = this[fn]();
    if (!coordinates) {
        return null;
    }
    return new Extent(coordinates, coordinates, this._getProjection());
}
