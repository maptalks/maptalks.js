describe('SpatialReference.Update', function () {
    var container;
    var map;

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '1px';
        container.style.height = '1px';
        document.body.appendChild(container);
        map = new maptalks.Map(container, {
            'zoom' : 14,
            'center' : [0, 0]
        });
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER();
    });

    it('TileLayer', function (done) {
        var tileLayer = new maptalks.TileLayer('base', {
            urlTemplate : '#'
        });
        tileLayer.once('layerload', function () {
            map.setSpatialReference({
                projection : 'baidu'
            });
            var tiles = tileLayer.getTiles().tileGrids[0].tiles;
            var tile = tiles[tiles.length - 1];
            expect(tile.point.toArray()).to.be.eql([-256, -256]);
            done();
        });
        map.setBaseLayer(tileLayer);
        var tiles = tileLayer.getTiles().tileGrids[0].tiles;
        var tile = tiles[tiles.length - 1];
        expect(tile.point.toArray()).to.be.eql([-256.0000000001879, -256.0000000001879]);
    });

    var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
    geometries[0].setSymbol({
        markerType : 'ellipse',
        markerWidth : 20,
        markerHeight : 20
    });
    var counter = 0;
    function test(geo) {
        return function (done) {
            map.setCenter(geo.getFirstCoordinate());
            var layer = new maptalks.VectorLayer('base' + counter++, geo, { 'drawImmediate' : true });
            layer.once('layerload', function () {
                layer.once('layerload', function () {
                    done();
                });
                map.setSpatialReference({
                    projection : 'baidu'
                });
            });
            layer.addTo(map);
        };
    }
    for (var i = 0; i < geometries.length; i++) {
        it('VectorLayer with geometry ' + geometries[i].getType(), test(geometries[i]));
    }
});
