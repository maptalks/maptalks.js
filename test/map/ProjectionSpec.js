import {
    removeContainer
} from '../SpecCommon';
import {
    Circle,
    Polygon
} from 'geometry';
import Coordinate from 'geo/Coordinate';
import Map from 'map';

describe('#Projection', function () {

    var container;
    var map;
    var center = new Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation: false,
            zoom: 17,
            center: center
        };
        map = new Map(container, option);
    });

    afterEach(function () {
        removeContainer(container);
    });

    describe('is default projection', function () {
        it('default projection is EPSG:3857', function () {
            var projection = map.getProjection();
            expect(projection.code).to.be.eql('EPSG:3857');
        });
    });

    describe('change to EPSG:4326', function () {
        it('change to EPSG:4326', function () {
            map.setView({
                projection: 'EPSG:4326'
            });
            expect(map.getProjection().code).to.be.eql('EPSG:4326');
            expect(map.getCenter()).to.closeTo(center);
        });

        it('change center before changing view', function () {
            var newCenter = new Coordinate(100, 0);
            map.setCenter(newCenter);
            map.setView({
                projection: 'EPSG:4326'
            });
            expect(map.getProjection().code).to.be.eql('EPSG:4326');
            expect(map.getCenter()).to.closeTo(newCenter);
        });
    });

    describe('change to IDENTITY', function () {
        it('change to IDENTITY', function () {
            map.setView({
                projection: 'IDENTITY',
                resolutions: [0, 10, 20],
                fullExtent: {
                    'top': 0,
                    'left': 0,
                    'bottom': 1000000,
                    'right': 1000000
                }
            });
            expect(map.getProjection().code).to.be.eql('IDENTITY');
            expect(map.getCenter()).to.closeTo(center);
            expect(map.computeLength([0, 10], [0, 20])).to.be.eql(10);
            var circle = new Circle([10, 10], 1);
            expect(map.computeGeometryArea(circle)).to.be.eql(Math.PI);
            var polygon = new Polygon([
                [0, 0],
                [0, 10],
                [10, 10],
                [10, 0]
            ]);
            expect(map.computeGeometryArea(polygon)).to.be.eql(100);
            expect(map.locate([0, 0], 10, 10)).to.be.eql(new Coordinate(10, 10));
        });
    });

    describe('change to Baidu', function () {
        it('change to baidu', function () {
            map.setView({
                projection: 'baidu'
            });
            expect(map.getProjection().code).to.be.eql('BAIDU');
            expect(map.getCenter()).to.closeTo(center);
        });
    });
});
