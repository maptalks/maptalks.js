/**
 * 瓦片系统描述类
 * @class
 * @protected
 */
Z.TileSystem = function(sx, sy, ox, oy){
    if (Z.Util.isArray(sx)) {
        this.scale =  { x : sx[0] , y : sx[1] };
        this.origin = { x : sx[2] , y : sx[3] };
    } else {
        this.scale =  { x : sx , y : sy };
        this.origin = { x : ox , y : oy };
    }
};

Z.Util.extend(Z.TileSystem, /** @lends maptalks.TileSystem */{
    //TMS瓦片系统的参考资料:
    //http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification
    //OSGEO组织的TMS瓦片系统, profile为global-mercator, mbtiles等tms标准瓦片服务采用该标准
    'tms-global-mercator' : new Z.TileSystem([1, 1, -20037508.34, -20037508.34]),

    //OSGEO组织的TMS瓦片系统, profile为global-geodetic
    'tms-global-geodetic' : new Z.TileSystem([1, 1, -180, -90]),

    //谷歌, 必应,高德, 腾讯等地图服务采用的瓦片系统
    'web-mercator' : new Z.TileSystem([1, -1, -20037508.34, 20037508.34]),

    //百度地图采用的瓦片系统
    'baidu' : new Z.TileSystem([1, 1, 0, 0])
});

/**
 * Get the default tile system for the projection.
 * @function
 * @static
 * @memberOf maptalks.TileSystem
 * @name  getDefault
 * @param  {Object} projection      - a projection object
 * @return {String} tile system code
 */
Z.TileSystem.getDefault = function(projection) {
    if (projection['code'].toLowerCase() === 'baidu') {
        return 'baidu';
    } else if (projection['code'].toLowerCase() === 'EPSG:4326'.toLowerCase()) {
        return 'tms-global-geodetic';
    } else {
        return 'web-mercator';
    }
}
