describe('ImageLayer', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(0,0);

    function createMap() {
        container = document.createElement('div');
        container.style.width = '300px';
        container.style.height = '300px';
        document.body.appendChild(container);
        var option = {
            center: [0, 0],
            zoom: 4,
            spatialReference: {
            projection: 'identity',
            resolutions: [
                    32, 16, 8, 4, 2, 1
                ],
                fullExtent: {
                    'top': 10000,
                    'left': -10000,
                    'bottom': -10000,
                    'right': 10000
                    }
                }
        };
        map = new maptalks.Map(container, option);
    }

    beforeEach(function () {

    });

    afterEach(function () {
        if (map) {
            map.remove();
        }
        REMOVE_CONTAINER(container);
    });

    describe('add to map', function () {
        it('image 404', function (done) {
            createMap();
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'canvas',
                images : [{
                   url : '/resources/not-exists.png',
                   extent: [0, 0, 255, 255]
                }]
            });
            imageLayer.once('layerload', function () {
                done();
            });
            map.addLayer(imageLayer);
        });

        it('add again', function (done) {
            createMap();
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'canvas',
                images : [{
                   url : '/resources/tile.png',
                   extent: [-1, -1, 255, 255]
                }]
            });
            imageLayer.once('layerload', function () {
                expect(imageLayer).to.be.painted();
                map.removeLayer(imageLayer);
                imageLayer.once('layerload', function () {
                    expect(imageLayer).to.be.painted();
                    done();
                });
                map.addLayer(imageLayer);
            });
            map.addLayer(imageLayer);
        });

        it('many images', function (done) {
            createMap();
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'canvas',
                images : (function(){
                    var images = [];
                    for(var i = 0;i < 5;i++){
                        images.push({
                         url : '/resources/tile.png',
                         extent: [-1 + i, -1 + i, 255 + i, 255 + i]
                        });
                    }
                    return images;
                })()
            });
            imageLayer.once('layerload', function () {
                expect(imageLayer).to.be.painted();
                done();
            });
            map.addLayer(imageLayer);
        });

        it('add new image', function (done) {
            createMap();
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'canvas',
                images : [{
                   url : '/resources/tile.png',
                   extent: [-1, -1, 255, 255]
                }]
            });
            imageLayer.once('layerload', function () {
                expect(imageLayer).to.be.painted();
                setTimeout(function(){
                   imageLayer.addImage({url :'/resources/tile.png', extent: [-2, -2, 254, 254]});
                   expect(imageLayer).to.be.painted();
                   done();
                }, 80);
            });
            map.addLayer(imageLayer);
        });
    });

    describe('Different Projections', function () {
        it('identity', function (done) {
            createMap();
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'canvas',
                images : [{
                   url : '/resources/tile.png',
                   extent: [-1, -1, 255, 255]
                }]
            });
            imageLayer.on('layerload', function () {
                expect(imageLayer).to.be.painted();
                done();
            });
            map.addLayer(imageLayer);
        });

        it('lonlat', function (done) {
            createMap();
            map.config({
                minZoom:1,
                maxZoom:18,
                zoom:5,
                spatialReference:{
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
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'canvas',
                images : [{
                   url : '/resources/tile.png',
                   extent: [-0.5, -0.5, 0.5, 0.5]
                }]
            });
            imageLayer.on('layerload', function () {
                expect(imageLayer).to.be.painted();
                done();
            });
            map.addLayer(imageLayer);
        });

        it('baidu', function (done) {
            createMap();
            map.config({
                minZoom: 1,
                maxZoom: 19,
                spatialReference: {
                    projection : 'baidu'
                }
            });
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'canvas',
                images : [{
                   url : '/resources/tile.png',
                   extent: [-0.5, -0.5, 0.5, 0.5]
                }]
            });
            imageLayer.on('layerload', function () {
                expect(imageLayer).to.be.painted();
                done();
            });
            map.addLayer(imageLayer);
        });
    });

    describe('Different Renderers', function () {
        it('canvas renderer', function (done) {
            createMap();
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'canvas',
                images : [{
                   url : '/resources/tile.png',
                   extent: [-1, -1, 255, 255]
                }]
            });
            imageLayer.once('layerload', function () {
                imageLayer.hide();
                imageLayer.show();
                done();
            });
            map.addLayer(imageLayer);

        });

        it('webgl renderer', function (done) {
            if (!maptalks.Browser.webgl) {
                done();
                return;
            }
            createMap();
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'gl',
                images : [{
                   url : '/resources/tile.png',
                   extent: [-1, -1, 255, 255]
                }]
            });
            imageLayer.once('layerload', function () {
                imageLayer.hide();
                imageLayer.show();
                done();
            });
            map.addLayer(imageLayer);

        });

        it('gl with 404', function (done) {
            if (!maptalks.Browser.webgl) {
                done();
                return;
            }
            createMap();
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'gl',
                images : [{
                   url : '/resources/not-exists.png',
                   extent: [-1, -1, 255, 255]
                }]
            });
            imageLayer.once('layerload', function () {
                imageLayer.hide();
                imageLayer.show();
                done();
            });
            map.addLayer(imageLayer);
        });

    });

    describe('In a canvas container', function () {
        it('can be loaded', function (done) {
            container = document.createElement('canvas');
            container.style.width = '1px';
            container.style.height = '1px';
            document.body.appendChild(container);
            var option = {
                zoom: 17,
                center: center
            };
            map = new maptalks.Map(container, option);
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'canvas',
                images : [{
                   url : '/resources/tile.png',
                   extent: [-1, -1, 255, 255]
                }]
            });
            imageLayer.on('layerload', function () {
                expect(imageLayer.isCanvasRender()).to.be.ok();
                expect(map).to.be.painted();
                done();
            });
            map.addLayer(imageLayer);
        });

        it('with rotation', function (done) {
            container = document.createElement('canvas');
            container.width = 30;
            container.height = 30;
            document.body.appendChild(container);
            var option = {
            center: [0, 0],
            zoom: 4,
            spatialReference: {
            projection: 'identity',
            resolutions: [
                    32, 16, 8, 4, 2, 1
                ],
                fullExtent: {
                    'top': 10000,
                    'left': -10000,
                    'bottom': -10000,
                    'right': 10000
                    }
                }
            };
            map = new maptalks.Map(container, option);
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'canvas',
                images : [{
                   url : '/resources/tile.png',
                   extent: [-100, -100, 156, 156]
                }]
            });
            imageLayer.on('layerload', function () {
                expect(imageLayer.isCanvasRender()).to.be.ok();
                expect(map).to.be.painted();
                done();
            });
            map.addLayer(imageLayer);
        });

    });

    describe('pitch', function () {
        it('should set pitch', function (done) {
            if (!maptalks.Browser.webgl) {
                done();
                return;
            }
            createMap();
            var imageLayer = new maptalks.ImageLayer('img', {
                renderer : 'gl',
                images : [{
                   url : '/resources/tile.png',
                   extent: [-10, -1, 255, 255]
                }]
            });
            imageLayer.once('layerload', function () {
                imageLayer.once('layerload', function () {
                    expect(imageLayer.isCanvasRender()).to.be.ok();
                    done();
                });
                var map = imageLayer.getMap();
                map.config('zoomDuration', 80);
                map.setZoom(map.getZoom() - 1, { animation : false });
            });
            map.addLayer(imageLayer);
        });
    });

});
