describe('SymbolMapReSizeSpec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            width: 400,
            height: 400
        });
        container = setups.container;
        map = setups.map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('symbol render when map resize', function (done) {
        var geometry = new maptalks.Polygon([[
            center.add(-0.1, 0.1),
            center.add(0.1, 0.1),
            center.add(0.1, -0.1),
            center.add(-0.1, -0.1),
        ]], {
            symbol: {
                'lineWidth': 0,
                'lineColor': '#000',
                polygonFill: 'red',
                polygonOpacity: 1
            }
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        setTimeout(function () {
            var size = map.getSize();
            var mapImage = COMMON_GET_MAP_COLOR(map, size.width / 2, size.height / 2);
            console.log([mapImage[0], mapImage[1], mapImage[2], mapImage[3]]);
            expect([mapImage[0], mapImage[1], mapImage[2], mapImage[3]]).to.be.eql([255, 0, 0, 255]);
            container.style.width = '300px';
            setTimeout(function () {
                var size = map.getSize();
                var mapImage = COMMON_GET_MAP_COLOR(map, size.width / 2, size.height / 2);
                console.log([mapImage[0], mapImage[1], mapImage[2], mapImage[3]]);
                expect([mapImage[0], mapImage[1], mapImage[2], mapImage[3]]).to.be.eql([255, 0, 0, 255]);
                done();
            }, 100);
        }, 100);
    });


});
