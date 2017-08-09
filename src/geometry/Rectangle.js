import { extend, isNil } from 'core/util';
import Coordinate from 'geo/Coordinate';
import PointExtent from 'geo/PointExtent';
import Extent from 'geo/Extent';
import Polygon from './Polygon';

/**
 * @classdesc
 * Represents a Rectangle geometry.
 * @category geometry
 * @extends Polygon
 * @example
 * var rectangle = new Rectangle([100, 0], 1000, 500, {
 *     id : 'rectangle0'
 * });
 */
class Rectangle extends Polygon {

    static fromJSON(json) {
        const feature = json['feature'];
        const rect = new Rectangle(json['coordinates'], json['width'], json['height'], json['options']);
        rect.setProperties(feature['properties']);
        return rect;
    }

    /**
     * @param {Coordinate} coordinates  - northwest of the rectangle
     * @param {Number} width                     - width of the rectangle, in meter
     * @param {Number} height                    - height of the rectangle, in meter
     * @param {Object} [options=null]            - options defined in [Rectangle]{@link Rectangle#options}
     */
    constructor(coordinates, width, height, opts) {
        super(null, opts);
        if (coordinates) {
            this.setCoordinates(coordinates);
        }
        this._width = width;
        this._height = height;
    }

    /**
     * Get coordinates of rectangle's northwest
     * @return {Coordinate}
     */
    getCoordinates() {
        return this._coordinates;
    }

    /**
     * Set a new coordinate for northwest of the rectangle
     * @param {Coordinate} nw - coordinates of new northwest
     * @return {Rectangle} this
     * @fires Rectangle#positionchange
     */
    setCoordinates(nw) {
        this._coordinates = (nw instanceof Coordinate) ? nw : new Coordinate(nw);
        if (!this._coordinates || !this.getMap()) {
            this.onPositionChanged();
            return this;
        }
        const projection = this._getProjection();
        this._setPrjCoordinates(projection.project(this._coordinates));
        return this;
    }

    /**
     * Get rectangle's width
     * @return {Number}
     */
    getWidth() {
        return this._width;
    }

    /**
     * Set new width to the rectangle
     * @param {Number} width - new width
     * @fires Rectangle#shapechange
     * @return {Rectangle} this
     */
    setWidth(width) {
        this._width = width;
        this.onShapeChanged();
        return this;
    }

    /**
     * Get rectangle's height
     * @return {Number}
     */
    getHeight() {
        return this._height;
    }

    /**
     * Set new height to rectangle
     * @param {Number} height - new height
     * @fires Rectangle#shapechange
     * @return {Rectangle} this
     */
    setHeight(height) {
        this._height = height;
        this.onShapeChanged();
        return this;
    }

    /**
     * Gets the shell of the rectangle as a polygon
     * @return {Coordinate[]} - shell coordinates
     */
    getShell() {
        const measurer = this._getMeasurer();
        const nw = this._coordinates;
        const map = this.getMap();
        let r = -1;
        if (map) {
            const fExt = map.getFullExtent();
            if (fExt['bottom'] > fExt['top']) {
                r = 1;
            }
        }
        const points = [];
        points.push(nw);
        points.push(measurer.locate(nw, this._width, 0));
        points.push(measurer.locate(nw, this._width, r * this._height));
        points.push(measurer.locate(nw, 0, r * this._height));
        points.push(nw);
        return points;

    }

    /**
     * Rectangle won't have any holes, always returns null
     * @return {Object[]} an empty array
     */
    getHoles() {
        return [];
    }

    _getPrjCoordinates() {
        const projection = this._getProjection();
        if (!projection) {
            return null;
        }
        this._verifyProjection();
        if (!this._pnw) {
            if (this._coordinates) {
                this._pnw = projection.project(this._coordinates);
            }
        }
        return this._pnw;
    }

    _setPrjCoordinates(pnw) {
        this._pnw = pnw;
        this.onPositionChanged();
    }

    //update cached variables if geometry is updated.
    _updateCache() {
        this._clearCache();
        const projection = this._getProjection();
        if (this._pnw && projection) {
            this._coordinates = projection.unproject(this._pnw);
        }
    }

    _clearProjection() {
        this._pnw = null;
        super._clearProjection();
    }

    _computeCenter(measurer) {
        return measurer.locate(this._coordinates, this._width / 2, -this._height / 2);
    }

    _containsPoint(point, tolerance) {
        const map = this.getMap();
        if (map.isTransforming()) {
            return super._containsPoint(point, tolerance);
        }
        const t = isNil(tolerance) ? this._hitTestTolerance() : tolerance,
            sp = map.coordinateToPoint(this._coordinates),
            pxSize = map.distanceToPixel(this._width, this._height);
        const pxExtent = new PointExtent(sp.x - t, sp.y - t,
                sp.x + pxSize.width + t, sp.y + pxSize.height + t);
        return pxExtent.contains(point);
    }
    _computeExtent(measurer) {
        if (!measurer || !this._coordinates || isNil(this._width) || isNil(this._height)) {
            return null;
        }
        const width = this.getWidth(),
            height = this.getHeight();
        const p1 = measurer.locate(this._coordinates, width, -height);
        return new Extent(p1, this._coordinates);
    }

    _computeGeodesicLength() {
        if (isNil(this._width) || isNil(this._height)) {
            return 0;
        }
        return 2 * (this._width + this._height);
    }

    _computeGeodesicArea() {
        if (isNil(this._width) || isNil(this._height)) {
            return 0;
        }
        return this._width * this._height;
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
        const nw = this.getCoordinates();
        opts.geometry = false;
        const feature = this.toGeoJSON(opts);
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

}

Rectangle.registerJSONType('Rectangle');

export default Rectangle;
