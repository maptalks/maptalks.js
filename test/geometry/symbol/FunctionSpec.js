
describe('FunctionTypeSpec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        layer = new maptalks.VectorLayer('id').addTo(map);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    function interpolateSymbol(geo, symbol) {
        var result;
        if (Array.isArray(symbol)) {
            result = [];
            for (var i = 0; i < symbol.length; i++) {
                result.push(interpolateSymbol(symbol[i]));
            }
            return result;
        }
        result = {};
        for (var p in symbol) {
            if (symbol.hasOwnProperty(p)) {
                if (maptalks.MapboxUtil.isFunctionDefinition(symbol[p])) {
                    if (!geo.getMap()) {
                        result[p] = null;
                    } else {
                        result[p] = maptalks.MapboxUtil.interpolated(symbol[p])(geo.getMap().getZoom(), geo.getProperties());
                    }
                } else {
                    result[p] = symbol[p];
                }
            }
        }
        return result;
    }

    it('markerWidth interpolating with zoom', function (done) {
        var marker = new maptalks.Marker([100, 0], {
            symbol: {
                'markerFile': 'resources/x.svg',
                'markerWidth': { stops: [[1, 1], [5, 10]] },
                'markerHeight': 30
            }
        });
        layer.once('layerload', function () {
            expect(marker.getMap()).to.be.ok();
            expect(marker.getSize().width).to.be.eql(10);
            done();
        });
        layer.addGeometry(marker);
    });

    it('markerWidth interpolating with properties', function (done) {
        var marker = new maptalks.Marker([100, 0], {
            symbol: {
                'markerFile': 'resources/x.svg',
                'markerWidth': { property: 'foo', stops: [[1, 1], [5, 10], [18, 20]] },
                'markerHeight': 30
            },
            properties: {
                'foo': 2
            }
        });
        layer.once('layerload', function () {
            expect(marker.getMap()).to.be.ok();
            expect(marker.getSize().width).to.be.eql(3.25);
            done();
        });
        layer.addGeometry(marker);
    });

    it('markerWidth with default value', function (done) {
        var marker = new maptalks.Marker([100, 0], {
            symbol: {
                'markerFile': 'resources/x.svg',
                'markerWidth': { property: 'foo', type: 'identity', stops: [[1, 1], [5, 10], [18, 20]], default: 30 },
                'markerHeight': 30
            }
        });
        layer.once('layerload', function () {
            expect(marker.getMap()).to.be.ok();
            expect(marker.getSize().width).to.be.eql(30);
            done();
        });
        layer.addGeometry(marker);
    });

    it('markerWidth with categorical type and default value', function (done) {
        var marker = new maptalks.Marker([100, 0], {
            symbol: {
                'markerFile': 'resources/x.svg',
                'markerWidth': { property: 'foo', type: 'categorical', stops: [[1, 1], [5, 10], [18, 20]], default: 30 },
                'markerHeight': 30
            }
        });
        layer.once('layerload', function () {
            expect(marker.getMap()).to.be.ok();
            expect(marker.getSize().width).to.be.eql(30);
            done();
        });
        layer.addGeometry(marker);
    });

    it('markerWidth interpolating with properties', function () {
        var marker = new maptalks.Marker([100, 0], {
            symbol: {
                'markerType': 'ellipse',
                'markerWidth': 20,
                'markerHeight': 30,
                'markerFill': { property: 'foo', type: 'interval', stops: [[1, 'red'], [5, 'blue'], [18, 'green']] }
            },
            properties: {
                'foo': 3
            }
        });
        layer.addGeometry(marker);
        var s = interpolateSymbol(marker, marker.getSymbol());
        expect(s.markerFill).to.be.eql('red');
    });

    it('markerWidth interpolating with non-existed properties', function (done) {
        var marker = new maptalks.Marker([100, 0], {
            symbol: {
                'markerFile': 'resources/x.svg',
                'markerWidth': { property: 'foo1', stops: [[1, 1], [5, 10], [18, 20]] },
                'markerHeight': 30
            },
            properties: {
                'foo': 1
            }
        });
        layer.once('layerload', function () {
            expect(marker.getMap()).to.be.ok();
            expect(marker.getSize().width).to.be.eql(20);
            done();
        });
        layer.addGeometry(marker);
    });

    it('markerWidth interpolating with properties and zoom together', function (done) {
        var marker = new maptalks.Marker([100, 0], {
            symbol: {
                'markerFile': 'resources/x.svg',
                'markerWidth': {
                    property: 'foo',
                    stops: [
                        [{ zoom: 1, value: 1 }, 15],
                        [{ zoom: map.getZoom(), value: 5 }, 18],
                        [{ zoom: 18, value: 18 }, 20]
                    ]
                },
                'markerHeight': 30
            },
            properties: {
                'foo': 5
            }
        });
        layer.once('layerload', function () {
            expect(marker.getMap()).to.be.ok();
            expect(marker.getSize().width).to.be.eql(18);
            done();
        });
        layer.addGeometry(marker);
    });

    it('markerWidth without adding on a map', function () {
        var marker = new maptalks.Marker([100, 0], {
            symbol: {
                'markerFile': 'resources/x.svg',
                'markerWidth': { stops: [[1, 1], [5, 10]] },
                'markerHeight': 30
            }
        });
        var s = interpolateSymbol(marker, marker.getSymbol());
        expect(s.markerWidth).not.to.be.ok();
    });

    it('markerFill with color-interpolate function type', function (done) {
        var marker = new maptalks.Marker([100, 0], {
            properties: {
                value: 1
            },
            symbol: {
                'markerType': 'ellipse',
                'markerFill': {
                    property: 'value',
                    stops: [[0, 'red'], [5, 'black'], [10, 'white']],
                    type: 'color-interpolate'
                },
                'markerHeight': 30
            }
        });
        layer.once('layerload', function () {
            var s = interpolateSymbol(marker, marker.getSymbol());
            expect(s.markerFill).to.be.eql([0.788235294117647, 0, 0, 1]);
            done();
        });
        layer.addGeometry(marker);

    });

    it('interpolate a composite symbol', function (done) {
        var marker = new maptalks.Marker([100, 0], {
            symbol: [
                {
                    'markerFile': 'resources/x.svg',
                    'markerWidth': {
                        property: 'foo',
                        stops: [
                            [{ zoom: 1, value: 1 }, 15],
                            [{ zoom: map.getZoom(), value: 5 }, 18],
                            [{ zoom: 18, value: 18 }, 20]
                        ]
                    },
                    'markerHeight': 30
                },
                {
                    'markerFile': 'resources/x.svg',
                    'markerWidth': 10,
                    'markerHeight': {
                        property: 'foo',
                        stops: [
                            [{ zoom: 1, value: 1 }, 15],
                            [{ zoom: map.getZoom(), value: 5 }, 40],
                            [{ zoom: 18, value: 18 }, 20]
                        ]
                    },
                }

            ],
            properties: {
                'foo': 5
            }
        });
        layer.once('layerload', function () {
            expect(marker.getMap()).to.be.ok();
            expect(marker.getSize().width).to.be.eql(18);
            expect(marker.getSize().height).to.be.eql(40);
            done();
        });
        layer.addGeometry(marker);
    });

    it('symbol.visible function-type', function (done) {
        const symbol1 = {
            markerWidth: 20,
            markerHeight: 20,
            markerType: 'ellipse',
        }

        const symbol2 = Object.assign({}, symbol1, {
            visible: false
        });

        const symbol3 = Object.assign({}, symbol1, {
            visible: {
                stops: [
                    [1, false],
                    [15.0, true],
                    [18.1, false],
                    [Infinity, false],
                ],
                type: "interval",
            }
        });

        function test1(cb) {
            const marker = new maptalks.Marker(map.getCenter(), {
                symbol: symbol1
            });
            layer.addGeometry(marker);
            setTimeout(() => {
                expect(marker.isVisible()).to.be.eql(true);
                expect(layer).to.be.painted(0, 0);
                cb();
            }, 100);
        }

        function test2(cb) {
            const marker = new maptalks.Marker(map.getCenter(), {
                symbol: symbol2
            });
            layer.addGeometry(marker);

            setTimeout(() => {
                expect(marker.isVisible()).to.be.eql(false);
                expect(layer).not.to.be.painted(0, 0);
                cb();
            }, 100);
        }

        function test3(cb) {

            const marker = new maptalks.Marker(map.getCenter(), {
                symbol: symbol3
            });
            layer.addGeometry(marker);

            map.setZoom(16);
            setTimeout(() => {
                expect(marker.isVisible()).to.be.eql(true);
                expect(layer).to.be.painted(0, 0);
                map.setZoom(12);
                setTimeout(() => {
                    expect(marker.isVisible()).to.be.eql(false);
                    expect(layer).not.to.be.painted(0, 0);

                    map.setZoom(19);

                    setTimeout(() => {
                        expect(marker.isVisible()).to.be.eql(false);
                        expect(layer).not.to.be.painted(0, 0);
                        cb();
                    }, 100);
                }, 100);
            }, 100);
        }

        function test4(cb) {

            const marker = new maptalks.Marker(map.getCenter(), {
                symbol: [symbol1, symbol2]
            });
            layer.addGeometry(marker);

            setTimeout(() => {
                expect(marker.isVisible()).to.be.eql(true);
                expect(layer).to.be.painted(0, 0);
                cb();
            }, 100);
        }

        function test5(cb) {

            const marker = new maptalks.Marker(map.getCenter(), {
                symbol: [symbol1, symbol3]
            });
            layer.addGeometry(marker);

            setTimeout(() => {
                expect(marker.isVisible()).to.be.eql(true);
                expect(layer).to.be.painted(0, 0);
                cb();
            }, 100);
        }

        function test6(cb) {
            map.setZoom(16);
            const marker = new maptalks.Marker(map.getCenter(), {
                symbol: [symbol2, symbol3]
            });
            layer.addGeometry(marker);

            setTimeout(() => {
                expect(marker.isVisible()).to.be.eql(true);
                expect(layer).to.be.painted(0, 0);

                map.setZoom(12);

                setTimeout(() => {
                    expect(marker.isVisible()).to.be.eql(false);
                    expect(layer).not.to.be.painted(0, 0);

                    map.setZoom(19);

                    setTimeout(() => {
                        expect(marker.isVisible()).to.be.eql(false);
                        expect(layer).not.to.be.painted(0, 0);
                        cb();
                    }, 100);
                }, 100);
            }, 100);
        }

        const tests = [test1, test2, test3, test4, test5, test6];
        let idx = 0;

        function loop() {
            if (idx < test.length) {
                layer.clear();
                tests[idx](() => {
                    idx++;
                    loop();
                })
            } else {
                done();
            }
        }

        loop();
    });
});
