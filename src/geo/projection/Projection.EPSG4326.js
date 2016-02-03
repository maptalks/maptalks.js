Z.Projection.EPSG4326 = Z.Util.extend({}, Z.Projection.Common, {
    code : "EPSG:4326",
    project:function(p){
        return new Z.Coordinate(p.x,p.y);
    },
    unproject:function(p){
        return new Z.Coordinate(p.x,p.y);
    }
}, Z.measurer.WGS84Sphere);
