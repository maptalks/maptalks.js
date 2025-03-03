describe('Geometry.Marker', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var canvasContainer;
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            width: 300,
            height: 200
        });
        container = setups.container;
        map = setups.map;
        map.config('centerCross', true);
        canvasContainer = map.getPanels().front;
        layer = new maptalks.VectorLayer('v').addTo(map);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('setCoordinates', function () {
        var marker = new maptalks.Marker([0, 0]);
        marker.setCoordinates([1, 1]);
        expect(marker.getCoordinates().toArray()).to.be.eql([1, 1]);
    });

    it('getCenter', function () {
        var marker = new maptalks.Marker({ x: 0, y: 0 });
        expect(marker.getCenter().toArray()).to.be.eql([0, 0]);
    });

    it('getExtent', function () {
        var marker = new maptalks.Marker({ x: 0, y: 0 });

        expect(marker.getExtent().toJSON()).to.be.eql({ xmin: 0, xmax: 0, ymin: 0, ymax: 0 });

    });

    it('get2dExtent', function () {
        var marker = new maptalks.Marker({ x: 0, y: 0 });
        layer.addGeometry(marker);
        var extent = marker._getPainter().get2DExtent();
        expect(extent).to.be.ok();
        marker.setCoordinates(map.getCenter());
        var extent2 = marker._getPainter().get2DExtent();
        expect(extent).not.to.eql(extent2);
    });

    it('getSize', function () {
        var marker = new maptalks.Marker(map.getCenter());
        layer.addGeometry(marker);
        var size = marker.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });

    it('updateSize', function () {
        var marker = new maptalks.Marker(map.getCenter(), {
            symbol: [{
                'markerType': 'ellipse',
                'markerWidth': 20,
                'markerHeight': 30,
            }]
        });
        layer.addGeometry(marker);
        var size = marker.getSize();

        marker.updateSymbol([{
            markerWidth: 10,
            markerHeight: 15
        }]);

        size = marker.getSize();
        expect(size.width).to.be.eql(12);
        expect(size.height).to.be.eql(17);
    });

    it('show/hide/isVisible', function () {
        var marker = new maptalks.Marker({ x: 0, y: 0 });
        layer.addGeometry(marker);
        marker.show();
        marker.hide();
        expect(marker.isVisible()).not.to.be.ok();
    });

    it('remove', function () {
        var marker = new maptalks.Marker({ x: 0, y: 0 });
        layer.addGeometry(marker);
        marker.remove();

        expect(marker.getLayer()).to.be(null);
    });

    describe('symbol', function () {

        beforeEach(function () {
            layer = new maptalks.VectorLayer('id', { 'drawImmediate': true });
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('can be icon', function (done) {
            var marker = new maptalks.Marker(center, {
                symbol: {
                    markerFile: 'resources/infownd-close-hover.png',
                    markerWidth: 30,
                    markerHeight: 22
                }
            });
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, -3);
                done();
            });
            layer.addGeometry(marker);
            expect(marker.getSize().toArray()).to.be.eql([30, 22]);
        });

        it('should draw icon marker with vector marker added, #2035', function (done) {
            var marker = new maptalks.Marker(center, {
                symbol: {
                    markerFile: 'resources/infownd-close-hover.png',
                    markerWidth: 30,
                    markerHeight: 22
                }
            });
            var vlayer = new maptalks.VectorLayer('id1', [marker], { 'drawImmediate': true }).addTo(map);
            vlayer.once('layerload', function () {
                expect(vlayer).to.be.painted(0, -3);
                done();
            });
            var marker1 = new maptalks.Marker(
                center.sub(0.009, 0),
                {
                    'symbol': {
                        'markerType': 'ellipse',
                        'markerWidth': 28,
                        'markerHeight': 40,
                        'markerDx': 0,
                        'markerDy': 100000,
                        'markerOpacity': 1
                    }
                }
            ).addTo(vlayer);
        });

        it('can be text', function () {
            var marker = new maptalks.Marker(center, {
                symbol: {
                    textName: '■■■■■■■■■',
                    textSize: 20,
                    textFill: '#000'
                }
            });

            layer.addGeometry(marker);
            expect(layer).to.be.painted(0, 0);
        });


        it('can be vector', function () {
            var types = ['ellipse', 'cross', 'x', 'diamond', 'bar', 'square', 'rectangle', 'triangle', 'pin', 'pie'];

            for (var i = 0; i < types.length; i++) {
                var marker = new maptalks.Marker(center, {
                    symbol: {
                        markerType: types[i],
                        markerLineDasharray: [20, 10, 5, 5, 5, 10],
                        markerWidth: 10,
                        markerHeight: 20
                    }
                });
                var layer = new maptalks.VectorLayer('id' + i, { 'drawImmediate': true }).addTo(map);
                layer.addGeometry(marker);
                if (types[i] === 'rectangle') {
                    expect(layer).to.be.painted(1, 1);
                } else {
                    expect(layer).to.be.painted(0, -1);
                }
                expect(marker.getSize().toArray()).to.be.eql([12, 22]);
                map.removeLayer(layer);
            }
        });

        it('can be vector with undefined size', function (done) {
            var marker = new maptalks.Marker(center, {
                symbol: {
                    markerType: 'ellipse'
                }
            });
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, 0);
                done();
            });
            layer.addGeometry(marker);
            expect(marker.getSize().toArray()).to.be.eql([12, 12]);
        });

        context('image marker with alignment', function () {
            it('bottom-right', function (done) {
                var marker = new maptalks.Marker(center, {
                    symbol: {
                        markerFile: 'resources/infownd-close-hover.png',
                        markerWidth: 30,
                        markerHeight: 22,
                        markerHorizontalAlignment: 'right',
                        markerVerticalAlignment: 'bottom',
                    }
                });
                layer.once('layerload', function () {
                    expect(layer).not.to.be.painted(0, -3);
                    expect(layer).to.be.painted(15, -3 + 22);
                    done();
                });
                layer.addGeometry(marker);
                expect(marker.getSize().toArray()).to.be.eql([30, 22]);
            });

            it('top-left', function (done) {
                var marker = new maptalks.Marker(center, {
                    symbol: {
                        markerFile: 'resources/infownd-close-hover.png',
                        markerWidth: 30,
                        markerHeight: 22,
                        markerHorizontalAlignment: 'left',
                        markerVerticalAlignment: 'top',
                    }
                });
                layer.once('layerload', function () {
                    expect(layer).to.be.painted(-15, -22);
                    expect(layer).not.to.be.painted(1, 0);
                    done();
                });
                layer.addGeometry(marker);
                expect(marker.getSize().toArray()).to.be.eql([30, 22]);
            });

            it('middle-middle', function (done) {
                var marker = new maptalks.Marker(center, {
                    symbol: {
                        markerFile: 'resources/infownd-close-hover.png',
                        markerWidth: 30,
                        markerHeight: 22,
                        markerHorizontalAlignment: 'middle',
                        markerVerticalAlignment: 'middle'
                    }
                });
                layer.once('layerload', function () {
                    expect(layer).to.be.painted(0, 0);
                    expect(layer).to.be.painted(5, 5);
                    expect(layer).to.be.painted(-5, -5);
                    done();
                });
                layer.addGeometry(marker);
                expect(marker.getSize().toArray()).to.be.eql([30, 22]);
            });

            it('multiple symbols with different alignments', function (done) {
                var marker = new maptalks.Label('■■■■■■■■■', center, {
                    'textSymbol': {
                        'textFaceName': 'monospace',
                        'textFill': '#fff',
                        'textLineSpacing': 1,
                        'textHorizontalAlignment': 'right',
                        'textDx': 15
                    },
                    'boxStyle': {
                        'padding': [6, 2],
                        'symbol': {
                            'markerType': 'square',
                            'markerFill': '#000',
                            'markerLineColor': '#b4b3b3'
                        }
                    }
                });
                layer.once('layerload', function () {
                    expect(layer).to.be.painted(11, 0, [0, 0, 0, 255]);
                    expect(layer).to.be.painted(20, 0, [255, 255, 255, 255]);
                    done();
                });
                layer.addGeometry(marker);
            });

        });

        context('vector marker with alignment', function () {
            it('ellipse', function (done) {
                var marker = new maptalks.Marker(center, {
                    symbol: {
                        markerType: 'ellipse',
                        markerWidth: 10,
                        markerHeight: 20,
                        markerHorizontalAlignment: 'right',
                        markerVerticalAlignment: 'bottom',
                    }
                });
                layer.once('layerload', function () {
                    expect(layer).not.to.be.painted(0, 0);
                    expect(layer).not.to.be.painted(-2, 10);
                    expect(layer).to.be.painted(0, 10);
                    expect(layer).to.be.painted(5, 10);
                    expect(layer).not.to.be.painted(5, -2);
                    expect(layer).to.be.painted(5, 0);
                    done();
                });
                layer.addGeometry(marker);
                expect(marker.getSize().toArray()).to.be.eql([12, 22]);
            });

            it('pin', function (done) {
                var marker = new maptalks.Marker(center, {
                    symbol: {
                        markerType: 'pin',
                        markerWidth: 10,
                        markerHeight: 20,
                        markerHorizontalAlignment: 'right',
                        markerVerticalAlignment: 'bottom',
                    }
                });
                layer.once('layerload', function () {
                    expect(layer).not.to.be.painted(-2, -2);
                    expect(layer).to.be.painted(5, 10);
                    done();
                });
                layer.addGeometry(marker);
                expect(marker.getSize().toArray()).to.be.eql([12, 22]);
            });

            it('rectangle', function (done) {
                var marker = new maptalks.Marker(center, {
                    symbol: {
                        markerType: 'rectangle',
                        markerWidth: 10,
                        markerHeight: 20,
                        'markerVerticalAlignment': 'middle',
                        'markerHorizontalAlignment': 'middle'
                    }
                });
                layer.once('layerload', function () {
                    expect(layer).to.be.painted(-5, -10);
                    expect(layer).not.to.be.painted(5, 9);
                    done();
                });
                layer.addGeometry(marker);
                expect(marker.getSize().toArray()).to.be.eql([12, 22]);
            });
        });

    });

    describe('set marker\'s Symbol', function () {

        it('fires symbolchange event', function () {
            var spy = sinon.spy();
            var marker = new maptalks.Marker(center);
            marker.on('symbolchange', spy);
            marker.setSymbol({
                'markerType': 'ellipse',
                'markerLineColor': '#ff0000',
                'markerFill': '#ffffff',
                'markerFillOpacity': 0.6,
                'markerHeight': 8,
                'markerWidth': 8
            });

            expect(spy.called).to.be.ok();
        });

        it('unsuppored markerType', function () {
            var layer = new maptalks.VectorLayer('vector', { 'drawImmediate': true });
            map.addLayer(layer);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    'markerType': 'unsupported',
                    'markerWidth': 20,
                    'markerHeight': 30
                }
            });
            expect(function () {
                layer.addGeometry(marker);
            }).to.throwException();
        });

        it('change symbol in event listener', function (done) {
            var marker = new maptalks.Marker(map.getCenter());
            var layer = new maptalks.VectorLayer('vector', [marker]);
            marker.on('click', function (e) {
                layer.once('layerload', function () {
                    expect(layer).to.be.painted(0, 0, [0, 255, 0]);
                    done();
                });
                e.target.setSymbol({
                    'markerType': 'ellipse',
                    'markerFill': '#0f0',
                    'markerWidth': 20,
                    'markerHeight': 20
                });
            });
            layer.once('layerload', function () {
                marker._fireEvent('click');
            });
            map.addLayer(layer);
        });

        it('change marker file by updateSymbol', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    'markerFile': 'resources/tile-256.png'
                }
            });
            var layer = new maptalks.VectorLayer('vector', [marker]);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(100, -1);
                layer.once('layerload', function () {
                    expect(layer).not.to.be.painted(50, -1);
                    expect(layer).to.be.painted(5, -1);
                    done();
                });
                marker.updateSymbol({
                    'markerFile': 'resources/pattern.png'
                });
            });
            layer.addTo(map);
        });

    });

    describe('events', function () {
        it('canvas events', function () {
            var vector = new maptalks.Marker(center);
            new COMMON_GEOEVENTS_TESTOR().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    it('can have various symbols', function (done) {
        var vector = new maptalks.Marker(center);
        COMMON_SYMBOL_TESTOR.testGeoSymbols(vector, map, done);
    });

    it('Marker.containsPoint', function () {

        var geometry = new maptalks.Marker(center, {
            symbol: {
                markerFile: 'resources/infownd-close-hover.png',
                markerHeight: 30,
                markerWidth: 22,
                dx: 0,
                dy: 0
            }
        });
        layer = new maptalks.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(geometry);

        var spy = sinon.spy();
        geometry.on('click', spy);
        //TODO 因为marker的width和height为0, 所以无法击中
        happen.click(canvasContainer, {
            clientX: 400 + 8,
            clientY: 300 + 8
        });

        //expect(spy.called).to.be.ok();
    });

    it('get image marker\'s extent', function (done) {
        var geometry = new maptalks.Marker(map.getExtent().getMin().substract(1E-7, 0), {
            symbol: {
                markerFile: 'resources/infownd-close-hover.png'
            }
        });
        layer = new maptalks.VectorLayer('id').addGeometry(geometry);
        layer.on('layerload', function () {
            expect(layer.getRenderer()._geosToDraw.length).to.be.ok();
            done();
        });
        map.addLayer(layer);
    });

    it('vector marker size with shadowBlur', function () {
        var marker = new maptalks.Marker(map.getCenter(), {
            symbol: {
                markerType: 'ellipse',
                markerWidth: 40,
                markerHeight: 40,
                shadowBlur: 20
            }
        });
        var layer = new maptalks.VectorLayer('id', { 'drawImmediate': true }).addTo(map);
        layer.addGeometry([marker]);
        var size = marker.getSize();
        expect(size.width).to.be.above(60);
        expect(size.height).to.be.above(60);


        var fixedExtent = marker._getPainter().getFixedExtent();
        expect(fixedExtent.getWidth()).to.be.above(60);
        expect(fixedExtent.getHeight()).to.be.above(60);
    });

    describe('function type symbols', function () {
        it('vector marker\'s size changes with zoom', function (done) {
            map.config('zoomAnimation', false);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    markerType: 'ellipse',
                    markerWidth: { stops: [[7, 8], [14, 20]] },
                    markerHeight: { stops: [[7, 8], [14, 20]] }
                }
            });
            var layer = new maptalks.VectorLayer('id', { 'drawImmediate': true }).addTo(map);
            layer.addGeometry([marker]);
            expect(layer).to.be.painted(10, 0);
            map.setZoom(7);
            map.on('renderend', function () {
                expect(layer).not.to.be.painted(10, 0);
                expect(layer).not.to.be.painted(5, 0);
                expect(layer).to.be.painted(4, 0);
                done();
            });
        });

        it('vector marker\'s dx, dy with zoom', function (done) {
            map.config('zoomAnimation', false);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    markerType: 'ellipse',
                    markerWidth: 10,
                    markerHeight: 10,
                    markerDx: { stops: [[7, 8], [14, 20]] },
                    markerDy: { stops: [[7, 8], [14, 20]] },

                    shadowBlur: 2
                }
            });
            var layer = new maptalks.VectorLayer('id', { 'drawImmediate': true }).addTo(map);
            layer.addGeometry([marker]);
            expect(layer).to.be.painted(21, 21);
            map.setZoom(7);
            map.on('renderend', function () {
                expect(layer).not.to.be.painted(21, 21);
                expect(layer).to.be.painted(13, 9);
                done();
            });
        });

        it('text marker\'s size changes with zoom', function (done) {
            map.config('zoomAnimation', false);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    textName: '■■■■■■■■■',
                    textSize: { stops: [[7, 8], [14, 20]] },
                    textFill: '#000'
                }
            });
            var layer = new maptalks.VectorLayer('id', { 'drawImmediate': true }).addTo(map);
            layer.addGeometry([marker]);
            expect(layer).to.be.painted(52, 0);
            map.setZoom(7);
            map.on('renderend', function () {
                expect(layer).not.to.be.painted(52, 0);
                if (maptalks.Browser.ie) {
                    // font is smaller with ie
                    expect(layer).to.be.painted(20, 0);
                } else if (maptalks.Browser.gecko3d) {
                    expect(layer).to.be.painted(20, -1);
                } else {
                    expect(layer).to.be.painted(20, 0);
                }

                done();
            });
        });

        it('text dx dy changes with zoom', function (done) {
            map.config('zoomAnimation', false);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    textName: '■■■■■■■■■',
                    textSize: 20,
                    textFill: '#000',
                    textDx: { stops: [[7, 8], [14, 20]] },
                    textDy: { stops: [[7, 8], [14, 20]] }
                }
            });
            var layer = new maptalks.VectorLayer('id', { 'drawImmediate': true }).addTo(map);
            layer.addGeometry([marker]);
            expect(layer).to.be.painted(72, 20);
            map.setZoom(7);
            map.on('renderend', function () {
                expect(layer).not.to.be.painted(72, 20);
                if (maptalks.Browser.ie) {
                    // font is smaller with ie
                    expect(layer).to.be.painted(10, 12);
                } else if (maptalks.Browser.gecko3d) {
                    expect(layer).to.be.painted(10, 8);
                } else {
                    expect(layer).to.be.painted(10, 10);
                }

                done();
            });
        });

        it('text marker redraws when properties updated', function () {
            map.config('zoomAnimation', false);
            var marker = new maptalks.Marker(map.getCenter(), {
                properties: {
                    text: '■■■■■■■■■'
                },
                symbol: {
                    textName: '{text}',
                    textSize: { stops: [[7, 8], [14, 20]] },
                    textFill: '#000'
                }
            });
            var layer = new maptalks.VectorLayer('id', { 'drawImmediate': true }).addTo(map);
            layer.addGeometry([marker]);
            expect(layer).to.be.painted(52, 0);
            marker.setProperties({
                text: '1'
            });
            expect(layer).not.to.be.painted(52, 0);
            marker.config('properties', {
                text: '■■■■■■■■■'
            });
            expect(layer).to.be.painted(52, 0);
        });

        it('vector path marker color with identity', function (done) {
            if (maptalks.Browser.ie) {
                done();
                return;
            }
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    'markerType': 'path',
                    'markerPath': [{
                        'path': 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M3,9 a5,5 0,1,0,0,-0.9Z',
                        'fill': '#DE3333'
                    }],
                    'markerPathWidth': 16,
                    'markerPathHeight': 23,
                    'markerWidth': 8,
                    'markerHeight': 20,
                    'markerFill': {
                        type: 'identity',
                        property: 'color'
                    }
                },
                properties: {
                    color: '#ff0'
                }
            });
            var layer = new maptalks.VectorLayer('vector', marker);
            var count = 0;
            layer.on('layerload', function () {
                count++;
                // change from 2 to 3 as CanvasRenderer has one more setToRedraw
                if (count === 3) {
                    expect(layer).to.be.painted(0, -3, [255, 255, 0]);
                    done();
                }

            })
                .addTo(map);

        });

        it('#2511 vector marker with function-type getFixedExtent', function (done) {
            map.config('zoomAnimation', false);
            var marker = new maptalks.Marker(map.getCenter(), {
                properties: { name: '1111' },
                // symbol: {
                //     markerType: "ellipse",
                //     markerWidth: 50,
                //     markerHeight: 50
                // },
                symbol: [
                    {
                        markerType: "ellipse",
                        // markerWidth: 50,
                        // markerHeight: 50,
                        markerWidth: {
                            stops: [
                                [1, 10],
                                [17, 60],
                            ],
                        },
                        markerHeight: {
                            stops: [
                                [1, 10],
                                [17, 60],
                            ],
                        },
                        markerDy: {
                            stops: [
                                [1, -2],
                                [17, -80],
                            ],
                        },
                        markerFill: {
                            type: "radial",
                            colorStops: [
                                [0.0, "rgba(216,115,149,0)"],
                                [0.5, "rgba(216,115,149,0.7)"],
                                [1.0, "rgba(216,115,149,1)"],
                            ],
                        },
                        markerLineWidth: 1,
                    },

                ]
            });
            var layer = new maptalks.VectorLayer('id', { 'drawImmediate': true }).addTo(map);
            layer.addGeometry([marker]);

            setTimeout(() => {
                const extent = marker._getPainter().getFixedExtent();
                const { xmin, ymin, xmax, ymax } = extent;
                expect(Math.floor(xmin)).to.be.eql(-31);
                // eslint-disable-next-line no-undef
                if (isWindows()) {
                    expect(Math.floor(xmax)).to.be.eql(29);
                    expect(Math.floor(ymin)).to.be.eql(-105);
                    expect(Math.floor(ymax)).to.be.eql(-46);
                } else {
                    expect(Math.floor(xmax)).to.be.eql(31);
                    expect(Math.floor(ymin)).to.be.eql(-111);
                    expect(Math.floor(ymax)).to.be.eql(-49);
                }
                done();
            }, 1000);


        });
    });

    describe('marker rotation', function () {
        it('rotate image marker', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    'markerFile': 'resources/tile.png',
                    'markerWidth': 8,
                    'markerHeight': 20,
                    'markerRotation': 45
                }
            });
            var layer = new maptalks.VectorLayer('vector', marker);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(0, -9);
                expect(layer).to.be.painted(-5, -5);
                done();
            })
                .addTo(map);
        });

        it('rotate image marker with map', function (done) {
            if (maptalks.Browser.ie) {
                done();
                return;
            }
            map.setBearing(45);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    'markerFile': 'resources/tile.png',
                    'markerWidth': 10,
                    'markerHeight': 20,
                    'markerRotation': {
                        property: '{bearing}',
                        type: 'identity'
                    }
                }
            });
            var layer = new maptalks.VectorLayer('vector', marker);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(-5, -5);
                expect(layer).not.to.be.painted(5, 5);
                done();
            })
                .addTo(map);
        });

        it('rotate vector marker', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    'markerType': 'bar',
                    'markerWidth': 8,
                    'markerHeight': 20,
                    'markerRotation': 45
                }
            });
            var layer = new maptalks.VectorLayer('vector', marker);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(0, -9);
                expect(layer).to.be.painted(-5, -5);
                done();
            })
                .addTo(map);
        });

        it('rotate vector path marker', function (done) {
            if (maptalks.Browser.ie || maptalks.Browser.gecko) {
                // skip test with IE due to Security Error
                done();
                return;
            }
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    'markerType': 'path',
                    'markerPath': [{
                        'path': 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M3,9 a5,5 0,1,0,0,-0.9Z',
                        'fill': '#DE3333'
                    }],
                    'markerPathWidth': 16,
                    'markerPathHeight': 23,
                    'markerWidth': 8,
                    'markerHeight': 20,
                    'markerRotation': 45
                }
            });
            var layer = new maptalks.VectorLayer('vector', marker);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(0, -9);
                expect(layer).to.be.painted(-5, -5);
                done();
            })
                .addTo(map);
        });

        it('rotate text marker', function (done) {
            if (maptalks.Browser.ie) {
                done();
                return;
            }
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    textName: '■■■■■■■■■',
                    textSize: 20,
                    textFill: '#000',
                    textRotation: 45
                }
            });
            var layer = new maptalks.VectorLayer('vector', marker);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(12, 0);
                expect(layer).to.be.painted(11, -11);
                done();
            })
                .addTo(map);
        });

        it('rotate text marker with map', function (done) {
            if (maptalks.Browser.ie) {
                done();
                return;
            }
            map.setBearing(45);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    textName: '■■■■■■■■■',
                    textSize: 20,
                    textFill: '#000',
                    textRotation: {
                        type: 'identity',
                        property: '{bearing}'
                    }
                }
            });
            var layer = new maptalks.VectorLayer('vector', marker);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(15, -15);
                expect(layer).not.to.be.painted(-11, -11);
                done();
            })
                .addTo(map);
        });

        it('rotate text marker with dx dy', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    textName: '■■■■■■■■■',
                    textSize: 20,
                    textFill: '#000',
                    textRotation: 45,
                    textDx: 50,
                    textDy: 50
                }
            });
            var layer = new maptalks.VectorLayer('vector', marker);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(11, 0);
                expect(layer).not.to.be.painted(-11, -11);
                if (maptalks.Browser.gecko3d) {
                    expect(layer).to.be.painted(104, -35);
                } else {
                    expect(layer).to.be.painted(110, -35);
                }

                done();
            })
                .addTo(map);
        });

        it('rotate text marker outline', function () {
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol: {
                    textName: '■■■■■■■■■',
                    textSize: 20,
                    textFill: '#000',
                    textRotation: 45,
                    textDx: 50,
                    textDy: 50
                }
            });
            var layer = new maptalks.VectorLayer('vector', marker, { 'drawImmediate': true }).addTo(map);
            var outline = marker.getOutline().updateSymbol({ markerFill: '#0f0' }).addTo(layer);
            // expect(layer).to.not.be.painted();
            expect(layer).to.be.painted(50, -10, [0, 255, 0]);
        });
    });


    describe('rotate the geometry', function () {
        it('without a pivot', function () {
            var marker = new maptalks.Marker(map.getCenter());
            marker.rotate(10);
            expect(marker.getCoordinates().toArray()).to.be.eql(map.getCenter().toArray());
        });

        it('with a pivot', function () {
            var marker = new maptalks.Marker(map.getCenter());
            marker.rotate(10, map.getCenter().sub(1, 1));
            var newCoords = marker.getCoordinates().toArray();
            expect(newCoords).to.be.eql([118.62842615841328, 32.17932019575247]);
        });
    });

    //https://github.com/maptalks/issues/issues/422
    it('marker size when textSize missing', function (done) {
        const texts = ['Maptalks', 'Hello\nWorld', Math.random() * 100, '中国人', '没有设置textSize时', '没有设置textSize时\nmarker的getSize方法返回的值不正确 '];
        function createMaker(text, textSize) {
            const symbol = {
                textName: text,
                textFill: 'red',
                textSize: textSize
            };
            if (!symbol.textSize) {
                delete symbol.textSize;
            }
            return new maptalks.Marker(map.getCenter(), {
                symbol
            });
        }

        function getMarkerWidth(marker) {
            return Math.round(marker.getSize().width);
        }

        texts.forEach(text => {
            layer.clear();
            const marker1 = createMaker(text, 14);
            marker1.addTo(layer);
            const marker2 = createMaker(text);
            marker2.addTo(layer);
            const w1 = getMarkerWidth(marker1);
            const w2 = getMarkerWidth(marker2);
            expect(w1).to.be.eql(w2);
        });
        done();
    });

    it('#2175 marker ContainerExtent when markerWidth/markerHeight/textSize =0', function (done) {
        const imageSymbol = {
            markerWidth: 10,
            markerHeight: 10,
            'markerFile': 'resources/tile.png',
        };

        const pathSymbol = {
            'markerType': 'path',
            'markerPath': [{
                'path': 'M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M3,9 a5,5 0,1,0,0,-0.9Z',
                'fill': '#DE3333'
            }],
            'markerPathWidth': 16,
            'markerPathHeight': 23,
            'markerWidth': 8,
            'markerHeight': 20,
        };

        const vectorSymbol = {
            markerType: 'ellipse',
            markerWidth: 10,
            markerHeight: 10
        };

        const textSymbol = {
            textSize: 12,
            textName: 'hello'
        };

        const symbols = [imageSymbol, pathSymbol, vectorSymbol, textSymbol];

        let idx = 0;

        function test() {
            layer.clear();
            if (idx < symbols.length) {
                const symbol = symbols[idx];
                const isText = symbol.textSize !== undefined;
                const point = new maptalks.Marker(map.getCenter(), {
                    symbol: symbol
                })
                point.addTo(layer);
                setTimeout(() => {
                    const extent = point.getContainerExtent();
                    expect(extent.getWidth()).not.to.be.eql(0);
                    expect(extent.getHeight()).not.to.be.eql(0);

                    if (isText) {
                        symbol.textSize = 0;
                        point.setSymbol(symbol)
                    } else {
                        symbol.markerWidth = 0;
                        point.setSymbol(symbol)
                    }

                    setTimeout(() => {
                        const extent = point.getContainerExtent();
                        expect(extent.getWidth()).to.be.eql(0);
                        expect(extent.getHeight()).to.be.eql(0);
                        idx++;
                        test();
                    }, 50);
                }, 50);
            } else {
                done();
            }
        }
        test();
    });
});
