describe('#CanvasMap', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('canvas');
        container.width = 400;
        container.height = 300;
        container.style.width = '400px';
        container.style.height = '300px';
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

    it('map creation on canvas', function (done) {
        var tile = new maptalks.TileLayer('tile', {
            urlTemplate:'/resources/tile.png',
            subdomains: [1, 2, 3]
        });
        tile.on('layerload', function () {
            map.once('renderend', function () {
                expect(map).to.be.painted();
                done();
            });
        });
        map.setBaseLayer(tile);
    });

    it('map rendering when zooming', function (done) {
        var tile = new maptalks.TileLayer('tile', {
            urlTemplate:'/resources/tile.png',
            subdomains: [1, 2, 3]
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
