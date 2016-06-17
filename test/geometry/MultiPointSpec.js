describe('MultiPointSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        layer = new Z.VectorLayer('id');
        map.addLayer(layer);
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    describe('constructor', function() {

        it('normal constructor', function() {
            var points = [ [100.0, 0.0], [101.0, 1.0] ];
            var multiPoint = new Z.MultiPoint(points);
            expect(multiPoint.getCoordinates()).to.have.length(points.length);
        });

        it('can be empty.',function() {
            var multiPoint = new Z.MultiPoint();
            expect(multiPoint.getCoordinates()).to.have.length(0);
            expect(multiPoint.isEmpty()).to.be.ok();
        });

    });

    describe('geometry fires events', function() {
        it('svg events', function() {
            var vector = new Z.MultiPoint([center]);
            new GeoEventsTester().testSVGEvents(vector, map);
        });


    });

    describe('geometry fires canvas events', function() {
         it('canvas events', function() {
            var vector = new Z.MultiPoint([center]);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });


    });


    it('can have various symbols',function() {
        var vector = new Z.MultiPoint([center]);
        GeoSymbolTester.testGeoSymbols(vector, map);
    });
});
