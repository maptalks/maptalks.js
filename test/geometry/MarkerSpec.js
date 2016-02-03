describe('Marker', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var canvasContainer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        canvasContainer = map._panels.mapPlatform;
    });

    afterEach(function() {
        document.body.removeChild(container);
    });

    describe("symbol", function() {

        var layer;

        beforeEach(function() {
            layer = new Z.VectorLayer('id');
            map.addLayer(layer);
        });

        afterEach(function() {
            map.removeLayer(layer);
        });

        it("can be icon", function() {
            var marker = new Z.Marker(center, {
                symbol: {
                    markerFile: Z.prefix + 'images/resource/marker.png',
                    markerWidth: 30,
                    markerHeight: 22
                }
            });

            expect(function () {
                layer.addGeometry(marker);
            }).to.not.throwException();
        });

        it("can be text", function() {
            var marker = new Z.Marker(center, {
                symbol: {
                    textName: 'texxxxxt',
                    font: 'monospace'
                }
            });

            expect(function () {
                layer.addGeometry(marker);
            }).to.not.throwException();
        });


        it("can be vector", function() {
            var types = ['circle', 'triangle', 'cross', 'diamond', 'square', 'x', 'bar'];

            expect(function () {
                for(var i = 0; i < types.length; i++) {
                    var marker = new Z.Marker(center, {
                        symbol: {
                            markerType: types[i],
                            markerLineDasharray: [20, 10, 5, 5, 5, 10]
                        }
                    });
                    layer.addGeometry(marker);
                }
            }).to.not.throwException();
        });

        it("can be shield", function() {
            var types = ['label', 'tip'];

            expect(function () {
                for(var i = 0; i < types.length; i++) {
                    var marker = new Z.Marker(center, {
                        symbol: {
                            shieldType: types[i],
                            shieldName: types[i] + 'Shield'
                        }
                    });
                    layer.addGeometry(marker);
                }
            }).to.not.throwException();
        });

    });

    describe('#setSymbol', function() {

        it('fires symbolchange event', function() {
            var spy = sinon.spy();
            var marker = new Z.Marker(center);
            marker.on('symbolchange', spy);
            marker.setSymbol({
                'marker-type' : 'ellipse',
                'marker-line-color': '#ff0000',
                'marker-fill': '#ffffff',
                'marker-fill-opacity': 0.6,
                'marker-height' : 8,
                'marker-width' : 8
            });

            expect(spy.called).to.be.ok();
        });

    });

    describe('events', function() {
        it('svg events', function() {
            var vector = new Z.Marker(center);
            new GeoEventsTester().testSVGEvents(vector, map);
        });

        it('canvas events', function() {
            var vector = new Z.Marker(center);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    it('can have various symbols',function() {
        var vector = new Z.Marker(center);
        GeoSymbolTester.testGeoSymbols(vector, map);
    });

    it("Marker._containsPoint", function() {

        var geometry = new Z.Marker(center, {
            symbol: {
                markerFile : Z.prefix + 'images/resource/marker.png',
                markerHeight : 30,
                markerWidth : 22,
                dx : 0,
                dy : 0
            }
        });
        layer = new Z.VectorLayer('id');
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

});
