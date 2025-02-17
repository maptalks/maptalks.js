import type { WithNull } from '../types/typings';

/**
 * 表示由 [GeoJSON](http://geojson.org/geojson-spec.html#coordinate-reference-system-objects)定义的 CRS
 * @english
 *
 * Represent CRS defined by [GeoJSON]{@link http://geojson.org/geojson-spec.html#coordinate-reference-system-objects}
 *
 * @category geo
 */
class CRS {
    public type: string;
    public properties: any;

    /**
     * @param type type of the CRS
     * @param properties CRS's properties
     */
    constructor(type: string, properties: Record<string, any>) {
        this.type = type;
        this.properties = properties;
    }

    /**
     * 使用 maptalks 创建 [proj4](https://github.com/OSGeo/proj.4) 形式的 CRS
     * @english
     * Create a [proj4](https://github.com/OSGeo/proj.4) style CRS used by maptalks <br>
     * @example
     * {
     *     "type"       : "proj4",
     *     "properties" : {
     *         "proj"   : "+proj=longlat +datum=WGS84 +no_defs"
     *     }
     * }
     * var crs_wgs84 = CRS.createProj4("+proj=longlat +datum=WGS84 +no_defs");
     * @param proj a proj4 projection string.
     */
    static createProj4(proj: string): CRS {
        return new CRS('proj4', {
            'proj': proj
        });
    }

    /**
     * 使用 maptalks 创建 [epsg](https://spatialreference.org/ref/epsg/) 形式的 CRS
     * @english
     * Create a [epsg](https://spatialreference.org/ref/epsg/) style CRS used by maptalks <br>
     * @example
     * var crs_wgs84 = CRS.createProj4("EPSG:4326");
     * @param code a proj4 projection string.
     */
    static fromProjectionCode(code: string): WithNull<CRS> {
        if (!code) {
            return null;
        }
        code = code.toUpperCase().replace(':', '');
        return CRS[code] || null;
    }

    /* some common CRS definitions */

    /**
     * 预定义的WGS84坐标参考系统（也称为EPSG:4326）。
     * @english
     * Predefined CRS of well-known WGS84 (aka EPSG:4326)
     */
    static WGS84 = CRS.createProj4('+proj=longlat +datum=WGS84 +no_defs');

    /**
     * CRS.WGS84 的别名
     * @english
     * Alias for CRS.WGS84
     */
    static EPSG4326: CRS;

    /**
     * 谷歌地图使用的投影坐标系统具有以下别名：'EPSG:3785'、'GOOGLE'、'EPSG:900913'。
     * @english
     * Projected Coordinate System used by google maps that has the following alias: 'EPSG:3785', 'GOOGLE', 'EPSG:900913'
     */
    static EPSG3857 = CRS.createProj4('+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs');

    /**
     * 一个代表简单的笛卡尔坐标系统。<br>
     * 它直接映射x、y坐标，对于平面地图（例如室内地图、游戏地图）非常有用。
     *
     * @english
     * A CRS represents a simple Cartesian coordinate system. <br>
     * Maps x, y directly, is useful for maps of flat surfaces (e.g. indoor maps, game maps).
     */
    static IDENTITY = CRS.createProj4('+proj=identity +no_defs');

    /**
     * 中国官方坐标系统（即EPSG:4490），在大多数情况下，可以认为与WGS84相同。
     *
     * @english
     * Official coordinate system in China (aka EPSG:4490), in most cases, it can be considered the same with WGS84.
     * @see  [7408](http://spatialreference.org/ref/sr-org/7408/)
     */
    static CGCS2000 = CRS.createProj4('+proj=longlat +datum=CGCS2000');

    /**
     * CRS.CGCS2000 的别名
     *
     * @english
     * Alias for CRS.CGCS2000
     */
    static EPSG4490 = CRS.CGCS2000;

    /**
     * 百度地图使用的投影坐标系统。
     *
     * @english
     * Projection used by [Baidu Map](http://map.baidu.com), a popular web map service in China.
     */
    static BD09LL = CRS.createProj4('+proj=longlat +datum=BD09');

    /**
     * 中国的大多数在线地图服务中所使用一种加密的坐标参考系统（CRS）。
     *
     * @english
     * A encrypted CRS usded in the most online map services in China.
     * @see [Restrictions_on_geographic_data_in_China](https://en.wikipedia.org/wiki/Restrictions_on_geographic_data_in_China)
     */
    static GCJ02 = CRS.createProj4('+proj=longlat +datum=GCJ02');
}

export default CRS;
