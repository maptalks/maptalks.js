describe('#CanvasMap', function () {

    var container;
    var map;
    var tile;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('canvas');
        container.width = 4;
        container.height = 3;
        container.style.width = '4px';
        container.style.height = '3px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:true,
            zoom: 17,
            center: center,
            zoomAnimationDuration : 80
        };
        map = new maptalks.Map(container, option);
        tile = new maptalks.TileLayer('tile', {
            urlTemplate:'/resources/tile.png',
            subdomains: [1, 2, 3]
        });
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('map creation on canvas', function (done) {
        tile.on('layerload', function () {
            maptalks.Util.requestAnimFrame(function () {
                expect(map).to.be.painted();
                done();
            });
        });
        map.setBaseLayer(tile);

    });

    it('map rendering when zooming', function (done) {
        tile.on('layerload', function () {
            map.zoomIn();
        });
        map.setBaseLayer(tile);
        map.on('zooming', function () {
            expect(map).to.be.painted();
        });
        map.on('zoomend', function () {
            done();
        });

    });
});
