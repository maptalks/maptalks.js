/**
 * 多图形类
 * @class maptalks.MultiPoly
 * @extends maptalks.GeometryCollection
 * @author Maptalks Team
 */
Z.MultiPoly = Z.GeometryCollection.extend({


    _initData:function(data) {
        if (Z.Util.isArrayHasData(data)) {
            if (data[0] instanceof this.GeometryType) {
                this.setGeometries(data);
            } else {
                this.setCoordinates(data);
            }
        }
    },

    _checkGeometries:function(geometries) {
        if (Z.Util.isArray(geometries)) {
            for (var i=0,len=geometries.length;i<len;i++) {
                if (geometries[i] && !(geometries[i] instanceof this.GeometryType)) {
                    throw new Error(this.exceptions['INVALID_GEOMETRY_IN_COLLECTION']+i);
                }
            }
        }
        return geometries;
    },

    /**
     * 获取MultiPolygon的坐标数组
     * @return {Coordinate[][][]} MultiPolygon的坐标数组
     * @expose
     */
    getCoordinates:function() {
        var coordinates = [];
        var geometries = this.getGeometries();
        if (!Z.Util.isArray(geometries)) {
            return null;
        }
        for (var i = 0,len=geometries.length;i<len;i++) {
            coordinates.push(geometries[i].getCoordinates());
        }
        return coordinates;
    },

    /**
     * 设置MultiPolygon
     * @param {Coordinate[][][]} MultiPolygon的坐标数组
     * @expose
     */
    setCoordinates:function(coordinates) {
        if (Z.Util.isArrayHasData(coordinates)) {
            var geometries = [];
            for (var i=0, len=coordinates.length;i<len;i++) {
                var p = new this.GeometryType(coordinates[i], this.config());
                geometries.push(p);
            }
            this.setGeometries(geometries);
        } else {
            this.setGeometries([]);
        }
        return this;
    },

    //override _exportGeoJSONGeometry in GeometryCollection
    _exportGeoJSONGeometry:function() {
        var points = this.getCoordinates();
        var coordinates = Z.GeoJSON.toGeoJSONCoordinates(points);
        return {
            'type':this.getType(),
            'coordinates': coordinates
        };
    }
});
