describe('#TileLayer', function() {

    var container;
    var map;
    var center = new Z.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new Z.Map(container, option);
    });

    afterEach(function () {
        removeContainer(container)
    });

    describe("Difference Projections", function() {
        it("webmercator", function(done) {
            var tile = new Z.TileLayer('tile', {
                debug : true,
                urlTemplate:"http://t{s}.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}",
                subdomains: [1, 2, 3]
            });
            tile.on('layerload', function() {
                done();
            });
            map.setBaseLayer(tile);
        });

        it('lonlat', function(done) {
            map.config({
                minZoom:1,
                maxZoom:18,
                view:{
                    projection:'EPSG:4326',
                    resolutions: (function() {
                        var resolutions = [];
                        for (var i=0; i < 19; i++) {
                            resolutions[i] = 180/(Math.pow(2, i)*128);
                        }
                        return resolutions;
                    })()
                }
            });
            var tile = new maptalks.TileLayer("tile",{
                debug : true,
                tileSystem : [1, -1, -180, 90],
                crossOrigin:"Anonymous",
                urlTemplate:"http://t{s}.tianditu.com/DataServer?T=vec_c&x={x}&y={y}&l={z}",
                subdomains:['1','2','3','4','5']
            });
            tile.on('layerload', function() {
                done();
            });
            map.setBaseLayer(tile);
        });

        it("baidu", function(done) {
            map.config({
                minZoom:1,
                maxZoom:19,
                view:{
                    projection : 'baidu'
                }
            });
            //添加baidu瓦片图层
            var tile = new maptalks.TileLayer("tile",{
                debug : true,
                crossOrigin:"Anonymous",
                urlTemplate:"http://online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=pl",
                subdomains:[0,1,2,3,4,5,6,7,8,9]
            })
            tile.on('layerload', function() {
                done();
            });
            map.setBaseLayer(tile);
        });
    });

});
