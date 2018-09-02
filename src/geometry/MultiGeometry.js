import GeometryCollection from './GeometryCollection';
import Coordinate from '../geo/Coordinate';

/**
 * The parent class for MultiPoint, MultiLineString and MultiPolygon
 * @category geometry
 * @abstract
 * @extends {GeometryCollection}
 */
class MultiGeometry extends GeometryCollection {

    /**
     * @param  {Class} geoType      Type of the geometry
     * @param  {String} type        type in String, e.g. "MultiPoint", "MultiLineString"
     * @param  {Geometry[]} data    data
     * @param  {Object} [options=null] configuration options
     */
    constructor(geoType, type, data, options) {
        super(null, options);
        this.GeometryType = geoType;
        this.type = type;
        this._initData(data);
    }

    /**
     * Get coordinates of the collection
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates
     */
    getCoordinates() {
        const coordinates = [];
        const geometries = this.getGeometries();
        for (let i = 0, l = geometries.length; i < l; i++) {
            const child = geometries[i];
            coordinates.push(child.getShell && child.getJSONType() !== 'Polygon' ? [child.getShell()] : child.getCoordinates());
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
        coordinates = coordinates || [];
        const geometries = [];
        for (let i = 0, l = coordinates.length; i < l; i++) {
            const g = new this.GeometryType(coordinates[i], this.config());
            geometries.push(g);
        }
        this.setGeometries(geometries);
        return this;
    }

    _initData(data) {
        data = data || [];
        if (data.length) {
            if (data[0] instanceof this.GeometryType) {
                this.setGeometries(data);
            } else {
                this.setCoordinates(data);
            }
        }
    }

    _checkGeo(geo) {
        return (geo instanceof this.GeometryType);
    }

    //override _exportGeoJSONGeometry in GeometryCollection
    _exportGeoJSONGeometry() {
        const points = this.getCoordinates();
        const coordinates = Coordinate.toNumberArrays(points);
        return {
            'type': this.getType(),
            'coordinates': coordinates
        };
    }
}

export default MultiGeometry;
