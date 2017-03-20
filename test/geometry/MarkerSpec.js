describe('#Marker', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var canvasContainer;
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        canvasContainer = map._panels.front;
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

        expect(marker.getExtent().toJSON()).to.be.eql({ xmin : 0, xmax : 0, ymin : 0, ymax : 0 });

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
            layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
            map.addLayer(layer);
        });

        afterEach(function () {
            map.removeLayer(layer);
        });

        it('can be icon', function () {
            var marker = new maptalks.Marker(center, {
                symbol: {
                    markerFile: 'images/control/2.png',
                    markerWidth: 30,
                    markerHeight: 22
                }
            });

            expect(function () {
                layer.addGeometry(marker);
                expect(marker.getSize().toArray()).to.be.eql([30, 22]);
            }).to.not.throwException();
        });

        it('can be text', function () {
            var marker = new maptalks.Marker(center, {
                symbol: {
                    textName: 'texxxxxt',
                    textFaceName: 'monospace'
                }
            });

            expect(function () {
                layer.addGeometry(marker);
            }).to.not.throwException();
        });


        it('can be vector', function () {
            var types = ['ellipse', 'triangle', 'cross', 'diamond', 'square', 'x', 'bar'];

            expect(function () {
                for (var i = 0; i < types.length; i++) {
                    var marker = new maptalks.Marker(center, {
                        symbol: {
                            markerType: types[i],
                            markerLineDasharray: [20, 10, 5, 5, 5, 10]
                        }
                    });
                    layer.addGeometry(marker);
                }
            }).to.not.throwException();
        });

    });

    describe('set marker\'s Symbol', function () {

        it('fires symbolchange event', function () {
            var spy = sinon.spy();
            var marker = new maptalks.Marker(center);
            marker.on('symbolchange', spy);
            marker.setSymbol({
                'markerType' : 'ellipse',
                'markerLineColor': '#ff0000',
                'markerFill': '#ffffff',
                'markerFillOpacity': 0.6,
                'markerHeight' : 8,
                'markerWidth' : 8
            });

            expect(spy.called).to.be.ok();
        });

        it('unsuppored markerType', function () {
            var layer = new maptalks.VectorLayer('vector', { 'drawImmediate' : true });
            map.addLayer(layer);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol:{
                    'markerType' : 'unsupported',
                    'markerWidth':20,
                    'markerHeight':30
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
                    expect(layer).to.be.painted(0, -5);
                    done();
                });
                e.target.setSymbol({
                    'markerFile' : 'images/control/2.png'
                });
            });
            layer.once('layerload', function () {
                marker._fireEvent('click');
            });
            map.addLayer(layer);
        });

        it('change marker file by updateSymbol', function (done) {
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol : {
                    'markerFile' : 'images/control/3.png'
                }
            });
            var layer = new maptalks.VectorLayer('vector', [marker]);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(5, -1);
                layer.once('layerload', function () {
                    expect(layer).not.to.be.painted(5, -1);
                    expect(layer).to.be.painted(3, -1);
                    done();
                });
                marker.updateSymbol({
                    'markerFile' : 'images/control/4.png'
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
                markerFile : 'images/control/2.png',
                markerHeight : 30,
                markerWidth : 22,
                dx : 0,
                dy : 0
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
                markerFile : 'images/control/2.png'
            }
        });
        layer = new maptalks.VectorLayer('id').addGeometry(geometry);
        layer.on('renderend', function () {
            expect(layer._getRenderer()._geosToDraw.length).to.be.ok();
            done();
        });
        map.addLayer(layer);
    });

    describe('function type symbols', function () {
        it('vector marker\'s size changes with zoom', function () {
            map.config('zoomAnimation', false);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol : {
                    markerType : 'ellipse',
                    markerWidth : { stops: [[7, 8], [14, 20]] },
                    markerHeight : { stops: [[7, 8], [14, 20]] }
                }
            });
            var layer = new maptalks.VectorLayer('id', [marker], { 'drawImmediate' : true }).addTo(map);
            expect(layer).to.be.painted(10, 0);
            map.setZoom(7);
            expect(layer).not.to.be.painted(10, 0);
            expect(layer).not.to.be.painted(5, 0);
            expect(layer).to.be.painted(4, 0);
        });

        it('text marker\'s size changes with zoom', function () {
            map.config('zoomAnimation', false);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol : {
                    textName : '■■■■■■■■■',
                    textSize : { stops: [[7, 8], [14, 20]] },
                    textFill : '#fff'
                }
            });
            var layer = new maptalks.VectorLayer('id', [marker], { 'drawImmediate' : true }).addTo(map);
            expect(layer).to.be.painted(53, 0);
            map.setZoom(7);
            expect(layer).not.to.be.painted(53, 0);
            expect(layer).to.be.painted(32, 0);
        });
    });

});
