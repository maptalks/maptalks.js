describe('MultiPolygonSpec', function() {

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
                [
                    [[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]
                ],
                [
                    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
                ]
            ];
            var multiPolygon = new Z.MultiPolygon(points);
            var coordinates = multiPolygon.getCoordinates();
            expect(coordinates).to.have.length(points.length);
            var geojsonCoordinates = Z.GeoJSON.toGeoJSONCoordinates(coordinates);
            expect(geojsonCoordinates).to.eql(points);
        });

        it('can be empty.',function() {
            var multiPolygon = new Z.MultiPolygon();
            expect(multiPolygon.getCoordinates()).to.have.length(0);
            expect(multiPolygon.isEmpty()).to.be.ok();
        });

    });

    it('can have various symbols',function() {
        var points = [
                [
                    [[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]
                ],
                [
                    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
                ]
            ];
        var vector = new Z.MultiPolygon(points);
        GeoSymbolTester.testGeoSymbols(vector, map);
    });
});
