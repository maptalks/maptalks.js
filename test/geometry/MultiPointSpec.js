import {
    commonSetupMap,
    removeContainer,
    GeoSymbolTester,
    GeoEventsTester
} from '../SpecCommon';
import {
    MultiPoint
} from 'geometry';
import Coordinate from 'geo/Coordinate';
import VectorLayer from 'layer/VectorLayer';

describe('#MultiPoint', function () {

    var container;
    var map;
    var center = new Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        layer = new VectorLayer('id');
        map.addLayer(layer);
    });

    afterEach(function () {
        map.removeLayer(layer);
        removeContainer(container);
    });

    it('setCoordinates', function () {
        var points = new MultiPoint([
            [0, 0],
            [1, 1],
            [2, 2]
        ]);
        points.setCoordinates([
            [0, 0]
        ]);
        expect(Coordinate.toNumberArrays(points.getCoordinates())).to.be.eql([
            [0, 0]
        ]);
    });

    it('getCenter', function () {
        var points = new MultiPoint([
            [0, 0],
            [1, 1],
            [2, 2]
        ]);
        expect(points.getCenter().toArray()).to.eql([1, 1]);
    });

    it('getExtent', function () {
        var points = new MultiPoint([
            [0, 0],
            [1, 1],
            [2, 2]
        ]);
        var extent = points.getExtent();
        expect(extent.getWidth()).to.be.above(0);
        expect(extent.getHeight()).to.be.above(0);
    });

    it('getSize', function () {
        var points = new MultiPoint([
            [0, 0],
            [1, 1],
            [2, 2]
        ]);
        layer.addGeometry(points);
        var size = points.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });

    describe('constructor', function () {

        it('normal constructor', function () {
            var points = [
                [100.0, 0.0],
                [101.0, 1.0]
            ];
            var multiPoint = new MultiPoint(points);
            expect(multiPoint.getCoordinates()).to.have.length(points.length);
        });

        it('can be empty.', function () {
            var multiPoint = new MultiPoint();
            expect(multiPoint.getCoordinates()).to.have.length(0);
            expect(multiPoint.isEmpty()).to.be.ok();
        });

    });
    describe('geometry fires events', function () {
        it('events', function () {
            var vector = new MultiPoint([center]);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });


    });


    it('can have various symbols', function (done) {
        var vector = new MultiPoint([center]);
        GeoSymbolTester.testGeoSymbols(vector, map, done);
    });
});
