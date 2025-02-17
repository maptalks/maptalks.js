describe('SymbolIsArraySpec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });
    it('marker symbol is array', function () {
        var geometry = new maptalks.Marker(center, {
            symbol: [{
                'markerType': 'ellipse',
                'markerWidth': 2,
                'markerHeight': 2,
                'markerDx': 10
            },
            {
                textName: 'Marker',
                textFill: '#f00',
                textWeight: 'bold',
                textHaloColor: '#fff',
                textHaloRadius: 3,
                textSize: 20,
                textWrapCharacter: '\n'
            }]
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        expect(v).to.be.painted(0, 0);
    });
    it('linestring symbol is array', function () {
        var geometry = new maptalks.LineString([center, center.copy().add(0.1, 0)], {
            symbol: [{
                'lineWidth': 2,
                'lineColor': '#000'
            },
            {
                textName: 'LineString',
                textFill: '#f00',
                textWeight: 'bold',
                textHaloColor: '#fff',
                textHaloRadius: 3,
                textSize: 20,
                textWrapCharacter: '\n'
            }]
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        expect(v).to.be.painted(0, 0);
    });

    it('polygon symbol is array', function () {
        var geometry = new maptalks.Polygon([[
            center.add(-0.1, 0.1),
            center.add(0.1, 0.1),
            center.add(0.1, -0.1),
            center.add(-0.1, -0.1),
        ]], {
            symbol: [{
                'lineWidth': 2,
                'lineColor': '#000',
                polygonFill: '#000'
            },
            {
                textName: 'Polygon',
                textFill: '#f00',
                textWeight: 'bold',
                textHaloColor: '#fff',
                textHaloRadius: 3,
                textSize: 20,
                textWrapCharacter: '\n'
            }]
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        expect(v).to.be.painted(0, 0);
    });


});
