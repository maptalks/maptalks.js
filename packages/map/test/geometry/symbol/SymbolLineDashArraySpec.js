describe('SymbolLineDashArraySpec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            width: 400,
            height: 400,
            zoom: 10
        });
        container = setups.container;
        map = setups.map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });
    it('symbol lineDasharry no pixel clip', function (done) {
        var geometry = new maptalks.LineString([center, center.copy().add(0.1, 0), center.copy().add(0.2, -0.2), center.copy().add(0.2, 0)], {
            symbol: {
                'lineWidth': 5,
                'lineColor': '#000',
                lineDasharray: [5, 5]
            }
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        expect(v).to.be.painted(0, 0);
        done();
    });

    it('symbol lineDasharry with pixel clip', function (done) {
        var geometry = new maptalks.LineString([center, center.copy().add(0.1, 0), center.copy().add(0.2, -0.2), center.copy().add(0.2, 0)], {
            symbol: {
                'lineWidth': 5,
                'lineColor': '#000',
                lineDasharray: [5, 5]
            }
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        map.setZoom(11);
        setTimeout(function () {
            expect(v).to.be.painted(194, 115);
            done();
        }, 100);
    });
    it('symbol lineDasharry with pixel clip when clipBBoxBufferSize < 0', function (done) {
        var geometry = new maptalks.LineString([center, center.copy().add(0.1, 0), center.copy().add(0.2, -0.2), center.copy().add(0.2, 0)], {
            symbol: {
                'lineWidth': 5,
                'lineColor': '#000',
                lineDasharray: [5, 5]
            }
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true, clipBBoxBufferSize: -40 }).addTo(map);
        v.addGeometry(geometry);
        map.setZoom(11);
        setTimeout(function () {
            expect(v).not.to.be.painted(194, 115);
            done();
        }, 100);
    });


});
