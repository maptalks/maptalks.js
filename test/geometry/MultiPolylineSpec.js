describe('MultiPolylineSpec', function() {

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
        document.body.removeChild(container);
    });

    describe('constructor', function() {

        it('normal constructor', function() {
            var points = [
                [ [100.0, 0.0], [101.0, 1.0] ],
                [ [102.0, 2.0], [103.0, 3.0] ]
            ];
            var multiPolyline = new Z.MultiPolyline(points);
            var coordinates = multiPolyline.getCoordinates();
            expect(coordinates).to.have.length(points.length);
            var geojsonCoordinates = Z.GeoJSON.toGeoJSONCoordinates(coordinates);
            expect(geojsonCoordinates).to.eql(points);
        });

        it('can be empty.',function() {
            var multiPolyline = new Z.MultiPolyline();
            expect(multiPolyline.getCoordinates()).to.have.length(0);
            expect(multiPolyline.isEmpty()).to.be.ok();
        });

    });

    it('can have various symbols',function() {
        var points = [
                [ [100.0, 0.0], [101.0, 1.0] ],
                [ [102.0, 2.0], [103.0, 3.0] ]
            ];
        var vector = new Z.MultiPolyline(points);
        GeoSymbolTester.testGeoSymbols(vector, map);
    });
});
