import { extend, isNil } from '../core/util';
import Coordinate from '../geo/Coordinate';
import Extent from '../geo/Extent';
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
        let sx = 1,
            sy = -1;
        if (map) {
            const fExt = map.getFullExtent();
            if (fExt['left'] > fExt['right']) {
                sx = -1;
            }
            if (fExt['bottom'] > fExt['top']) {
                sy = 1;
            }
        }
        const points = [];
        points.push(nw);
        points.push(measurer.locate(nw, sx * this._width, 0));
        points.push(measurer.locate(nw, sx * this._width, sy * this._height));
        points.push(measurer.locate(nw, 0, sy * this._height));
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

    animateShow() {
        return this.show();
    }

    _getPrjCoordinates() {
        const projection = this._getProjection();
        this._verifyProjection();
        if (!this._pnw && projection) {
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

    _getPrjShell() {
        const shell = super._getPrjShell();
        const projection = this._getProjection();
        if (!projection.isSphere()) {
            return shell;
        }
        const sphereExtent = projection.getSphereExtent(),
            sx = sphereExtent.sx,
            sy = sphereExtent.sy;
        const circum = this._getProjection().getCircum();
        const nw = shell[0];
        for (let i = 1, l = shell.length; i < l; i++) {
            const p = shell[i];
            let dx = 0, dy = 0;
            if (sx * (nw.x - p.x) > 0) {
                dx = circum.x * sx;
            }
            if (sy * (nw.y - p.y) < 0) {
                dy = circum.y * sy;
            }
            shell[i]._add(dx, dy);
        }
        return shell;
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
            r = map._getResolution() * t;
        const extent = this._getPrjExtent().expand(r);
        const p = map._containerPointToPrj(point);
        return extent.contains(p);
    }

    _computePrjExtent(projection) {
        const se = this._getSouthEast(projection);
        if (!se) {
            return null;
        }
        const prjs = projection.projectCoords([
            new Coordinate(this._coordinates.x, se.y),
            new Coordinate(se.x, this._coordinates.y)
        ]);
        return new Extent(prjs[0], prjs[1]);
    }

    _computeExtent(measurer) {
        const se = this._getSouthEast(measurer);
        if (!se) {
            return null;
        }
        return new Extent(this._coordinates, se, this._getProjection());
    }

    _getSouthEast(measurer) {
        if (!measurer || !this._coordinates || isNil(this._width) || isNil(this._height)) {
            return null;
        }
        const width = this.getWidth(),
            height = this.getHeight();
        let w = width, h = -height;
        if (measurer.fullExtent) {
            const fullExtent = measurer.fullExtent,
                sx = fullExtent.right > fullExtent.left ? 1 : -1,
                sy = fullExtent.top > fullExtent.bottom ? 1 : -1;
            w *= sx;
            h *= sy;
        }
        const se = measurer.locate(this._coordinates, w, h);
        return se;
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
