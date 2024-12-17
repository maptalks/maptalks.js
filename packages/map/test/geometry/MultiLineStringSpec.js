describe('Geometry.MultiLineString', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('getCenter', function () {
        var mp = new maptalks.MultiLineString([]);
        var coords = [];
        coords[0] = [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
            { x: 4, y: 3 }
        ];
        coords[1] = [
            { x: 5, y: 6 },
            { x: 7, y: 8 },
            { x: 6, y: 5 }
        ];
        mp.setCoordinates(coords);
        expect(mp.getCenter()).to.be.closeTo(new maptalks.Coordinate(4.333333333, 4.66666666));
    });

    it('getCenterInExtent', function () {
        var mp = new maptalks.MultiLineString([]);
        var coords = [];
        coords[0] = [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
            { x: 4, y: 3 }
        ];
        coords[1] = [
            { x: 5, y: 6 },
            { x: 7, y: 8 },
            { x: 6, y: 5 }
        ];
        mp.setCoordinates(coords);
        var center = mp.getCenterInExtent(new maptalks.Extent(100, 100, 100.5, 100.5));
        expect(center === null).to.be.ok();
        center = mp.getCenterInExtent(new maptalks.Extent(2, 3, 2.5, 3.5));
        expect(center.x).to.be(2.25);
        expect(center.y).to.be(3.25);
    });

    it('getExtent', function () {
        var mp = new maptalks.MultiLineString([]);
        var coords = [];
        coords[0] = [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
            { x: 4, y: 3 }
        ];
        coords[1] = [
            { x: 5, y: 6 },
            { x: 7, y: 8 },
            { x: 6, y: 5 }
        ];
        mp.setCoordinates(coords);

        var extent = mp.getExtent();
        expect(extent.getWidth()).to.be.above(0);
        expect(extent.getHeight()).to.be.above(0);
    });

    it('getSize', function () {
        var mp = new maptalks.MultiLineString([]);
        var coords = [];
        coords[0] = [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
            { x: 4, y: 3 }
        ];
        coords[1] = [
            { x: 5, y: 6 },
            { x: 7, y: 8 },
            { x: 6, y: 5 }
        ];
        mp.setCoordinates(coords);
        layer.addGeometry(mp);
        var size = mp.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });

    it('getCoordinates/setCoordinates', function () {
        var mp = new maptalks.MultiLineString([]);

        expect(mp.getCoordinates()).to.be.empty();

        var coords = [];
        coords[0] = [
            { x: 1, y: 2, z: 0 },
            { x: 3, y: 4, z: 0 },
            { x: 4, y: 3, z: 0 }
        ];
        coords[1] = [
            { x: 5, y: 6, z: 0 },
            { x: 7, y: 8, z: 0 },
            { x: 6, y: 5, z: 0 }
        ];
        mp.setCoordinates(coords);

        expect(mp.getCoordinates()).to.eql(coords);
    });

    describe('creation', function () {

        it('normal constructor', function () {
            var points = [
                [[100.0, 0.0], [101.0, 1.0]],
                [[102.0, 2.0], [103.0, 3.0]]
            ];
            var multiPolyline = new maptalks.MultiLineString(points);
            var coordinates = multiPolyline.getCoordinates();
            expect(coordinates).to.have.length(points.length);
            var geojsonCoordinates = maptalks.Coordinate.toNumberArrays(coordinates);
            expect(geojsonCoordinates).to.eql(points);
        });

        it('can be empty.', function () {
            var multiPolyline = new maptalks.MultiLineString();
            expect(multiPolyline.getCoordinates()).to.have.length(0);
            expect(multiPolyline.isEmpty()).to.be.ok();
        });

    });

    it('can have various symbols', function (done) {
        var points = [
            [[100.0, 0.0], [101.0, 1.0]],
            [[102.0, 2.0], [103.0, 3.0]]
        ];
        var vector = new maptalks.MultiLineString(points);
        COMMON_SYMBOL_TESTOR.testGeoSymbols(vector, map, done);
    });
});
