import { Coordinate, Extent, Point, PointExtent, Size } from '../geo';
import Map from './Map';


declare module "./Map" {
    interface Map {
        _glScale: number;
        coordinateToPoint(coordinate: Coordinate, zoom?: number, out?: Point): Point;
        coordinateToPointAtRes(coordinate: Coordinate, res?: number, out?: Point): Point;
        pointToCoordinate(point: Point, zoom?: number, out?: Coordinate): Coordinate;
        pointAtResToCoordinate(point: Point, res?: number, out?: Coordinate): Coordinate;
        coordinateToViewPoint(coordinate: Coordinate, out?: Point, altitude?: number): Point;
        viewPointToCoordinate(viewPoint: Point, out?: Coordinate): Coordinate;
        coordinateToContainerPoint(coordinate: Coordinate, zoom?: number, out?: Point): Point;
        coordinateToContainerPointAtRes(coordinate: Coordinate, res?: number, out?: Point): Point;
        coordinatesToContainerPoints(coordinates: Array<Coordinate>, zoom?: number): Array<Point>;
        coordinatesToContainerPointsAtRes(coordinates: Array<Coordinate>, res?: number): Array<Point>;
        containerPointToCoordinate(containerPoint: Point, out?: Coordinate): Coordinate;
        containerToExtent(containerExtent: PointExtent): Extent;
        distanceToPixel(xDist: number, yDist: number, zoom?: number): Size;
        distanceToPoint(xDist: number, yDist: number, zoom?: number, paramCenter?: Coordinate): Point;
        distanceToPointAtRes(xDist: number, yDist: number, res?: number, paramCenter?: Coordinate, out?: Point): Point;
        altitudeToPoint(altitude: number, res?: number, originCenter?: Coordinate): number;
        pointAtResToAltitude(point: Point, res?: number, originCenter?: Coordinate): number;
        pixelToDistance(width: number, height: number): number;
        pointToDistance(dx: number, dy: number, zoom?: number): number;
        pointAtResToDistance(dx: number, dy: number, res?: number, paramCenter?: Coordinate): number;
        locateByPoint(coordinate: Coordinate, px: number, py: number): Coordinate;
        _get2DExtent(zoom?: number, out?: PointExtent): PointExtent;
        _get2DExtentAtRes(res?: number, out?: PointExtent): PointExtent;
        _pointToExtent(extent2D: PointExtent): Extent;
        _getViewPointFrameOffset(): Point | null;
        _viewPointToPrj(viewPoint: Point, out?: Point): Point;
        _prjToContainerPoint(pCoordinate: Coordinate, zoom?: number, out?: Point, altitude?: number): Point;
        _prjToContainerPointAtRes(pCoordinate: Coordinate, res?: number, out?: Point, altitude?: number): Point;
        _prjToViewPoint(pCoordinate: Coordinate, out?: Point, altitude?: number): Point;
        _viewPointToPoint(viewPoint: Point, zoom?: number, out?: Point): Point;
        _pointToViewPoint(point: Point, zoom?: number, out?: Point): Point;
    }
}


const TEMP_COORD = new Coordinate(0, 0);

Map.include(/** @lends Map.prototype */{

    /**
     * Converts a coordinate to the 2D point in current zoom or in the specific zoom. <br>
     * The 2D point's coordinate system's origin is the same with map's origin.
     * Usually used in plugin development.
     * @param  {Coordinate} coordinate - coordinate
     * @param  {Number} [zoom=undefined]  - zoom level
     * @param  {Point} [out=undefined]    - optional point to receive result
     * @return {Point}  2D point
     * @function
     * @example
     * var point = map.coordinateToPoint(new Coordinate(121.3, 29.1));
     */
    coordinateToPoint(coordinate, zoom, out) {
        const res = this._getResolution(zoom);
        return this.coordinateToPointAtRes(coordinate, res, out);
    },

    /**
     * Converts a coordinate to the 2D point at specified resolution. <br>
     * The 2D point's coordinate system's origin is the same with map's origin.
     * Usually used in plugin development.
     * @param  {Coordinate} coordinate - coordinate
     * @param  {Number} [res=undefined]  - target resolution
     * @param  {Point} [out=undefined]    - optional point to receive result
     * @return {Point}  2D point
     * @function
     * @example
     * var point = map.coordinateToPoint(new Coordinate(121.3, 29.1));
     */
    coordinateToPointAtRes: function () {
        const COORD = new Coordinate(0, 0);
        return function (coordinate, res, out) {
            const prjCoord = this.getProjection().project(coordinate, COORD);
            return this._prjToPointAtRes(prjCoord, res, out);
        };
    }(),

    /**
     * Converts a 2D point in current zoom or a specific zoom to a coordinate.
     * Usually used in plugin development.
     * @param  {Point} point - 2D point
     * @param  {Number} zoom  - point's zoom level
     * @param  {Coordinate} [out=undefined]    - optional coordinate to receive result
     * @return {Coordinate} coordinate
     * @function
     * @example
     * var coord = map.pointToCoordinate(new Point(4E6, 3E4));
     */
    pointToCoordinate: function () {
        const COORD = new Coordinate(0, 0);
        return function (point, zoom, out) {
            const prjCoord = this._pointToPrj(point, zoom, COORD);
            return this.getProjection().unproject(prjCoord, out);
        };
    }(),

    /**
     * Converts a 2D point at specific resolution to a coordinate.
     * Usually used in plugin development.
     * @param  {Point} point - 2D point
     * @param  {Number} res  - point's resolution
     * @param  {Coordinate} [out=undefined]    - optional coordinate to receive result
     * @return {Coordinate} coordinate
     * @function
     * @example
     * var coord = map.pointAtResToCoordinate(new Point(4E6, 3E4), map.getResolution());
     */
    pointAtResToCoordinate: function () {
        const COORD = new Coordinate(0, 0);
        return function (point, res, out) {
            const prjCoord = this._pointToPrjAtRes(point, res, COORD);
            return this.getProjection().unproject(prjCoord, out);
        };
    }(),


    /**
     * Converts a geographical coordinate to view point.<br>
     * A view point is a point relative to map's mapPlatform panel's position. <br>
     * Usually used in plugin development.
     * @param {Coordinate} coordinate
     * @param  {Point} [out=undefined]    - optional point to receive result
     * @return {Point}
     * @function
     */
    coordinateToViewPoint: function () {
        const COORD = new Coordinate(0, 0);
        return function (coordinate, out, altitude) {
            return this._prjToViewPoint(this.getProjection().project(coordinate, COORD), out, altitude);
        };
    }(),

    /**
     * Converts a view point to the geographical coordinate.
     * Usually used in plugin development.
     * @param {Point} viewPoint
     * @param  {Coordinate} [out=undefined]    - optional coordinate to receive result
     * @return {Coordinate}
     * @function
     */
    viewPointToCoordinate: function () {
        const COORD = new Coordinate(0, 0);
        return function (viewPoint, out) {
            return this.getProjection().unproject(this._viewPointToPrj(viewPoint, COORD), out);
        };
    }(),

    /**
     * Convert a geographical coordinate to the container point. <br>
     *  A container point is a point relative to map container's top-left corner. <br>
     * @param {Coordinate}                - coordinate
     * @param  {Number} [zoom=undefined]  - zoom level
     * @param  {Point} [out=undefined]    - optional point to receive result
     * @return {Point}
     * @function
     */
    coordinateToContainerPoint(coordinate, zoom, out) {
        const res = this._getResolution(zoom);
        return this.coordinateToContainerPointAtRes(coordinate, res, out);
    },

    coordinateToContainerPointAtRes: function () {
        const COORD = new Coordinate(0, 0);
        return function (coordinate, res, out) {
            const pCoordinate = this.getProjection().project(coordinate, COORD);
            return this._prjToContainerPointAtRes(pCoordinate, res, out);
        };
    }(),

    /**
     * Convert a geographical coordinate to the container point. <br>
     * Batch conversion for better performance <br>
     *  A container point is a point relative to map container's top-left corner. <br>
     * @param  {Coordinate[]} Coordinate - coordinates
     * @param  {Number} [zoom=undefined]  - zoom level
     * @return {Point[]}
     * @function
     */
    coordinatesToContainerPoints(coordinates, zoom) {
        const res = this._getResolution(zoom);
        return this.coordinatesToContainerPointsAtRes(coordinates, res);
    },

    /**
     * Convert a geographical coordinate to the container point. <br>
     * Batch conversion for better performance <br>
     *  A container point is a point relative to map container's top-left corner. <br>
     * @param {Coordinate[]}                - coordinates
     * @param  {Number} [resolution=undefined]  - container points' resolution
     * @return {Point[]}
     * @function
     */
    coordinatesToContainerPointsAtRes: function () {
        return function (coordinates, resolution) {
            const pts = [];
            const transformation = this._spatialReference.getTransformation();
            const res = resolution / this._getResolution();
            const projection = this.getProjection();
            const prjOut = new Coordinate(0, 0);
            const isTransforming = this.isTransforming();
            const centerPoint = this._prjToPoint(this._getPrjCenter(), undefined, TEMP_COORD);
            for (let i = 0, len = coordinates.length; i < len; i++) {
                const pCoordinate = projection.project(coordinates[i], prjOut);
                let point = transformation.transform(pCoordinate, resolution);
                point = point._multi(res);
                this._toContainerPoint(point, isTransforming, coordinates[i].z, centerPoint);
                pts.push(point);
            }
            return pts;
        };
    }(),

    /**
     * Converts a container point to geographical coordinate.
     * @param {Point}
     * @param  {Coordinate} [out=undefined]    - optional coordinate to receive result
     * @return {Coordinate}
     * @function
     */
    containerPointToCoordinate: function () {
        const COORD = new Coordinate(0, 0);
        return function (containerPoint, out) {
            const pCoordinate = this._containerPointToPrj(containerPoint, COORD);
            return this.getProjection().unproject(pCoordinate, out);
        };
    }(),

    /**
     * Converts a container point extent to the geographic extent.
     * @param  {PointExtent} containerExtent - containeproints extent
     * @return {Extent}  geographic extent
     * @function
     */
    containerToExtent: function () {
        const POINT0 = new Point(0, 0);
        const POINT1 = new Point(0, 0);
        return function (containerExtent) {
            const extent2D = new PointExtent(
                this._containerPointToPoint(containerExtent.getMin(POINT0), undefined, POINT0),
                this._containerPointToPoint(containerExtent.getMax(POINT1), undefined, POINT1)
            );
            return this._pointToExtent(extent2D);
        };
    }(),

    /**
     * Converts geographical distances to the pixel length.<br>
     * The value varis with difference zoom level.
     *
     * @param  {Number} xDist - distance on X axis.
     * @param  {Number} yDist - distance on Y axis.
     * @return {Size} result.width: pixel length on X axis; result.height: pixel length on Y axis
     * @function
     */
    distanceToPixel: function () {
        const POINT0 = new Point(0, 0);
        const POINT1 = new Point(0, 0);
        return function (xDist, yDist, zoom) {
            const projection = this.getProjection();
            if (!projection) {
                return null;
            }
            const scale = this.getScale() / this.getScale(zoom);
            const center = this.getCenter(),
                target = projection.locate(center, xDist, yDist);
            const p0 = this.coordToContainerPoint(center, undefined, POINT0),
                p1 = this.coordToContainerPoint(target, undefined, POINT1);
            p1._sub(p0)._multi(scale)._abs();
            return new Size(p1.x, p1.y);
        };
    }(),

    /**
     * Converts geographical distances to the 2d point length.<br>
     * The value varis with difference zoom level.
     *
     * @param  {Number} xDist - distance on X axis.
     * @param  {Number} yDist - distance on Y axis.
     * @param  {Number} zoom - point's zoom
     * @return {Point}
     * @function
     */
    distanceToPoint(xDist, yDist, zoom, paramCenter) {
        const res = this._getResolution(zoom);
        return this.distanceToPointAtRes(xDist, yDist, res, paramCenter);
    },

    /**
     * Converts geographical distances to the 2d point length at specified resolution.
     *
     * @param  {Number} xDist - distance on X axis.
     * @param  {Number} yDist - distance on Y axis.
     * @param  {Number} res - target resolution
     * @return {Point}
     * @function
     */
    distanceToPointAtRes: function () {
        const POINT = new Point(0, 0);
        const COORD = new Coordinate(0, 0);
        return function (xDist, yDist, res, paramCenter, out) {
            const projection = this.getProjection();
            if (!projection) {
                return null;
            }
            const center = paramCenter || this.getCenter(),
                target = projection.locate(center, xDist, yDist, COORD);
            const p0 = this.coordToPointAtRes(center, res, POINT),
                p1 = this.coordToPointAtRes(target, res, out);
            p1._sub(p0)._abs();
            return p1;
        };
    }(),


    /**
     * Converts height/altitude  to the 2d point
     *
     * @param  {Number} altitude - the value of altitude,suche as: map.altitudeToPoint(100);
     * @param  {Number} res - target resolution
     * @param  {Coordinate} [originCenter=null] - optional original coordinate for caculation
     * @return {Number}
     * @function
     */
    altitudeToPoint: function () {
        const DEFAULT_CENTER = new Coordinate(0, 40);
        const POINT = new Point(0, 0);
        return function (altitude = 0, res, originCenter) {
            if (this._altitudeOriginDirty) {
                DEFAULT_CENTER.x = this._originLng;
                this._altitudeOriginDirty = false;
            }
            const p = this.distanceToPointAtRes(altitude, altitude, res, originCenter || DEFAULT_CENTER, POINT);
            if (altitude < 0 && p.x > 0) {
                p.x = -p.x;
            }
            const heightFactor = this.options['heightFactor'];
            if (heightFactor && heightFactor !== 1) {
                p.x *= heightFactor;
                p.y *= heightFactor;
            }
            return p.x;
        };
    }(),

    pointAtResToAltitude: function () {
        const DEFAULT_CENTER = new Coordinate(0, 40);
        return function (point = 0, res, originCenter) {
            const altitude = this.pointAtResToDistance(point, 0, res, originCenter || DEFAULT_CENTER);
            return altitude;
        };
    }(),


    /**
     * Converts pixel size to geographical distance.
     *
     * @param  {Number} width - pixel width
     * @param  {Number} height - pixel height
     * @return {Number}  distance - Geographical distance
     * @function
     */
    pixelToDistance: function () {
        const COORD0 = new Coordinate(0, 0);
        const COORD1 = new Coordinate(0, 0);
        const TARGET0 = new Coordinate(0, 0);
        const TARGET1 = new Coordinate(0, 0);
        return function (width, height) {
            const projection = this.getProjection();
            if (!projection) {
                return null;
            }
            const fullExt = this.getFullExtent();
            const d = fullExt['top'] > fullExt['bottom'] ? -1 : 1;
            const coord0 = COORD0.set(this.width / 2, this.height / 2);
            const coord1 = COORD1.set(this.width / 2 + width, this.height / 2 + d * height);
            // 考虑高度海拔后，容器中心点的坐标就不一定是center了
            const target0 = this.containerPointToCoord(coord0, TARGET0);
            const target1 = this.containerPointToCoord(coord1, TARGET1);
            return projection.measureLength(target0, target1);
        };
    }(),

    /**
     * Converts 2d point distances to geographic length.<br>
     *
     * @param  {Number} dx - distance on X axis.
     * @param  {Number} dy - distance on Y axis.
     * @param  {Number} zoom - point's zoom
     * @return {Number} distance
     * @function
     */
    pointToDistance(dx, dy, zoom) {
        const res = this.getResolution(zoom);
        return this.pointAtResToDistance(dx, dy, res);
    },

    /**
     * Converts 2d point distances to geographic length.<br>
     *
     * @param  {Number} dx - distance on X axis.
     * @param  {Number} dy - distance on Y axis.
     * @param  {Number} res - point's resolution
     * @return {Number} distance
     * @function
     */
    pointAtResToDistance: function () {
        const POINT = new Point(0, 0);
        const PRJ_COORD = new Coordinate(0, 0);
        const COORD0 = new Coordinate(0, 0);
        const COORD1 = new Coordinate(0, 0);
        return function (dx, dy, res, paramCenter) {
            const projection = this.getProjection();
            if (!projection) {
                return null;
            }
            const prjCoord = paramCenter ? projection.project(paramCenter, PRJ_COORD) : this._getPrjCenter();
            const c = this._prjToPointAtRes(prjCoord, res, POINT);
            c._add(dx, dy);
            const target = this.pointAtResToCoord(c, res, COORD0);
            const src = paramCenter ? paramCenter : projection.unproject(prjCoord, COORD1);
            return projection.measureLength(src, target);
        };
    }(),


    /**
     * Computes the coordinate from the given pixel distance.
     * @param  {Coordinate} coordinate - source coordinate
     * @param  {Number} px           - pixel distance on X axis
     * @param  {Number} py           - pixel distance on Y axis
     * @return {Coordinate} Result coordinate
     * @function
     */
    locateByPoint: function () {
        const POINT = new Point(0, 0);
        return function (coordinate, px, py) {
            const point = this.coordToContainerPoint(coordinate, undefined, POINT);
            return this.containerPointToCoord(point._add(px, py));
        };
    }(),

    /**
     * Get map's extent in view points.
     * @param {Number} zoom - zoom
     * @return {PointExtent}
     * @private
     * @function
     */
    _get2DExtent(zoom, out) {
        let cached;
        if ((zoom === undefined || zoom === this._zoomLevel) && this._mapExtent2D) {
            cached = this._mapExtent2D;
        }
        if (cached) {
            if (out) {
                out.set(cached['xmin'], cached['ymin'], cached['xmax'], cached['ymax']);
                return out;
            }
            return cached.copy();
        }
        const res = this._getResolution(zoom);
        return this._get2DExtentAtRes(res, out);
    },

    _get2DExtentAtRes: function () {
        const POINT = new Point(0, 0);
        return function (res, out) {
            if (res === this._mapGlRes && this._mapGlExtent2D) {
                return this._mapGlExtent2D;
            }
            const cExtent = this.getContainerExtent();
            return cExtent.convertTo(c => this._containerPointToPointAtRes(c, res, POINT), out);
        };
    }(),

    /**
     * Converts a view point extent to the geographic extent.
     * @param  {PointExtent} extent2D - view points extent
     * @return {Extent}  geographic extent
     * @protected
     * @function
     */
    _pointToExtent: function () {
        const COORD0 = new Coordinate(0, 0);
        const COORD1 = new Coordinate(0, 0);
        return function (extent2D) {
            const min2d = extent2D.getMin(),
                max2d = extent2D.getMax();
            const fullExtent = this.getFullExtent();
            const [minx, maxx] = (!fullExtent || fullExtent.left <= fullExtent.right) ? [min2d.x, max2d.x] : [max2d.x, min2d.x];
            const [miny, maxy] = (!fullExtent || fullExtent.top > fullExtent.bottom) ? [max2d.y, min2d.y] : [min2d.y, max2d.y];
            const min = min2d.set(minx, maxy);
            const max = max2d.set(maxx, miny);
            return new Extent(
                this.pointToCoord(min, undefined, COORD0),
                this.pointToCoord(max, undefined, COORD1),
                this.getProjection()
            );
        };
    }(),


    /**
     * When moving map, map's center is updated in real time, but platform will be moved in the next frame to keep syncing with other layers
     * Get the offset in current frame and the next frame
     * @return {Point} view point offset
     * @private
     * @function
     */
    _getViewPointFrameOffset: function () {
        const POINT = new Point(0, 0);
        return function () {
            // when zooming, view point is not updated, and container is being transformed with matrix.
            // so ignore the frame offset
            if (this.isZooming()) {
                return null;
            }
            const pcenter = this._getPrjCenter();
            if (this._mapViewCoord && !this._mapViewCoord.equals(pcenter)) {
                return this._prjToContainerPoint(this._mapViewCoord)._sub(this._prjToContainerPoint(pcenter, undefined, POINT));
            }
            return null;
        };
    }(),

    /**
     * transform view point to geographical projected coordinate
     * @param  {Point} viewPoint
     * @param  {Coordinate} [out=undefined]  - optional coordinate to receive result
     * @return {Coordinate}
     * @private
     * @function
     */
    _viewPointToPrj: function () {
        const POINT = new Point(0, 0);
        return function (viewPoint, out) {
            return this._containerPointToPrj(this.viewPointToContainerPoint(viewPoint, POINT), out);
        };
    }(),

    /**
     * transform geographical projected coordinate to container point
     * @param  {Coordinate} pCoordinate
     * @param  {Number} zoom target zoom
     * @param  {Point} [out=undefined]    - optional point to receive result
     * @return {Point}
     * @private
     * @function
     */
    _prjToContainerPoint(pCoordinate, zoom, out, altitude) {
        const res = this._getResolution(zoom);
        return this._prjToContainerPointAtRes(pCoordinate, res, out, altitude);
    },

    _prjToContainerPointAtRes: function () {
        const POINT = new Point(0, 0);
        return function (pCoordinate, res, out, altitude) {
            return this._pointAtResToContainerPoint(this._prjToPointAtRes(pCoordinate, res, POINT), res, altitude || 0, out);
        };
    }(),

    /**
     * transform geographical projected coordinate to view point
     * @param  {Coordinate} pCoordinate
     * @return {Point}
     * @private
     * @function
     */
    _prjToViewPoint: function () {
        const POINT = new Point(0, 0);
        return function (pCoordinate, out, altitude) {
            const containerPoint = this._prjToContainerPoint(pCoordinate, undefined, POINT, altitude);
            return this.containerPointToViewPoint(containerPoint, out);
        };
    }(),

    _viewPointToPoint: function () {
        const POINT = new Point(0, 0);
        return function (viewPoint, zoom, out) {
            return this._containerPointToPoint(this.viewPointToContainerPoint(viewPoint, POINT), zoom, out);
        };
    }(),

    _pointToViewPoint: function () {
        const COORD = new Coordinate(0, 0);
        return function (point, zoom, out) {
            return this._prjToViewPoint(this._pointToPrj(point, zoom, COORD), out);
        };
    }(),

});
