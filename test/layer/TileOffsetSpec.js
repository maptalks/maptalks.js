describe('TileLayer with Offset Specs', function () {

    var map, container;
    var center = new maptalks.Coordinate(121.49867630004883, 31.25405711739208);

    function createMap(zoom, bearing, pitch) {
        container = document.createElement('div');
        container.style.width = '1000px';
        container.style.height = '1500px';
        document.body.appendChild(container);
        var option = {
            zoom: zoom,
            pitch: pitch,
            center: center,
            bearing: bearing
        };
        map = new maptalks.Map(container, option);
    }

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '1000px';
        container.style.height = '1000px';
        document.body.appendChild(container);
    });

    afterEach(function () {
        if (map) {
            map.remove();
        }
        REMOVE_CONTAINER(container);
    });

    it('tiles with dynamic offset', function () {
        createMap(16, 80, 1);
        var tile = new maptalks.TileLayer('tile', {
            offset: function (z) {
                //实时计算wgs84和gcj02瓦片的偏移量
                var center = map.getCenter();
                var c = maptalks.CRSTransform.transform(center.toArray(), 'WGS84', 'GCJ02');
                var offset = map.coordToPoint(center, z).sub(map.coordToPoint(new maptalks.Coordinate(c), z));
                return offset._round().toArray();
            },
            renderer: 'canvas',
            urlTemplate: '#'
        }).addTo(map);
        var tiles = tile.getTiles();
        expect(tiles.tileGrids.length).to.be.eql(1);
        expect(tiles.tileGrids[0].tiles.length).to.be.eql(37);
        expect(tile._getTileOffset(tiles.tileGrids[0].tiles[0].z)).to.be.eql([-207, 109]);
        // console.log(tiles.tileGrids[0].tiles[0]);

    });
    it('#1824 tiles with offset Array', function (done) {
        createMap(16, 0, 0);
        var tile = new maptalks.TileLayer('tile', {
            offset: [100, 100],
            renderer: 'canvas',
            urlTemplate : '/resources/tile-green-256.png'
        }).addTo(map);
        
        setTimeout(() => {
            expect(tile).to.be.painted(0, 0);
            done();
        }, 500);

    });
    it('#1824 tiles with offset Number', function (done) {
        createMap(16, 0, 0);
        var tile = new maptalks.TileLayer('tile', {
            offset: 100,
            renderer: 'canvas',
            urlTemplate : '/resources/tile-green-256.png'
        }).addTo(map);
        
        setTimeout(() => {
            expect(tile).to.be.painted(0, 0);
            done();
        }, 500);

    });
});
