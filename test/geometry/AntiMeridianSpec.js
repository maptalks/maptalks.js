
describe('Geometry.AntiMeridian', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate([179, 10]);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            zoom : 1,
            center : [0, 0],
            width : 300,
            height : 300
        });
        container = setups.container;
        map = setups.map;
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
                { arrowStyle:'classic', arrowPlacement : 'vertex-firstlast' }
            ),
            new maptalks.QuadBezierCurve(
                [[179, 10], [-170, 10], [-169, -10], [179, -10]],
                { arrowStyle:'classic' }
            ),
            new maptalks.CubicBezierCurve(
                [[179, 10], [-170, 10], [-169, -10], [179, -10]],
                { arrowStyle:'classic' }
            ),
            //a continuous anti-meridian polygon with a hole
            new maptalks.Polygon([
                [[179, 10], [-170, 10], [-169, -10], [179, -10]],
                [[180, 5], [-175, 5], [-171, -5], [180, -5]]
            ]
            )
        ];
    }
    var geometries = genGeometries();
    geometries.forEach(function (g) {
        it('different symbols', function (done) {
            this.timeout(5000);
            COMMON_SYMBOL_TESTOR.testGeoSymbols(g, map, done);
        });
    });

    describe('linestring on meridian', function () {
        it('linestring should continue to draw from [170, 80] to [-150, 80]', function () {
            map.setCenter([170, 80]);
            var line = new maptalks.LineString([[170, 80], [-170, 80], [-150, 80]]);
            layer.addGeometry(line);
            expect(layer).not.to.be.painted(-2, 0);
            expect(layer).to.be.painted(10, 0);
            expect(line.getSize()._round().toArray()).to.be.eql([59, 2]);
        });

        it('linestring should draw a long line from [-150, 80] to [170, 80]', function () {
            map.setCenter([170, 80]);
            var line = new maptalks.LineString([[-150, 80], [-170, 80], [170, 80]]);
            layer.addGeometry(line);
            expect(layer).not.to.be.painted(2, 0);
            expect(layer).to.be.painted(-100, 0);
            expect(line.getSize()._round().toArray()).to.be.eql([486, 2]);
        });

        it('linestring should continue to draw from [180, 80] to [180, -80]', function () {
            map.setCenter([180, 80]);
            var line = new maptalks.LineString([[180, 80], [180, -80], [180, -60]]);
            layer.addGeometry(line);
            expect(layer).not.to.be.painted(0, 2);
            expect(layer).to.be.painted(0, -20);
            expect(line.getSize()._round().toArray()).to.be.eql([2, 208]);
        });

        it('linestring should draw a long line from [180, -80] to [180, 80]', function () {
            map.setCenter([180, 80]);
            var line = new maptalks.LineString([[180, -80], [180, -60], [180, 80]]);
            layer.addGeometry(line);
            expect(layer).not.to.be.painted(0, -2);
            expect(layer).to.be.painted(0, 100);
            expect(line.getSize()._round().toArray()).to.be.eql([2, 399]);
        });
    });

    describe('polygon on meridian', function () {
        it('polygon should continue to draw from [170, 80] to [-170, 70]', function () {
            map.setCenter([170, 80]);
            var polygon = new maptalks.Polygon([[170, 80], [-170, 80], [-170, 70]]);
            layer.addGeometry(polygon);
            expect(layer).not.to.be.painted(-4, 0);
            expect(layer).to.be.painted(10, 0);
            expect(polygon.getSize()._round().toArray()).to.be.eql([30, 59]);
        });

        it('polygon should draw a big polygon from [-170, 80] to [170, 70]', function () {
            map.setCenter([170, 80]);
            var polygon = new maptalks.Polygon([[-170, 80], [170, 70], [170, 80]]);
            layer.addGeometry(polygon);
            expect(layer).not.to.be.painted(2, 0);
            expect(layer).to.be.painted(-100, 0);
            expect(polygon.getSize()._round().toArray()).to.be.eql([486, 59]);
        });

        it('polygon should continue to draw from [180, 80] to [180, -80]', function () {
            map.setCenter([180, 80]);
            var polygon = new maptalks.Polygon([[180, 80], [180, -80], [170, -80]]);
            layer.addGeometry(polygon);
            expect(layer).not.to.be.painted(0, 2);
            expect(layer).to.be.painted(0, -20);
            expect(polygon.getSize()._round().toArray()).to.be.eql([16, 117]);
        });

        it('polygon should draw a big polygon from [180, -80] to [180, 80]', function () {
            map.setCenter([180, 80]);
            var polygon = new maptalks.Polygon([[180, -80], [180, 80], [170, 80]]);
            layer.addGeometry(polygon);
            expect(layer).not.to.be.painted(0, -2);
            expect(layer).to.be.painted(0, 100);
            expect(polygon.getSize()._round().toArray()).to.be.eql([16, 399]);
        });
    });

    describe('circle on meridian', function () {
        it('paint at [180, 85]', function () {
            var circle = new maptalks.Circle([180, 85], 1000000);
            map.setCenter([180, 85]);
            layer.addGeometry(circle);
            expect(layer).to.be.painted(-10, 0);
            expect(layer).to.be.painted(10, 0);
            expect(layer).to.be.painted(0, 10);
            expect(layer).to.be.painted(0, -10);
            expect(circle.getSize()._round().toArray()).to.be.eql([295, 170]);
        });

        it('paint at [-180, -85]', function () {
            map.setCenter([-180, -85]);
            var circle = new maptalks.Circle([-180, -85], 1000000);
            layer.addGeometry(circle);
            expect(layer).to.be.painted(-10, 0);
            expect(layer).to.be.painted(10, 0);
            expect(layer).to.be.painted(0, 10);
            expect(layer).to.be.painted(0, -10);
            expect(circle.getSize()._round().toArray()).to.be.eql([295, 170]);
        });
    });

    describe('ellipse on meridian', function () {
        it('paint at [180, 85]', function () {
            map.setCenter([180, 85]);
            var ellipse = new maptalks.Ellipse([180, 85], 2000000, 2000000);
            layer.addGeometry(ellipse);
            expect(layer).to.be.painted(-10, 0);
            expect(layer).to.be.painted(10, 0);
            expect(layer).to.be.painted(0, 10);
            expect(layer).to.be.painted(0, -10);
            expect(ellipse.getSize()._round().toArray()).to.be.eql([295, 170]);
        });

        it('paint at [-180, -85]', function () {
            map.setCenter([-180, -85]);
            var ellipse = new maptalks.Ellipse([-180, -85], 2000000, 2000000);
            layer.addGeometry(ellipse);
            expect(layer).to.be.painted(-10, 0);
            expect(layer).to.be.painted(10, 0);
            expect(layer).to.be.painted(0, 10);
            expect(layer).to.be.painted(0, -10);
            expect(ellipse.getSize()._round().toArray()).to.be.eql([295, 170]);
        });
    });


    describe('sector on meridian', function () {
        it('paint at [180, 85]', function () {
            map.setCenter([180, 85]);
            var sector = new maptalks.Sector([180, 85], 1000000, 0, 360);
            layer.addGeometry(sector);
            expect(layer).to.be.painted(-10, 0);
            expect(layer).to.be.painted(10, 0);
            expect(layer).to.be.painted(0, 10);
            expect(layer).to.be.painted(0, -10);
            expect(sector.getSize()._round().toArray()).to.be.eql([295, 170]);
        });

        it('paint at [-180, -85]', function () {
            map.setCenter([-180, -85]);
            var sector = new maptalks.Sector([-180, -85], 1000000, 0, 360);
            layer.addGeometry(sector);
            expect(layer).to.be.painted(-10, 0);
            expect(layer).to.be.painted(10, 0);
            expect(layer).to.be.painted(0, 10);
            expect(layer).to.be.painted(0, -10);
            expect(sector.getSize()._round().toArray()).to.be.eql([295, 170]);
        });
    });

    describe('rectangle on meridian', function () {
        it('paint at [180, 90]', function () {
            map.setCenter([180, 85]);
            var rectangle = new maptalks.Rectangle([180, 85], 1000000, 500000);
            layer.addGeometry(rectangle);
            expect(layer).not.to.be.painted(-10, 0);
            expect(layer).to.be.painted(10, 0);
            expect(layer).to.be.painted(0, 10);
            expect(layer).not.to.be.painted(0, -10);
            expect(rectangle.getSize()._round().toArray()).to.be.eql([79, 54]);
        });

        it('paint at [-180, -85]', function () {
            map.setCenter([-180, -80]);
            var rectangle = new maptalks.Rectangle([-180, -80], 1000000, 500000);
            layer.addGeometry(rectangle);
            expect(layer).not.to.be.painted(-10, 0);
            expect(layer).to.be.painted(10, 0);
            expect(layer).to.be.painted(0, 10);
            expect(layer).not.to.be.painted(0, -10);
            expect(rectangle.getSize()._round().toArray()).to.be.eql([135, 51]);
        });
    });

});
