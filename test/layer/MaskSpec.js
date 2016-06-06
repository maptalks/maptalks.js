// var utils = require('../SpecUtils.js');

describe('MaskSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var context = {
    };

    beforeEach(function() {
        container = document.createElement('div');
        container.style.width = '100px';
        container.style.height = '100px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new Z.Map(container, option);
        tile = new Z.TileLayer('tile', {
            crossOrigin : 'anonymous',
            baseLayerRenderer : 'canvas',
            urlTemplate : 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            subdomains:['a','b','c'],
            visible : false
        });

        // map.setBaseLayer(tile);
        context.map = map;
    });

    afterEach(function() {
        removeContainer(container);
    });

    function isDrawn(x, y, canvas) {
        var context = canvas.getContext('2d');
        var imgData = context.getImageData(x, y, 1, 1).data;
        if (imgData[3] > 0) {
            return true;
        }
        return false;
    }

    function testMask(layer, done) {
        layer.once('layerload', function() {
            var image = layer._getRenderer().getCanvasImage(),
                canvas = image.image;
            expect(isDrawn(1, 1, canvas)).not.to.be.ok();
            expect(isCenterDrawn(layer)).to.be.ok();
            done();
        });

        layer.setMask(new maptalks.Marker(map.getCenter(), {
            'symbol' : {
                'markerType' : 'ellipse',
                'markerWidth' : 10,
                'markerHeight' : 10,
                'markerFill' : '#000',
                'markerFillOpacity' : 1,
                'markerDy' : 5
            }
        }));
    }

    function isCenterDrawn(layer) {
        var image = layer._getRenderer().getCanvasImage(),
            canvas = image.image;
        return isDrawn(parseInt(container.style.width)/2 - image.point.x, parseInt(container.style.height)/2 - image.point.y, canvas);
    }

    //test tilelayer
    runTests(new Z.TileLayer('tile', {
            crossOrigin : 'anonymous',
            urlTemplate:'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            subdomains:['a','b','c']
        }), context);

    //test vectorlayer
    var vlayer = new Z.VectorLayer('v').addGeometry(new maptalks.Circle(center, 2000, {
        symbol : {
            'polygonFill' : '#000',
            'polygonOpacity' : 1
        }
    }));

    runTests(vlayer, context);

    function runTests(layerToTest, context) {
        describe('layer', function() {
            beforeEach(function() {
                context.map.addLayer(layerToTest);
            });

            afterEach(function() {
                context.map.removeLayer(layerToTest);
            });

            it('can set mask', function(done) {
                layerToTest.once('layerload', function() {
                    var canvas = layerToTest._getRenderer()._canvas;
                    expect(isDrawn(1, 1, canvas)).to.be.ok();
                    testMask(layerToTest, done);
                });
            });

            it('can remove mask', function(done) {
                layerToTest.once('layerload', function() {
                    layerToTest.once('layerload', function() {
                        layerToTest.once('layerload', function() {
                            var canvas = layerToTest._getRenderer()._canvas;
                            expect(isDrawn(1, 1, canvas)).to.be.ok();
                            expect(isCenterDrawn(layerToTest)).to.be.ok();
                            done();
                        });
                        layerToTest.removeMask();
                    });
                    layerToTest.setMask(new maptalks.Marker(map.getCenter(), {
                        'symbol' : {
                            'markerType' : 'ellipse',
                            'markerWidth' : 10,
                            'markerHeight' : 10,
                            'markerFill' : '#000',
                            'markerFillOpacity' : 1
                        }
                    }));
                });
            });
        });
    }

});
