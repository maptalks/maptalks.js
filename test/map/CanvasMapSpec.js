describe('#CanvasMap', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('canvas');
        container.width = 10;
        container.height = 10;
        container.style.width = '10px';
        container.style.height = '10px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:true,
            zoom: 17,
            center: center,
            zoomAnimationDuration : 80
        };
        map = new maptalks.Map(container, option);

    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('map rendering when zooming', function (done) {
        this.timeout(9600);
        var tile = new maptalks.TileLayer('tile', {
            urlTemplate : TILE_IMAGE,
            renderer : 'canvas'
        });
        tile.on('layerload', function () {
            // when layer is loaded, wait map to render it on the canvas
            map.once('renderend', function () {
                map.zoomIn();
            });
        });
        map.on('zooming', function () {
            expect(map).to.be.painted();
        });
        map.on('zoomend', function () {
            done();
        });
        map.setBaseLayer(tile);
    });
});
