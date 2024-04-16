describe('Color Specs', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var canvasContainer;
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            width : 300,
            height : 200
        });
        container = setups.container;
        map = setups.map;
        map.config('centerCross', true);
        canvasContainer = map.getPanels().front;
        layer = new maptalks.VectorLayer('v').addTo(map);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('textHaloFill and textFill support normalized color', function (done) {
        var marker = new maptalks.Marker(map.getCenter(), {
            symbol : {
                textName : '■■■■■■■■■',
                textSize : 40,
                textHaloRadius: 8,
                textHaloFill: [0, 1, 0, 1],
                textFill : [1, 0, 0, 1],
                textVerticalAlignment: 'top'
            }
        });
        var layer = new maptalks.VectorLayer('vector', marker, { 'drawImmediate' : true }).addTo(map);
        setTimeout(function () {
            if (!maptalks.Browser.ie) {
                expect(layer).to.be.painted(0, -10, [255, 0, 0]);
                expect(layer).to.be.painted(0, -2, [0, 255, 0]);
            }

            done();
        }, 20);
    });

    it('markerFill and markerLineColor support normalized color', function (done) {
        var marker = new maptalks.Marker(map.getCenter(), {
            symbol : {
                markerType: 'ellipse',
                markerFill: [1, 0, 0, 1],
                markerLineColor: [0, 1, 0, 1],
                markerWidth: 20,
                markerHeight: 20,
                markerLineWidth: 4
            }
        });
        var layer = new maptalks.VectorLayer('vector', marker, { 'drawImmediate' : true }).addTo(map);
        setTimeout(function () {
            expect(layer).to.be.painted(0, 0, [255, 0, 0]);
            expect(layer).to.be.painted(10, 0, [0, 255, 0]);
            done();
        }, 20);
    });

    it('LineString support normalized color', function (done) {
        var line = new maptalks.LineString([map.getCenter().add(-1, 0), map.getCenter().add(1, 0)], {
            symbol : {
                lineWidth: 6,
                lineColor: [1, 0, 0, 1]
            }
        });
        var layer = new maptalks.VectorLayer('vector', line, { 'drawImmediate' : true }).addTo(map);
        setTimeout(function () {
            expect(layer).to.be.painted(0, 0, [255, 0, 0]);
            done();
        }, 20);
    });

    it('Polygon support normalized color', function (done) {
        var line = new maptalks.Polygon([[
            map.getCenter().add(-1, 0),
            map.getCenter().add(1, 0),
            map.getCenter().add(1, 1),
            map.getCenter().add(-1, 1),
            map.getCenter().add(-1, 0)
         ]], {
            symbol : {
                polygonFill: [1, 0, 0, 1],
                lineWidth: 6,
                lineColor: [0, 1, 0, 1]
            }
        });
        var layer = new maptalks.VectorLayer('vector', line, { 'drawImmediate' : true }).addTo(map);
        setTimeout(function () {
            expect(layer).to.be.painted(0, 0, [0, 255, 0]);
            expect(layer).to.be.painted(0, -20, [255, 0, 0]);
            done();
        }, 20);
    });
});
