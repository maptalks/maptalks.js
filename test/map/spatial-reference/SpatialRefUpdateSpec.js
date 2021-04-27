describe('SpatialReference.Update', function () {
    var container;
    var map;

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '300px';
        container.style.height = '300px';
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

    it('SpatialReference update with resolutions', function () {
        var res = Math.pow(2, 18);
        var resolutions = [];
        for (var i = 0; i < 25; i++) {
            resolutions[i] = res;
            res *= 0.5;
        }
        var spatialReference = {
            projection: 'baidu',
            resolutions: resolutions
        };
        expect(map.getMaxZoom()).to.be.eql(22);
        map.setSpatialReference(spatialReference);
        expect(map.getMaxZoom()).to.be.eql(24);
    });

    it('SpatialReference.TileLayer', function (done) {
        var tileLayer = new maptalks.TileLayer('base', {
            urlTemplate : '#'
        });
        tileLayer.once('layerload', function () {
            map.setSpatialReference({
                projection : 'baidu'
            });
            var tiles = tileLayer.getTiles().tileGrids[0].tiles;
            var tile = tiles[tiles.length - 1];
            expect(tile.extent2d.xmin).to.be.eql(0);
            expect(tile.extent2d.ymax).to.be.eql(0);
            done();
        });
        map.setBaseLayer(tileLayer);
        var tiles = tileLayer.getTiles().tileGrids[0].tiles;
        var tile = tiles[tiles.length - 1];
        expect(tile.extent2d.xmin).to.be.eql(0);
        expect(tile.extent2d.ymax).to.be.eql(0);
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
