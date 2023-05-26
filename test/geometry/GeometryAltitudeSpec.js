describe('Geometry.Altitude', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, {
            width: 800,
            height: 600
        });
        container = setups.container;
        map = setups.map;
        map.config('centerCross', true);
        layer = new maptalks.VectorLayer('id', { 'enableAltitude': true });
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('render geometry with altitude', function () {
        it('circle', function (done) {
            var circle = new maptalks.Circle(map.getCenter(), 10, {
                properties: { altitude: 200 },
                symbol: {
                    'polygonFill': '#f00'
                }
            });
            layer.addGeometry(circle);
            map.setPitch(60);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(0, 0);
                expect(layer).to.be.painted(0, -219);
                done();
            });
            map.addLayer(layer);
        });

        it('marker', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                properties: { altitude: 100 },
                symbol: {
                    'markerType': 'ellipse',
                    'markerHeight': 10,
                    'markerWidth': 10
                }
            });
            layer.addGeometry(marker);
            map.setPitch(60);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(0, 0);
                expect(layer).to.be.painted(0, -103);
                done();
            });
            map.addLayer(layer);
        });
    });

    describe('draw altitude', function () {
        it('draw altitude of line string', function (done) {
            map.setPitch(60);
            var center = map.getCenter();
            layer.config('drawAltitude', {
                lineWidth: 5,
                lineColor: '#000',
                polygonFill: '#000'
            });
            var line = new maptalks.LineString([center.sub(0.001, 0), center.add(0.001, 0)], {
                properties: { altitude: 20 },
                symbol: {
                    'polygonFill': '#f00'
                }
            });
            layer.addGeometry(line);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, -2, [0, 0, 0]);
                expect(layer).to.be.painted(0, -10, [0, 0, 0]);
                done();
            });
            map.addLayer(layer);
        });

        it('draw linestring with altitude array', function (done) {
            map.setPitch(60);
            map.setBearing(60);
            var center = map.getCenter();
            layer.config('drawAltitude', {
                lineWidth: 5,
                lineColor: '#000',
                polygonFill: '#000'
            });
            var line = new maptalks.LineString([center.sub(0.001, 0), center.add(0.001, 0)], {
                properties: { altitude: [40, 20] },
                symbol: {
                    'polygonFill': '#f00'
                }
            });
            layer.addGeometry(line);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(50, -30);
                expect(layer).to.be.painted(35, -40, [0, 0, 0]);
                expect(layer).to.be.painted(-40, 30, [0, 0, 0]);
                done();
            });
            map.addLayer(layer);
        });

        it('draw linestring with altitude array in large zoom', function (done) {
            map.setPitch(60);
            map.setBearing(60);
            map.setZoom(19, { animation: false });
            var center = map.getCenter();
            layer.config('drawAltitude', {
                lineWidth: 5,
                lineColor: '#000',
                polygonFill: '#000'
            });
            var line = new maptalks.LineString([center.sub(0.001, 0), center.add(0.001, 0), center.add(0.001, -0.001)], {
                properties: { altitude: [200, 100, 300] },
                symbol: {
                    'polygonFill': '#f00'
                }
            });
            layer.addGeometry(line);
            layer.once('layerload', function () {
                expect(layer).not.to.be.painted(10, 10);
                expect(layer).to.be.painted(-360, -290, [0, 0, 0]);
                expect(layer).to.be.painted(340, -270, [0, 0, 0]);
                expect(layer).to.be.painted(-260, 210, [0, 0, 0]);
                done();
            });
            map.addLayer(layer);
        });

        it('draw altitude of line string with texts', function (done) {
            map.setPitch(60);
            map.config('centerCross', true);
            var center = map.getCenter();
            layer.config('drawAltitude', {
                lineWidth: 5,
                lineColor: '#000',
                polygonFill: '#000'
            });
            var line = new maptalks.LineString([center, center.add(0.001, 0)], {
                properties: { altitude: [0, 40] },
                symbol: {
                    'polygonFill': '#f00',
                    'textName': '■■■■■■■■■',
                    'textFill': '#f00',
                    'textPlacement': 'vertex'
                }
            });
            layer.addGeometry(line);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, 1/* , [255, 0, 0] */); // vertex text
                expect(layer).to.be.painted(40, -10, [0, 0, 0]);
                done();
            });
            map.addLayer(layer);
        });

        context('altitude of different text placement', function () {
            it('vertex-first', function (done) {
                map.setPitch(70);
                map.config('centerCross', true);
                var center = map.getCenter();
                var line = new maptalks.LineString([center, center.add(0.001, 0)], {
                    properties: { altitude: [0, 40] },
                    symbol: {
                        'polygonFill': '#f00',
                        'textName': '■■■■■■■■■',
                        'textPlacement': 'vertex-first',
                        'textFill': '#f00'
                    }
                });
                layer.addGeometry(line);
                layer.once('layerload', function () {
                    expect(layer).to.be.painted(0, 1);
                    done();
                });
                map.addLayer(layer);
            });

            it('line', function (done) {
                map.setPitch(70);
                map.config('centerCross', true);
                var center = map.getCenter();
                var line = new maptalks.LineString([center, center.add(0.001, 0)], {
                    properties: { altitude: [0, 40] },
                    symbol: {
                        'polygonFill': '#f00',
                        'textName': '■■■■■■■■■',
                        'textPlacement': 'line',
                        'textFill': '#f00'
                    }
                });
                layer.addGeometry(line);
                layer.once('layerload', function () {
                    expect(layer).to.be.painted(50, -16);
                    done();
                });
                map.addLayer(layer);
            });

            it('vertex-last', function (done) {
                map.setPitch(70);
                map.config('centerCross', true);
                var center = map.getCenter();
                var line = new maptalks.LineString([center, center.add(0.001, 0)], {
                    properties: { altitude: [0, 40] },
                    symbol: {
                        'polygonFill': '#f00',
                        'textName': '■■■■■■■■■',
                        'textPlacement': 'vertex-last',
                        'textFill': '#f00'
                    }
                });
                layer.addGeometry(line);
                layer.once('layerload', function () {
                    expect(layer).to.be.painted(86, -40);
                    done();
                });
                map.addLayer(layer);
            });

        });

        it('draw altitude of marker', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                properties: { altitude: 100 },
                symbol: {
                    'markerType': 'ellipse',
                    'markeraltitude': 6,
                    'markerWidth': 6
                }
            });
            layer.config('drawAltitude', {
                lineWidth: 5,
                lineColor: '#000'
            });
            layer.addGeometry(marker);
            map.setPitch(60);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, -1, [0, 0, 0]);
                expect(layer).to.be.painted(0, -10, [0, 0, 0]);
                done();
            });
            map.addLayer(layer);
        });

        it('draw altitude of marker without altitude prop', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                // properties : { altitude : 100 },
                symbol: {
                    'markerType': 'ellipse',
                    'markeraltitude': 6,
                    'markerWidth': 6
                }
            });
            layer.config('drawAltitude', {
                lineWidth: 5,
                lineColor: '#000'
            });
            layer.addGeometry(marker);
            map.setPitch(60);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, 0, [0, 0, 255]);
                expect(layer).not.to.be.painted(0, -10);
                done();
            });
            map.addLayer(layer);
        });

        it('#1519', function (done) {
            map.setView({"center":[120.16412861168442,30.239409643648713],"zoom":12,"pitch":56,"bearing":0});
            var line = new maptalks.LineString([
                [120.30774946474676, 30.326071649658527],
                [120.17326800494756, 30.39428919301061],
                [120.06585834847941, 30.36379693698641],
                [120.03508554050325, 30.250010074675707],
                [120.12216915755401, 30.130318799801504],
                [120.28587517553532, 30.092816929028302],
                [120.3374453251752, 30.169938194266646],
                [120.36555022945609, 30.324137052892578],
                [120.30774946474676, 30.326071649658527]
            ], {
              properties: {
                  'altitude': [100, 400, 1200, 400, 1200, 400, 1200, 400, 1200, 400, 1200, 400, 1200, 400, 1200]
              }
            });

            var layer = new maptalks.VectorLayer('vector', [line], {
              style: {
                  symbol: {
                      lineDasharray: [5, 10, 30, 10], //**这个参数 */
                      lineColor: '#ff0000'
                  }
              },
              enableAltitude: true,
              drawAltitude: {
                  polygonFill: '#1bbc9b',
                  polygonOpacity: 0.3,
                  lineWidth: 0,
                  'lineDasharray': [10, 5, 5],
              }
            });
            layer.once('layerload', function () {
                done();
            });
            layer.addTo(map);
        });
    });

    describe('geometry has altitude clip', function () {
        it('circle', function (done) {
            var circle = new maptalks.Circle(map.getCenter().add(0, -0.005), 300, {
                properties: { altitude: 200 },
                symbol: {
                    'polygonFill': '#f00'
                }
            });
            layer.addGeometry(circle);
            map.setPitch(60);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, map.getSize().height / 2 - 1);
                done();
            });
            map.addLayer(layer);
        });
    });
});
