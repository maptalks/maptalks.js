import { isArray, isArrayHasData } from 'core/util';
import { GeoJSON } from './GeoJSON';

/**
 * Common methods for MultiPoint, MultiLineString and MultiPolygon
 * @mixin Geometry.MultiPoly
 */
export const MultiPoly = {
    /**
     * Get coordinates of the collection
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates
     */
    getCoordinates: function () {
        var coordinates = [];
        var geometries = this.getGeometries();
        if (!isArray(geometries)) {
            return null;
        }
        for (var i = 0, len = geometries.length; i < len; i++) {
            coordinates.push(geometries[i].getCoordinates());
        }
        return coordinates;
    },

    /**
     * Set new coordinates to the collection
     * @param {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates
     * @returns {Geometry} this
     * @fires maptalk.Geometry#shapechange
     */
    setCoordinates: function (coordinates) {
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
    },

    _initData: function (data) {
        if (isArrayHasData(data)) {
            if (data[0] instanceof this.GeometryType) {
                this.setGeometries(data);
            } else {
                this.setCoordinates(data);
            }
        }
    },

    _checkGeometries: function (geometries) {
        if (isArray(geometries)) {
            for (var i = 0, len = geometries.length; i < len; i++) {
                if (geometries[i] && !(geometries[i] instanceof this.GeometryType)) {
                    throw new Error('Geometry is not valid for collection, index:' + i);
                }
            }
        }
        return geometries;
    },

    //override _exportGeoJSONGeometry in GeometryCollection
    _exportGeoJSONGeometry: function () {
        var points = this.getCoordinates();
        var coordinates = GeoJSON.toNumberArrays(points);
        return {
            'type': this.getType(),
            'coordinates': coordinates
        };
    }
};
