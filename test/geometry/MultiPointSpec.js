describe('#MultiPoint', function () {

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

    it('setCoordinates', function () {
        var points = new maptalks.MultiPoint([[0, 0], [1, 1], [2, 2]]);
        points.setCoordinates([[0, 0]]);
        expect(maptalks.Coordinate.toNumberArrays(points.getCoordinates())).to.be.eql([[0, 0]]);
    });

    it('getCenter', function () {
        var points = new maptalks.MultiPoint([[0, 0], [1, 1], [2, 2]]);
        expect(points.getCenter().toArray()).to.eql([1, 1]);
    });

    it('getExtent', function () {
        var points = new maptalks.MultiPoint([[0, 0], [1, 1], [2, 2]]);
        var extent = points.getExtent();
        expect(extent.getWidth()).to.be.above(0);
        expect(extent.getHeight()).to.be.above(0);
    });

    it('getSize', function () {
        var points = new maptalks.MultiPoint([[0, 0], [1, 1], [2, 2]]);
        layer.addGeometry(points);
        var size = points.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });

    describe('creation', function () {

        it('normal constructor', function () {
            var points = [[100.0, 0.0], [101.0, 1.0]];
            var multiPoint = new maptalks.MultiPoint(points);
            expect(multiPoint.getCoordinates()).to.have.length(points.length);
        });

        it('can be empty.', function () {
            var multiPoint = new maptalks.MultiPoint();
            expect(multiPoint.getCoordinates()).to.have.length(0);
            expect(multiPoint.isEmpty()).to.be.ok();
        });

    });
    describe('geometry fires events', function () {
        it('events', function () {
            var vector = new maptalks.MultiPoint([center]);
            new COMMON_GEOEVENTS_TESTOR().testCanvasEvents(vector, map, vector.getCenter());
        });


    });


    it('can have various symbols', function (done) {
        var vector = new maptalks.MultiPoint([center]);
        COMMON_SYMBOL_TESTOR.testGeoSymbols(vector, map, done);
    });
});
