import Extent from '../geo/Extent';
import PointExtent from '../geo/PointExtent';
import CenterMixin from './CenterMixin';
import Geometry, { GeometryOptionsType } from './Geometry';
import Painter from '../renderer/geometry/Painter';
import { getMarkerFixedExtent, isVectorSymbol, isImageSymbol, isPathSymbol, DYNAMIC_SYMBOL_PROPS as propsToCheck, SIZE_SYMBOL_PROPS as sizeProps } from '../core/util/marker';
import { isFunctionDefinition, loadGeoSymbol } from '../core/mapbox';
import { isNil } from '../core/util';
import { AnyMarkerSymbol, PathMarkerSymbol, VectorMarkerSymbol } from '../symbol';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';

const TEMP_EXTENT = new PointExtent();

/**
 * @property {String} [options.hitTestForEvent=false] - use hit testing for events, be careful, it may fail due to tainted canvas.
 * @property {Boolean}  [options.collision=true]   -  - whether collision
 * @memberOf Marker
 * @instance
 */
const options: MarkerOptionsType = {
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
    } as PathMarkerSymbol,
    'hitTestForEvent': false,
    'collision': true
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
export class Marker extends CenterMixin(Geometry) {
    public isPoint: boolean
    /**
     * @param {Coordinate} coordinates      - coordinates of the marker
     * @param {Object} [options=null]       - construct options defined in [Marker]{@link Marker#options}
     */
    constructor(coordinates: MarkerCoordinatesType, options?: MarkerOptionsType) {
        super(options);
        this.type = 'Point';
        //for subclass,Quickly determine whether a Geometry is a point
        this.isPoint = true;
        if (coordinates) {
            this.setCoordinates(coordinates);
        }
    }

    getOutline(): Marker {
        const coord = this.getCoordinates();
        const extent = this.getContainerExtent();
        const anchor = this.getMap().coordToContainerPoint(coord);
        return new Marker(coord, {
            'symbol': {
                'markerType': 'square',
                'markerWidth': extent.getWidth(),
                'markerHeight': extent.getHeight(),
                'markerLineWidth': 1,
                'markerLineColor': '6b707b',
                'markerFill': 'rgba(0, 0, 0, 0)',
                'markerDx': extent.xmin - (anchor.x - extent.getWidth() / 2),
                'markerDy': extent.ymin - (anchor.y - extent.getHeight() / 2)
            } as VectorMarkerSymbol
        });
    }

    setSymbol(symbol: AnyMarkerSymbol): this {
        delete this._fixedExtent;
        return super.setSymbol.call(this, symbol);
    }

    _getSizeSymbol(symbol: any): any {
        const s = {};
        let dynamic = false;
        let dynamicSize = false;
        for (let i = 0; i < propsToCheck.length; i++) {
            const v = symbol[propsToCheck[i]];
            if (isNil(v)) {
                continue;
            }
            if (!dynamic && isFunctionDefinition(v)) {
                dynamic = true;
                dynamicSize = true;
            }
            s[propsToCheck[i]] = v;
        }
        for (let i = 0; i < sizeProps.length; i++) {
            const v = symbol[sizeProps[i]];
            if (isNil(v)) {
                continue;
            }
            if (!dynamic && isFunctionDefinition(v)) {
                dynamic = true;
            }
            s[sizeProps[i]] = v;
        }
        let sizeSymbol;
        if (dynamic) {
            sizeSymbol = loadGeoSymbol(s, this);
            if (dynamicSize) {
                sizeSymbol._dynamic = true;
            }
        } else {
            sizeSymbol = s;
        }
        return sizeSymbol;
    }

    _setExternSymbol(symbol: any) {
        if (!this._symbol) {
            delete this._fixedExtent;
        }
        return super._setExternSymbol(symbol);
    }

    _isDynamicSize(): boolean {
        return this._sizeSymbol && this._sizeSymbol._dynamic;
    }

    _getFixedExtent(): PointExtent {
        if (this._fixedExtent && !this._isDynamicSize()) {
            return this._fixedExtent;
        }
        this._fixedExtent = this._fixedExtent || new PointExtent();
        this._fixedExtent.set(null, null, null, null);
        const symbol = this._sizeSymbol;
        if (!symbol) {
            return this._fixedExtent;
        }
        const renderer = this.getLayer() && this.getLayer().getRenderer();
        const resources = renderer && renderer.resources;
        const textDesc = this.getTextDesc();
        if (Array.isArray(symbol)) {
            TEMP_EXTENT.set(Infinity, Infinity, -Infinity, -Infinity);
            for (let i = 0; i < symbol.length; i++) {
                if (!symbol[i]) {
                    continue;
                }
                this._fixedExtent._combine(getMarkerFixedExtent(TEMP_EXTENT, symbol[i], resources, textDesc && textDesc[i]));
            }
        } else {
            this._fixedExtent = getMarkerFixedExtent(this._fixedExtent, symbol, resources, textDesc);
        }
        return this._fixedExtent;
    }

    _isVectorMarker(): boolean {
        const symbol = this._getInternalSymbol();
        if (Array.isArray(symbol)) {
            return false;
        }
        return isVectorSymbol(symbol);
    }

    /**
     * 可以编辑，只能编辑带有矢量符号、矢量路径符号或图像符号的标记。
     * @english
     * Can be edited, only marker with a vector symbol, vector path symbol or a image symbol can be edited.
     * @return {Boolean}
     * @private
     */
    _canEdit(): boolean {
        const symbol = this._getInternalSymbol();
        if (Array.isArray(symbol)) {
            return false;
        }
        return isVectorSymbol(symbol) || isPathSymbol(symbol) || isImageSymbol(symbol);
    }

    _containsPoint(point: Point, t?: number): boolean {
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

    _computeExtent(): Extent {
        return computeExtent.call(this, 'getCenter');
    }

    _computePrjExtent(): Extent {
        return computeExtent.call(this, '_getPrjCoordinates');
    }

    _computeGeodesicLength(): number {
        return 0;
    }

    _computeGeodesicArea(): number {
        return 0;
    }

    _getSprite(resources: any, canvasClass: any) {
        if (this._getPainter()) {
            return this._getPainter().getSprite(resources, canvasClass);
        }
        return new Painter(this).getSprite(resources, canvasClass);
    }
}
Marker.mergeOptions(options);
Marker.registerJSONType('Marker');

export default Marker;

function computeExtent(fn: any): null | Extent {
    const coordinates = this[fn]();
    if (!coordinates) {
        return null;
    }
    return new Extent(coordinates, coordinates, this._getProjection());
}

export type MarkerCoordinatesType = Coordinate | Array<number>;

export type MarkerOptionsType = GeometryOptionsType & {
    hitTestForEvent?: boolean;
    collision?: boolean;
    symbol?: AnyMarkerSymbol | Array<AnyMarkerSymbol>;
}
