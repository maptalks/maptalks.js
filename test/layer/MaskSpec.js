// var utils = require('../SpecUtils.js');

describe('Spec of Masks', function() {

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
            urlTemplate : '/resources/tile.png',
            subdomains:['a','b','c'],
            visible : false
        });

        // map.setBaseLayer(tile);
        context.map = map;
    });

    afterEach(function() {
        removeContainer(container);
    });

    function testMask(layer, done) {
        layer.once('layerload', function() {
            expect(layer).not.to.be.painted(-7);
            expect(layer).to.be.painted();
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

    //test tilelayer
    runTests(new Z.TileLayer('tile', {
            crossOrigin : 'anonymous',
            urlTemplate:'/resources/tile.png',
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
                    expect(layerToTest).to.be.painted(-20);
                    testMask(layerToTest, done);
                });
            });

            it('can remove mask', function(done) {
                layerToTest.once('layerload', function() {
                    layerToTest.once('layerload', function() {
                        layerToTest.once('layerload', function() {
                            expect(layerToTest).to.be.painted(-20);
                            expect(layerToTest).to.be.painted();
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
