import GeometryCollection from './GeometryCollection';
import Coordinate from '../geo/Coordinate';
import { GeometryOptionsType, type Geometry } from './Geometry';
import { MultiPathsCoordinates, PathCoordinates, PathsCoordinates } from './Path';
import { MarkerCoordinatesType } from './Marker';
import { LineStringCoordinatesType } from './LineString';
import { PolygonCoordinatesType } from './Polygon';

/**
 * MultiPoint、MultiLineString和MultiPolygon的父类
 * @english
 * The parent class for MultiPoint, MultiLineString and MultiPolygon
 * @category geometry
 * @abstract
 * @extends {GeometryCollection}
 */
type MultiGeometryCoordinates = PathCoordinates | PathsCoordinates | MultiPathsCoordinates;
type SingleGeometryCreateCoordinates = MarkerCoordinatesType | LineStringCoordinatesType | PolygonCoordinatesType;

export type MultiGeometryCreateCoordinates = Array<SingleGeometryCreateCoordinates>;
type MultiGeometryData = Array<SingleGeometryCreateCoordinates | Geometry>;

type GeometryClass<T> = (new (coordinates: SingleGeometryCreateCoordinates, options: Record<string, any>) => T);


class MultiGeometry extends GeometryCollection {
    public GeometryType: GeometryClass<Geometry>;

    /**
     * @param  {Class} geoType      Type of the geometry
     * @param  {String} type        type in String, e.g. "MultiPoint", "MultiLineString"
     * @param  {Geometry[]} data    data
     * @param  {Object} [options=null] configuration options
     */
    constructor(geoType: GeometryClass<Geometry>, type: string, data: MultiGeometryData, options?: GeometryOptionsType) {
        super(null, options);
        this.GeometryType = geoType;
        this.type = type;
        this._initData(data);
    }

    /**
     * 获取集合中得坐标
     * @english
     * Get coordinates of the collection
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates
     */
    getCoordinates(): MultiGeometryCoordinates {
        const coordinates = [];
        const geometries = this.getGeometries();
        for (let i = 0, l = geometries.length; i < l; i++) {
            const child = geometries[i];
            coordinates.push(child.getShell && child.getJSONType() !== 'Polygon' ? [child.getShell()] : child.getCoordinates());
        }
        return coordinates;
    }

    /**
     * 设置集合得坐标
     * @english
     * Set new coordinates to the collection
     * @param {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates
     * @returns {Geometry} this
     * @fires maptalk.Geometry#shapechange
     */
    setCoordinates(coordinates: MultiGeometryCreateCoordinates) {
        coordinates = coordinates || [];
        const geometries = [];
        for (let i = 0, l = coordinates.length; i < l; i++) {
            const g = new this.GeometryType(coordinates[i], this.config());
            geometries.push(g);
        }
        this.setGeometries(geometries);
        return this;
    }

    _initData(data: MultiGeometryData): void {
        data = data || [];
        if (data.length) {
            if (data[0] instanceof this.GeometryType) {
                this.setGeometries(data as Geometry[]);
            } else {
                this.setCoordinates(data as MultiGeometryCoordinates);
            }
        }
    }

    _checkGeo(geo: Geometry): boolean {
        return (geo instanceof this.GeometryType);
    }

    //override _exportGeoJSONGeometry in GeometryCollection
    // @ts-expect-error 确实需要重写父类的属性
    _exportGeoJSONGeometry() {
        const points = this.getCoordinates();
        const coordinates = Coordinate.toNumberArrays(points as MultiPathsCoordinates);
        return {
            'type': this.getType(),
            'coordinates': coordinates
        };
    }

    _toJSON(options: any) {
        return {
            'feature': this.toGeoJSON(options)
        };
    }
}

export default MultiGeometry;
