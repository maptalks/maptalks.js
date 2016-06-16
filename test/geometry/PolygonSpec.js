describe('PolygonSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;
    var canvasContainer;

    beforeEach(function() {
       var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        layer = new Z.VectorLayer('id');
        map.addLayer(layer);
        canvasContainer = map._panels.canvasContainer;
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    describe('constructor', function() {

        it('normal constructor', function() {
            var points = [
                [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ],
                [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2] ]
            ];
            var polygon = new Z.Polygon(points);
            var coordinates = polygon.getCoordinates();
            expect(coordinates).to.have.length(points.length);
            var geojsonCoordinates = Z.GeoJSON.toNumberArrays(coordinates);
            expect(geojsonCoordinates).to.eql(points);
        });

        it('can be empty.',function() {
            var polygon = new Z.Polygon();
            expect(polygon.getCoordinates()).to.have.length(0);
        });

    });

    describe('getCenter', function() {
        it('should返回笛卡尔坐标系上的点集合的中心点', function() {
            var polygon = new Z.Polygon([[
                {x: 0, y: 0},
                {x: 0, y: 10},
                {x: 10, y: 10},
                {x: 10, y: 0}
            ]]);
            layer.addGeometry(polygon);

            expect(polygon.getCenter()).to.be.closeTo({x:5, y: 5});
        });
    });

    it('getExtent', function() {
        var polygon = new Z.Polygon([
            [
                {x: 0, y: 0},
                {x: 0, y: 10},
                {x: 10, y: 10},
                {x: 10, y: 0}
            ]
        ]);
        layer.addGeometry(polygon);
        var extent = polygon.getExtent();
        var delta = 1e-6;

        expect(extent.xmin).to.be.within(0 - delta, 0 + delta);
        expect(extent.xmax).to.be.within(10 - delta, 10 + delta);
        expect(extent.ymin).to.be.within(0 - delta, 0 + delta);
        expect(extent.ymax).to.be.within(10 - delta, 10 + delta);
    });

    describe('geometry fires events', function() {
        it('svg events', function() {
            var points = [
                [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ],
                [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2] ]
            ];
            var vector = new Z.Polygon(points);
            new GeoEventsTester().testSVGEvents(vector, map);
        });

        it('canvas events', function() {
            var points = [
                [
                    {x: 0, y: 0},
                    {x: 0, y: 10},
                    {x: 10, y: 10},
                    {x: 10, y: 0}
                ]
            ];
            var vector = new Z.Polygon(points);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    it('can have various symbols',function() {
        var points = [
                [
                    {x: 0, y: 0},
                    {x: 0, y: 10},
                    {x: 10, y: 10},
                    {x: 10, y: 0}
                ]
            ];
            var vector = new Z.Polygon(points);
        GeoSymbolTester.testGeoSymbols(vector, map);
    });

    it("Polygon._containsPoint", function() {
        layer.clear();
        var geometry = new Z.Polygon([[
            new Z.Coordinate([center.x, center.y + 0.001]),
            new Z.Coordinate([center.x, center.y]),
            new Z.Coordinate([center.x + 0.002, center.y])
        ]], {
            symbol: {
                'lineWidth': 6
            }
        });
        layer.addGeometry(geometry);

        var spy = sinon.spy();
        geometry.on('click', spy);

        happen.click(canvasContainer, {
            clientX: 400 + 8 - 4,
            clientY: 300 + 8
        });
        expect(spy.called).to.not.be.ok();

        happen.click(canvasContainer, {
            clientX: 400 + 8 - 3,
            clientY: 300 + 8
        });
        expect(spy.called).to.be.ok();
    });

    it('can be a anti-meridian polygon',function() {
         var points = [
        [[179,10],[-170,10],[-169, -10],[179, -10]],
        [[180,5],[-175,5],[-171, -5],[180, -5]]
        ];
        var vector = new Z.Polygon(points,{antiMeridian : 'continuous',});
        layer.addGeometry(vector);

        var points2 = [
        [[179,10],[168,10],[167, -10],[179, -10]]
        ];
        var comparison = new Z.Polygon(points2);
        layer.addGeometry(comparison);

        var size = vector.getSize();
        var compared = comparison.getSize();
        expect(size).to.be.eql(compared);
    });
});
