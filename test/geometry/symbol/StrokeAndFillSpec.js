describe('StrokeAndFillSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;
    var canvasContainer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        canvasContainer = map._panels.canvasContainer;
        layer = new maptalks.VectorLayer('id').addTo(map);
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    function isCenterDrawn(layer, dx, dy) {
        if (!dx) {
            dx = 0;
        }
        if (!dy) {
            dy = 0;
        }
        var image = layer._getRenderer().getCanvasImage(),
            canvas = image.image;
        return isDrawn(parseInt(container.style.width)/2 - image.point.x + dx, parseInt(container.style.height)/2 - image.point.y + dy, canvas);
    }

    function isDrawn(x, y, canvas) {
        var context = canvas.getContext('2d');
        var imgData = context.getImageData(x, y, 1, 1).data;
        if (imgData[3] > 0) {
            return imgData;
        }
        return null;
    }

    describe('pattern', function() {
        it('fill pattern', function (done) {
            var circle = new maptalks.Circle(center, 10, {
                symbol:{
                    'polygonPatternFile' : 'resources/pattern.png',
                    'polygonOpacity' : 1
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).to.be.painted();
                done();
            })
            v.addGeometry(circle);
        });

        it('line pattern', function (done) {
            var circle = new maptalks.Circle(center, 10, {
                symbol:{
                    'linePatternFile' : 'resources/pattern.png',
                    'lineOpacity' : 1,
                    'lineWidth' : 5,
                    'polygonFill' : '#000',
                    'polygonOpacity' : 0
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).to.be.painted(11);
                done();
            })
            v.addGeometry(circle);
        });

        it('vector marker fill pattern', function (done) {
            var circle = new maptalks.Marker(center, {
                symbol:{
                    'markerType' : 'ellipse',
                    'markerFillPatternFile' : 'resources/pattern.png',
                    'markerFillOpacity' : 1,
                    'markerWidth' : 20,
                    'markerHeight' : 20
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).to.be.painted();
                done();
            })
            v.addGeometry(circle);
        });

        it('vector marker line pattern', function (done) {
            var circle = new maptalks.Marker(center, {
                symbol:{
                    'markerType' : 'ellipse',
                    'markerLinePatternFile' : 'resources/pattern.png',
                    'markerLineOpacity' : 1,
                    'markerLineWidth' : 5,
                    'markerFillOpacity' : 0,
                    'markerWidth' : 20,
                    'markerHeight' : 20
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).to.be.painted(11);
                done();
            })
            v.addGeometry(circle);
        });
    });


    describe('radial gradient', function () {
        it('fill radial gradient', function (done) {
            var circle = new maptalks.Circle(center, 10, {
                symbol:{
                    'polygonFill' : {
                        type : 'radial',
                        places : [0.5, 0.5, 1, 0.5, 0.5, 0],
                        colorStops : [
                            [0.00, 'red'],
                            [1 / 6, 'orange'],
                            [2 / 6, 'yellow'],
                            [3 / 6, 'green'],
                            [4 / 6, 'aqua'],
                            [5 / 6, 'blue'],
                            [1.00, 'white'],
                        ]
                    },
                    'polygonOpacity' : 1
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).to.be.painted();
                done();
            })
            v.addGeometry(circle);
        });

        it('fill radial gradient 2', function (done) {
            var circle = new maptalks.Circle(center, 10, {
                symbol:{
                    'polygonFill' : {
                        type : 'radial',
                        colorStops : [
                            [0.00, 'red'],
                            [1 / 6, 'orange'],
                            [2 / 6, 'yellow'],
                            [3 / 6, 'green'],
                            [4 / 6, 'aqua'],
                            [5 / 6, 'blue'],
                            [1.00, 'white'],
                        ]
                    },
                    'polygonOpacity' : 1
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).to.be.painted();
                done();
            })
            v.addGeometry(circle);
        });

        it('line radial gradient', function (done) {
            var circle = new maptalks.Circle(center, 10, {
                symbol:{
                    'lineColor' : {
                        type : 'radial',
                        colorStops : [
                            [0.00, 'red'],
                            [1 / 6, 'orange'],
                            [2 / 6, 'yellow'],
                            [3 / 6, 'green'],
                            [4 / 6, 'aqua'],
                            [5 / 6, 'blue'],
                            [1.00, 'white'],
                        ]
                    },
                    'lineWidth' : 3,
                    'lineOpacity' : 1,
                    'polygonOpacity' : 0
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).not.to.be.painted();
                expect(v).to.be.painted(11);
                done();
            })
            v.addGeometry(circle);
        });

        it('vector marker', function (done) {
            var circle = new maptalks.Marker(center, {
                symbol:{
                    'markerType' : 'ellipse',
                    'markerLineColor' : {
                        type : 'radial',
                        colorStops : [
                            [0.00, 'red'],
                            [1 / 6, 'orange'],
                            [2 / 6, 'yellow'],
                            [3 / 6, 'green'],
                            [4 / 6, 'aqua'],
                            [5 / 6, 'blue'],
                            [1.00, 'white'],
                        ]
                    },
                    'markerLineWidth' : 3,
                    'markerFillOpacity' : 0,
                    'markerWidth' : 20,
                    'markerHeight' : 20
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).not.to.be.painted();
                expect(v).to.be.painted(11);
                done();
            })
            v.addGeometry(circle);
        });
    });


    describe('linear gradient', function () {

        it('fill linear gradient', function (done) {
            var circle = new maptalks.Circle(center, 10, {
                symbol:{
                    'polygonFill' : {
                        type : 'linear',
                        places : [0, 0, 0.5, 0],
                        colorStops : [
                            [0.00, 'red'],
                            [1 / 6, 'orange'],
                            [2 / 6, 'yellow'],
                            [3 / 6, 'green'],
                            [4 / 6, 'aqua'],
                            [5 / 6, 'blue'],
                            [1.00, 'white'],
                        ]
                    },
                    'polygonOpacity' : 1
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).to.be.painted(0, 0, [255, 255, 255]);
                done();
            })
            v.addGeometry(circle);
        });

        it('fill linear gradient 2', function (done) {
            var circle = new maptalks.Circle(center, 10, {
                symbol:{
                    'polygonFill' : {
                        type : 'linear',
                        colorStops : [
                            [0.00, 'red'],
                            [1 / 6, 'orange'],
                            [2 / 6, 'yellow'],
                            [3 / 6, 'green'],
                            [4 / 6, 'aqua'],
                            [5 / 6, 'blue'],
                            [1.00, 'white'],
                        ]
                    },
                    'polygonOpacity' : 1
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).to.be.painted();
                done();
            })
            v.addGeometry(circle);
        });
        it('line linear gradient', function (done) {
            var circle = new maptalks.Circle(center, 10, {
                symbol:{
                    'lineColor' : {
                        type : 'linear',
                        colorStops : [
                            [0.00, 'red'],
                            [1 / 6, 'orange'],
                            [2 / 6, 'yellow'],
                            [3 / 6, 'green'],
                            [4 / 6, 'aqua'],
                            [5 / 6, 'blue'],
                            [1.00, 'white'],
                        ]
                    },
                    'lineWidth' : 3,
                    'lineOpacity' : 1,
                    'polygonOpacity' : 0
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).to.be.painted(11);
                done();
            })
            v.addGeometry(circle);
        });

        it('vector marker', function (done) {
            var circle = new maptalks.Marker(center, {
                symbol:{
                    'markerType' : 'ellipse',
                    'markerFillColor' : {
                        type : 'linear',
                        colorStops : [
                            [0.00, 'red'],
                            [1 / 6, 'orange'],
                            [2 / 6, 'yellow'],
                            [3 / 6, 'green'],
                            [4 / 6, 'aqua'],
                            [5 / 6, 'blue'],
                            [1.00, 'white'],
                        ]
                    },
                    'markerFillOpacity' : 1,
                    'markerWidth' : 20,
                    'markerHeight' : 20,
                    'markerDx' : - 50
                }
            });
            var v = new maptalks.VectorLayer('v').addTo(map);
            v.once('layerload', function() {
                expect(v).to.be.painted(-50);
                done();
            })
            v.addGeometry(circle);
        });
    });
});
