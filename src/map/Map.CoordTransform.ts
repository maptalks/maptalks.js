import { Coordinate, Extent, Point, PointExtent, Size } from '../geo';
import Map from './Map';


declare module "./Map" {
    interface Map {
        /**
         * Converts a coordinate to the 2D point in current zoom or in the specific zoom. <br>
         * The 2D point's coordinate system's origin is the same with map's origin.
         * Usually used in plugin development.
         * @param  coordinate - coordinate
         * @param  zoom  - zoom level
         * @param  out    - optional point to receive result
         * @return  2D point
         * @example
         * var point = map.coordinateToPoint(new Coordinate(121.3, 29.1));
         */
        coordinateToPoint(coordinate: Coordinate, zoom?: number, out?: Point): Point;
        /**
         * Converts a coordinate to the 2D point at specified resolution. <br>
         * The 2D point's coordinate system's origin is the same with map's origin.
         * Usually used in plugin development.
         * @param  coordinate - coordinate
         * @param  res  - target resolution
         * @param  out    - optional point to receive result
         * @return  2D point
         * @example
         * var point = map.coordinateToPoint(new Coordinate(121.3, 29.1));
         */
        coordinateToPointAtRes(coordinate: Coordinate, res?: number, out?: Point): Point;
        /**
         * Converts a 2D point in current zoom or a specific zoom to a coordinate.
         * Usually used in plugin development.
         * @param  point - 2D point
         * @param  zoom  - point's zoom level
         * @param  out    - optional coordinate to receive result
         * @return coordinate
         * @example
         * var coord = map.pointToCoordinate(new Point(4E6, 3E4));
         */
        pointToCoordinate(point: Point, zoom?: number, out?: Coordinate): Coordinate;
        /**
         * Converts a 2D point at specific resolution to a coordinate.
         * Usually used in plugin development.
         * @param  point - 2D point
         * @param  res  - point's resolution
         * @param  out    - optional coordinate to receive result
         * @return coordinate
         * @example
         * var coord = map.pointAtResToCoordinate(new Point(4E6, 3E4), map.getResolution());
         */
        pointAtResToCoordinate(point: Point, res?: number, out?: Coordinate): Coordinate;
        /**
         * Converts a geographical coordinate to view point.<br>
         * A view point is a point relative to map's mapPlatform panel's position. <br>
         * Usually used in plugin development.
         * @param coordinate
         * @param  out    - optional point to receive result
         * @return          */
        coordinateToViewPoint(coordinate: Coordinate, out?: Point, altitude?: number): Point;
        /**
         * Converts a view point to the geographical coordinate.
         * Usually used in plugin development.
         * @param viewPoint
         * @param  out    - optional coordinate to receive result
         * @return          */
        viewPointToCoordinate(viewPoint: Point, out?: Coordinate): Coordinate;
        /**
         * Convert a geographical coordinate to the container point. <br>
         *  A container point is a point relative to map container's top-left corner. <br>
         * @param                - coordinate
         * @param  zoom  - zoom level
         * @param  out    - optional point to receive result
         * @return          */
        coordinateToContainerPoint(coordinate: Coordinate, zoom?: number, out?: Point): Point;
        coordinateToContainerPointAtRes(coordinate: Coordinate, res?: number, out?: Point): Point;
        /**
         * Convert a geographical coordinate to the container point. <br>
         * Batch conversion for better performance <br>
         *  A container point is a point relative to map container's top-left corner. <br>
         * @param  coordinates - coordinates
         * @param  zoom  - zoom level
         * @return {Point[]}
         */
        coordinatesToContainerPoints(coordinates: Array<Coordinate>, zoom?: number): Array<Point>;
        /**
         * Convert a geographical coordinate to the container point. <br>
         * Batch conversion for better performance <br>
         *  A container point is a point relative to map container's top-left corner. <br>
         * @param  coordinates                - coordinates
         * @param  resolution  - container points' resolution
         * @return
         */
        coordinatesToContainerPointsAtRes(coordinates: Array<Coordinate>, res?: number): Array<Point>;
        /**
         * Converts a container point to geographical coordinate.
         * @param          * @param  out    - optional coordinate to receive result
         * @return          */
        containerPointToCoordinate(containerPoint: Point, out?: Coordinate): Coordinate;
        /**
         * Converts a container point extent to the geographic extent.
         * @param  containerExtent - containeproints extent
         * @return  geographic extent
         */
        containerToExtent(containerExtent: PointExtent): Extent;
        /**
         * Converts geographical distances to the pixel length.<br>
         * The value varis with difference zoom level.
         *
         * @param  xDist - distance on X axis.
         * @param  yDist - distance on Y axis.
         * @return {Size} result.width: pixel length on X axis; result.height: pixel length on Y axis
         */
        distanceToPixel(xDist: number, yDist: number, zoom?: number): Size;
        /**
         * Converts geographical distances to the 2d point length.<br>
         * The value varis with difference zoom level.
         *
         * @param  xDist - distance on X axis.
         * @param  yDist - distance on Y axis.
         * @param  zoom - point's zoom
         * @return          */
        distanceToPoint(xDist: number, yDist: number, zoom?: number, paramCenter?: Coordinate): Point;
        /**
         * Converts geographical distances to the 2d point length at specified resolution.
         *
         * @param  xDist - distance on X axis.
         * @param  yDist - distance on Y axis.
         * @param  res - target resolution
         * @return          */
        distanceToPointAtRes(xDist: number, yDist: number, res?: number, paramCenter?: Coordinate, out?: Point): Point;
        /**
         * Converts height/altitude  to the 2d point
         *
         * @param  altitude - the value of altitude,suche as: map.altitudeToPoint(100);
         * @param  res - target resolution
         * @param  [originCenter=null] - optional original coordinate for caculation
         * @return          */
        altitudeToPoint(altitude: number, res?: number, originCenter?: Coordinate): number;
        pointAtResToAltitude(point: Point, res?: number, originCenter?: Coordinate): number;
        /**
         * Converts pixel size to geographical distance.
         *
         * @param  width - pixel width
         * @param  height - pixel height
         * @return  distance - Geographical distance
         */
        pixelToDistance(width: number, height: number): number;
        /**
         * Converts 2d point distances to geographic length.<br>
         *
         * @param  dx - distance on X axis.
         * @param  dy - distance on Y axis.
         * @param  zoom - point's zoom
         * @return distance
         */
        pointToDistance(dx: number, dy: number, zoom?: number): number;
        /**
         * Converts 2d point distances to geographic length.<br>
         *
         * @param  dx - distance on X axis.
         * @param  dy - distance on Y axis.
         * @param  res - point's resolution
         * @return distance
         */
        pointAtResToDistance(dx: number, dy: number, res?: number, paramCenter?: Coordinate): number;
        /**
         * Computes the coordinate from the given pixel distance.
         * @param  coordinate - source coordinate
         * @param  px           - pixel distance on X axis
         * @param  py           - pixel distance on Y axis
         * @return Result coordinate
         */
        locateByPoint(coordinate: Coordinate, px: number, py: number): Coordinate;
        /**
         * Get map's extent in view points.
         * @param zoom - zoom
         * @return
         */
        get2DExtent(zoom?: number, out?: PointExtent): PointExtent;
        get2DExtentAtRes(res?: number, out?: PointExtent): PointExtent;
        /**
         * Converts a view point extent to the geographic extent.
         * @param  extent2D - view points extent
         * @return  geographic extent
         */
        pointToExtent(extent2D: PointExtent): Extent;
        /**
         * When moving map, map's center is updated in real time, but platform will be moved in the next frame to keep syncing with other layers
         * Get the offset in current frame and the next frame
         * @return view point offset
         */
        getViewPointFrameOffset(): Point | null;
        /**
     * transform view point to geographical projected coordinate
        * @param  viewPoint
        * @param  out  - optional coordinate to receive result
        * @return         */
        viewPointToPrj(viewPoint: Point, out?: Point): Point;
        /**
         * transform geographical projected coordinate to container point
         * @param  pCoordinate
         * @param  zoom target zoom
         * @param  out    - optional point to receive result
         */
        prjToContainerPoint(pCoordinate: Coordinate, zoom?: number, out?: Point, altitude?: number): Point;
        prjToContainerPointAtRes(pCoordinate: Coordinate, res?: number, out?: Point, altitude?: number): Point;
        /**
         * transform geographical projected coordinate to view point
         * @param  pCoordinate
         * @return          */
        prjToViewPoint(pCoordinate: Coordinate, out?: Point, altitude?: number): Point;
        viewPointToPoint(viewPoint: Point, zoom?: number, out?: Point): Point;
        pointToViewPoint(point: Point, zoom?: number, out?: Point): Point;
    }
}


const TEMP_COORD = new Coordinate(0, 0);

Map.include(/** @lends Map.prototype */{


    coordinateToPoint(coordinate, zoom, out) {
        const res = this._getResolution(zoom);
        return this.coordinateToPointAtRes(coordinate, res, out);
    },


    coordinateToPointAtRes: function () {
        const COORD = new Coordinate(0, 0);
        return function (coordinate, res, out) {
            const prjCoord = this.getProjection().project(coordinate, COORD);
            return this._prjToPointAtRes(prjCoord, res, out);
        };
    }(),

    pointToCoordinate: function () {
        const COORD = new Coordinate(0, 0);
        return function (point, zoom, out) {
            const prjCoord = this._pointToPrj(point, zoom, COORD);
            return this.getProjection().unproject(prjCoord, out);
        };
    }(),

    pointAtResToCoordinate: function () {
        const COORD = new Coordinate(0, 0);
        return function (point, res, out) {
            const prjCoord = this._pointToPrjAtRes(point, res, COORD);
            return this.getProjection().unproject(prjCoord, out);
        };
    }(),

    coordinateToViewPoint: function () {
        const COORD = new Coordinate(0, 0);
        return function (coordinate, out, altitude) {
            return this._prjToViewPoint(this.getProjection().project(coordinate, COORD), out, altitude);
        };
    }(),

    viewPointToCoordinate: function () {
        const COORD = new Coordinate(0, 0);
        return function (viewPoint, out) {
            return this.getProjection().unproject(this._viewPointToPrj(viewPoint, COORD), out);
        };
    }(),

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

    coordinatesToContainerPoints(coordinates, zoom) {
        const res = this._getResolution(zoom);
        return this.coordinatesToContainerPointsAtRes(coordinates, res);
    },

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

    containerPointToCoordinate: function () {
        const COORD = new Coordinate(0, 0);
        return function (containerPoint, out) {
            const pCoordinate = this._containerPointToPrj(containerPoint, COORD);
            return this.getProjection().unproject(pCoordinate, out);
        };
    }(),

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

    distanceToPoint(xDist, yDist, zoom, paramCenter) {
        const res = this._getResolution(zoom);
        return this.distanceToPointAtRes(xDist, yDist, res, paramCenter);
    },

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

    pointToDistance(dx, dy, zoom) {
        const res = this.getResolution(zoom);
        return this.pointAtResToDistance(dx, dy, res);
    },

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

    locateByPoint: function () {
        const POINT = new Point(0, 0);
        return function (coordinate, px, py) {
            const point = this.coordToContainerPoint(coordinate, undefined, POINT);
            return this.containerPointToCoord(point._add(px, py));
        };
    }(),

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

    get2DExtent(zoom, out) {
        return this._get2DExtent(zoom, out);
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

    get2DExtentAtRes(res, out) {
        return this._get2DExtentAtRes(res, out);
    },

    pointToExtent(extent2D) {
        return this._pointToExtent(extent2D);
    },

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

    getViewPointFrameOffset: function () {
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

    _viewPointToPrj: function () {
        const POINT = new Point(0, 0);
        return function (viewPoint, out) {
            return this._containerPointToPrj(this.viewPointToContainerPoint(viewPoint, POINT), out);
        };
    }(),

    viewPointToPrj(viewPoint, out) {
        return this._viewPointToPrj(viewPoint, out);
    },

    _prjToContainerPoint(pCoordinate, zoom, out, altitude) {
        const res = this._getResolution(zoom);
        return this._prjToContainerPointAtRes(pCoordinate, res, out, altitude);
    },

    prjToContainerPoint(pCoordinate, zoom, out, altitude) {
        return this._prjToContainerPoint(pCoordinate, zoom, out, altitude);
    },

    _prjToContainerPointAtRes: function () {
        const POINT = new Point(0, 0);
        return function (pCoordinate, res, out, altitude) {
            return this._pointAtResToContainerPoint(this._prjToPointAtRes(pCoordinate, res, POINT), res, altitude || 0, out);
        };
    }(),

    prjToContainerPointAtRes(pCoordinate, res, out, altitude) {
        return this.prjToContainerPointAtRes(pCoordinate, res, out, altitude);
    },

    _prjToViewPoint: function () {
        const POINT = new Point(0, 0);
        return function (pCoordinate, out, altitude) {
            const containerPoint = this._prjToContainerPoint(pCoordinate, undefined, POINT, altitude);
            return this.containerPointToViewPoint(containerPoint, out);
        };
    }(),

    prjToViewPoint(pCoordinate, out, altitude) {
        return this._prjToViewPoint(pCoordinate, out, altitude);
    },

    _viewPointToPoint: function () {
        const POINT = new Point(0, 0);
        return function (viewPoint, zoom, out) {
            return this._containerPointToPoint(this.viewPointToContainerPoint(viewPoint, POINT), zoom, out);
        };
    }(),

    viewPointToPoint(viewPoint, zoom, out) {
        return this._viewPointToPoint(viewPoint, zoom, out);
    },

    _pointToViewPoint: function () {
        const COORD = new Coordinate(0, 0);
        return function (point, zoom, out) {
            return this._prjToViewPoint(this._pointToPrj(point, zoom, COORD), out);
        };
    }(),

    pointToViewPoint(point, zoom, out) {
        return this._pointToViewPoint(point, zoom, out);
    }

});
