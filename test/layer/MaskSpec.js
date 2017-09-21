// var utils = require('../SpecUtils.js');

describe('Spec of Masks', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var context = {
    };

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '100px';
        container.style.height = '100px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        context.map = map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    function testMask(layer, done) {
        layer.once('layerload', function () {
            expect(layer).not.to.be.painted(-6, 0);
            expect(layer).to.be.painted(0, 0, [0, 0, 0]);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(-11, 0);
                expect(layer).to.be.painted(0, 0, [0, 0, 0]);
                done();
            });
            layer.setMask(new maptalks.Marker(map.getCenter(), {
                'symbol' : {
                    'markerType' : 'ellipse',
                    'markerWidth' : 20,
                    'markerHeight' : 20,
                    'markerFill' : '#fff',
                    'markerFillOpacity' : 1,
                    'markerLineWidth' : 3,
                    'markerDy' : 5
                }
            }));
        });
        layer.setMask(new maptalks.Circle(map.getCenter(), 5, {
            symbol : {
                'polygonFill' : 'rgba(255, 255, 255, 0.1)'
            }
        }));

    }

    //test tilelayer
    runTests(new maptalks.TileLayer('tile', {
        urlTemplate:'/resources/tile.png',
        renderer:'canvas'
    }), context);

    //test vectorlayer
    var vlayer = new maptalks.VectorLayer('v').addGeometry(new maptalks.Circle(center, 2000, {
        symbol : {
            'polygonFill' : 'rgba(0, 0, 0, 0.1)',
            'polygonOpacity' : 1
        }
    }));

    runTests(vlayer, context);

    function runTests(layerToTest, context) {
        describe('layer', function () {
            beforeEach(function () {
                context.map.addLayer(layerToTest);
            });

            afterEach(function () {
                context.map.removeLayer(layerToTest);
            });

            it('can set mask,' + layerToTest.getJSONType(), function (done) {
                layerToTest.once('layerload', function () {
                    expect(layerToTest).to.be.painted(-20, 0);
                    testMask(layerToTest, done);
                });
            });

            it('can remove mask,' + layerToTest.getJSONType(), function (done) {
                layerToTest.once('layerload', function () {
                    layerToTest.once('layerload', function () {
                        layerToTest.once('layerload', function () {
                            expect(layerToTest).to.be.painted(-20, 0);
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

            it('zoom with mask,' + layerToTest.getJSONType(), function (done) {
                layerToTest.once('layerload', function () {
                    var zoomed = false;
                    layerToTest.on('layerload', function () {
                        if (zoomed) {
                            // expect(layer).not.to.be.painted(-11, 0);
                            expect(layerToTest).to.be.painted(0, 0, [0, 0, 0]);
                            done();
                        }
                    });
                    testMask(layerToTest, function () {
                        zoomed = true;
                        context.map.zoomIn();
                    });
                });
            });
        });
    }

});
