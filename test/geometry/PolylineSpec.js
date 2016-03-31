describe('PolylineSpec', function() {

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
        canvasContainer = map._panels.mapMask;
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    describe('constructor', function() {

        it('normal constructor', function() {
            var points = [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ];
            var polyline = new Z.Polyline(points);
            var coordinates = polyline.getCoordinates();
            expect(coordinates).to.have.length(points.length);
            var geojsonCoordinates = Z.GeoJSON.toGeoJSONCoordinates(coordinates);
            expect(geojsonCoordinates).to.eql(points);
        });

        it('can be empty.',function() {
            var polyline = new Z.Polyline();
            expect(polyline.getCoordinates()).to.have.length(0);
        });

    });

    describe('getCenter', function() {
        it('should返回笛卡尔坐标系上的点集合的中心点', function() {
            var polyline = new Z.Polyline([
                {x: 0, y: 0},
                {x: 0, y: 10},
                {x: 0, y: 80}
            ]);
            layer.addGeometry(polyline);

            expect(polyline.getCenter()).to.nearCoord(new Z.Coordinate(0, 30));
        });
    });

    it('getExtent', function() {
        var polyline = new Z.Polyline([
            {x: 0, y: 0},
            {x: 0, y: 10},
            {x: 0, y: 80}
        ]);
        // layer.addGeometry(polyline);

        expect(polyline.getExtent()).to.eql(new Z.Extent(0, 0, 0, 80));
    });

    describe('geometry fires events', function() {
        it('svg events', function() {
            var points = [
                {x: 0, y: 0},
                {x: 0, y: 10},
                {x: 0, y: 80}
            ];
            var vector = new Z.Polyline(points);
            new GeoEventsTester().testSVGEvents(vector, map);
        });

        it('canvas events', function() {
            var points = [
                {x: 0, y: 0},
                {x: 0, y: 10},
                {x: 0, y: 80}
            ];
            var vector = new Z.Polyline(points);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    it('can have various symbols',function() {
        var points = [
                {x: 0, y: 0},
                {x: 0, y: 10},
                {x: 0, y: 80}
            ];
            var vector = new Z.Polyline(points);
        GeoSymbolTester.testGeoSymbols(vector, map);
    });

    it("Rectangle._containsPoint", function() {
        layer.clear();
        var geometry = new Z.Rectangle(center, 20, 10, {
            symbol: {
                'lineWidth': 6
            }
        });
        layer.addGeometry(geometry);

        var spy = sinon.spy();
        geometry.on('click', spy);

        happen.click(canvasContainer, {
            clientX: 400 + 8,
            clientY: 300 + 8 - 4
        });
        expect(spy.called).to.not.be.ok();

        happen.click(canvasContainer, {
            clientX: 400 + 8,
            clientY: 300 + 8 - 3
        });
        expect(spy.called).to.be.ok();
    });
});
