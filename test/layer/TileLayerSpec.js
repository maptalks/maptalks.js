describe('#TileLayer', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '1px';
        container.style.height = '1px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('add to map', function () {
        it('add again', function (done) {
            var tile = new maptalks.TileLayer('tile', {
                urlTemplate : '/resources/tile.png'
            });
            tile.once('layerload', function () {
                expect(tile).to.be.painted();
                map.removeLayer(tile);
                tile.once('layerload', function () {
                    expect(tile).to.be.painted();
                    done();
                });
                map.addLayer(tile);
            });
            map.addLayer(tile);
        });
    });

    describe('Different Projections', function () {
        it('webmercator', function (done) {
            var tile = new maptalks.TileLayer('tile', {
                debug : true,
                urlTemplate : '#',
                subdomains:['a', 'b', 'c']
            });
            tile.on('layerload', function () {
                done();
            });
            map.setBaseLayer(tile);
        });

        it('lonlat', function (done) {
            map.config({
                minZoom:1,
                maxZoom:18,
                view:{
                    projection:'EPSG:4326',
                    resolutions: (function () {
                        var resolutions = [];
                        for (var i = 0; i < 19; i++) {
                            resolutions[i] = 180 / (Math.pow(2, i) * 128);
                        }
                        return resolutions;
                    })()
                }
            });
            var tile = new maptalks.TileLayer('tile', {
                debug : true,
                tileSystem : [1, -1, -180, 90],
                crossOrigin:'Anonymous',
                urlTemplate:'#',
                subdomains:['1', '2', '3', '4', '5']
            });
            tile.on('layerload', function () {
                done();
            });
            map.setBaseLayer(tile);
        });

        it('baidu', function (done) {
            map.config({
                minZoom:1,
                maxZoom:19,
                view:{
                    projection : 'baidu'
                }
            });
            //添加baidu瓦片图层
            var tile = new maptalks.TileLayer('tile', {
                debug : true,
                crossOrigin:'Anonymous',
                urlTemplate:'#',
                subdomains:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
            });
            tile.on('layerload', function () {
                done();
            });
            map.setBaseLayer(tile);
        });
    });

    describe('Different Renderers', function () {
        it('canvas', function (done) {
            var tile = new maptalks.TileLayer('tile', {
                debug : true,
                urlTemplate : '/resources/tile.png',
                subdomains:['a', 'b', 'c'],
                baseLayerRenderer : 'canvas'
            });
            tile.once('layerload', function () {
                tile.hide();
                tile.show();
                done();
            });
            map.setBaseLayer(tile);

        });

        it('dom', function (done) {
            var tile = new maptalks.TileLayer('tile', {
                debug : true,
                urlTemplate : '/resources/tile.png',
                subdomains:['a', 'b', 'c'],
                baseLayerRenderer : 'dom'
            });
            tile.once('layerload', function () {
                tile.hide();
                tile.show();
                done();
            });
            map.setBaseLayer(tile);

        });

    });

    describe('In a canvas container', function () {
        it('can be loaded', function (done) {
            this.timeout(5000);
            container = document.createElement('canvas');
            container.style.width = '1px';
            container.style.height = '1px';
            document.body.appendChild(container);
            var option = {
                zoom: 17,
                center: center
            };
            map = new maptalks.Map(container, option);
            var tile = new maptalks.TileLayer('tile', {
                debug : true,
                urlTemplate : '/resources/tile.png',
                subdomains:['a', 'b', 'c']
            });
            tile.on('layerload', function () {
                expect(tile.isCanvasRender()).to.be.ok();
                done();
            });
            map.setBaseLayer(tile);
        });

    });

});
