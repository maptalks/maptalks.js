
describe('AntiMeridianSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate([179,10]);
    var layer;

    beforeEach(function() {
       var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        map.config('zoomAnimation', false);
        map.setZoom(3);
        layer = new Z.VectorLayer('id', {'drawImmediate' : true});
        map.addLayer(layer);
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    function genGeometries() {
        return [
            //a continuous anti-meridian line-string with a hole
            new maptalks.LineString(
                [[179,10],[-170,10],[-169, -10],[179, -10]],
                {antiMeridian : 'continuous', arrowStyle:'classic', arrowPlacement : 'vertex-firstlast'}
            ),
            //a continuous anti-meridian line-string with a hole
            new maptalks.LineString(
                [[179,10],[-170,10],[-169, -10],[179, -10]],
                {antiMeridian : 'split', arrowStyle:'classic', arrowPlacement : 'point'}
            ),
            new maptalks.CurveLine(
                    //线端点坐标数组
                    [[179,10],[-170,10],[-169, -10],[179, -10]],
                    //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
                    {curveType:2, arrowStyle:'classic', arrowPlacement:'point', antiMeridian : 'split'}
            ),
            new maptalks.CurveLine(
                    //线端点坐标数组
                    [[179,10],[-170,10],[-169, -10],[179, -10]],
                    //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
                    {curveType:3, arrowStyle:'classic', arrowPlacement:'point', antiMeridian : 'continuous'}
            ),
            //a continuous anti-meridian polygon with a hole
            new maptalks.Polygon([
                    [[179,10],[-170,10],[-169, -10],[179, -10]],
                    [[180,5],[-175,5],[-171, -5],[180, -5]]
                ],
                {antiMeridian : 'continuous'}
            ),
            //a split anti-meridian polygon with a hole
            new maptalks.Polygon([
                    [[179,10],[-170,10],[-169, -10],[179, -10]],
                    [[180,5],[-175,5],[-171, -5],[180, -5]]
                ],
                {antiMeridian : 'split'}
            )
        ];
    }
    var geometries = genGeometries();
    for (var i = 0; i < geometries.length; i++) {
        (function(geo) {
            it('different symbols', function(done) {
                GeoSymbolTester.testGeoSymbols(geo, map, done);
            });
        })(geometries[i]);
    }
});
