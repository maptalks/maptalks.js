import { isArray, isArrayHasData } from 'core/util';
import GeometryCollection from './GeometryCollection';
import Coordinate from 'geo/Coordinate';

/**
 * Common methods for MultiPoint, MultiLineString and MultiPolygon
 * @mixin Geometry.MultiPoly
 */
export default class MultiGeometry extends GeometryCollection {
    constructor(geoType) {
        super();
        this.GeometryType = geoType;
    }

    /**
     * Get coordinates of the collection
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates
     */
    getCoordinates() {
        var coordinates = [];
        var geometries = this.getGeometries();
        if (!isArray(geometries)) {
            return null;
        }
        for (var i = 0, len = geometries.length; i < len; i++) {
            coordinates.push(geometries[i].getCoordinates());
        }
        return coordinates;
    }

    /**
     * Set new coordinates to the collection
     * @param {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates
     * @returns {Geometry} this
     * @fires maptalk.Geometry#shapechange
     */
    setCoordinates(coordinates) {
        if (isArrayHasData(coordinates)) {
            var geometries = [];
            for (var i = 0, len = coordinates.length; i < len; i++) {
                var p = new this.GeometryType(coordinates[i], this.config());
                geometries.push(p);
            }
            this.setGeometries(geometries);
        } else {
            this.setGeometries([]);
        }
        return this;
    }

    _initData(data) {
        if (isArrayHasData(data)) {
            if (data[0] instanceof this.GeometryType) {
                this.setGeometries(data);
            } else {
                this.setCoordinates(data);
            }
        }
    }

    _checkGeometries(geometries) {
        if (isArray(geometries)) {
            for (var i = 0, len = geometries.length; i < len; i++) {
                if (geometries[i] && !(geometries[i] instanceof this.GeometryType)) {
                    throw new Error('Geometry is not valid for collection, index:' + i);
                }
            }
        }
        return geometries;
    }

    //override _exportGeoJSONGeometry in GeometryCollection
    _exportGeoJSONGeometry() {
        var points = this.getCoordinates();
        var coordinates = Coordinate.toNumberArrays(points);
        return {
            'type': this.getType(),
            'coordinates': coordinates
        };
    }
}
