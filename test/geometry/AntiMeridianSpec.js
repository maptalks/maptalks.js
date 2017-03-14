
describe('#AntiMeridianSpec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate([179, 10]);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        map.config('zoomAnimation', false);
        map.setZoom(3);
        layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
        map.addLayer(layer);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    function genGeometries() {
        return [
            //a continuous anti-meridian line-string with a hole
            new maptalks.LineString(
                [[179, 10], [-170, 10], [-169, -10], [179, -10]],
                { antiMeridian : 'continuous', arrowStyle:'classic', arrowPlacement : 'vertex-firstlast' }
            ),
            //a continuous anti-meridian line-string with a hole
            new maptalks.LineString(
                [[179, 10], [-170, 10], [-169, -10], [179, -10]],
                { antiMeridian : 'split', arrowStyle:'classic', arrowPlacement : 'point' }
            ),
            new maptalks.QuadBezierCurve(
                    //线端点坐标数组
                    [[179, 10], [-170, 10], [-169, -10], [179, -10]],
                    //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
                    { arrowStyle:'classic', arrowPlacement:'point', antiMeridian : 'split' }
            ),
            new maptalks.CubicBezierCurve(
                    //线端点坐标数组
                    [[179, 10], [-170, 10], [-169, -10], [179, -10]],
                    //bezierCurveDegree指贝塞尔曲线的度, 取值为2或者3即二阶贝塞尔曲线或三阶贝塞尔曲线
                    { arrowStyle:'classic', arrowPlacement:'point', antiMeridian : 'continuous' }
            ),
            //a continuous anti-meridian polygon with a hole
            new maptalks.Polygon([
                    [[179, 10], [-170, 10], [-169, -10], [179, -10]],
                    [[180, 5], [-175, 5], [-171, -5], [180, -5]]
            ],
                { antiMeridian : 'continuous' }
            ),
            //a split anti-meridian polygon with a hole
            new maptalks.Polygon([
                    [[179, 10], [-170, 10], [-169, -10], [179, -10]],
                    [[180, 5], [-175, 5], [-171, -5], [180, -5]]
            ],
                { antiMeridian : 'split' }
            )
        ];
    }
    var geometries = genGeometries();
    geometries.forEach(function (g) {
        it('different symbols', function (done) {
            COMMON_SYMBOL_TESTOR.testGeoSymbols(g, map, done);
        });
    });
});
