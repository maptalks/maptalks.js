describe('Layer.Spec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var context = {
        map : map
    };

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        context.map = map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('id methods', function () {
        it('id will be converted to string', function () {
            var layer1 = new maptalks.TileLayer(1);
            expect(layer1.getId()).to.be.eql('1');
        });

        it('id can be null or undefined', function () {
            var layer1 = new maptalks.TileLayer(null);
            expect(layer1.getId() === null).to.be.ok();
            layer1.setId(undefined);
            expect(layer1.getId() === undefined).to.be.ok();
        });

        it('null id can\'t be added to map', function () {
            var layer1 = new maptalks.TileLayer(null);
            /*eslint-disable no-empty */
            try {
                map.addLayer(layer1);
                expect(false).to.be.ok();
            } catch (e) {

            }
            /*eslint-enable no-empty */
        });

        it('update id', function () {
            var layer1 = new maptalks.TileLayer('1', { renderer:'canvas' });
            map.addLayer(layer1);
            layer1.setId('2');
            expect(layer1).to.be.eql(map.getLayer('2'));
        });

        it('prevent loading in onLoad', function (done) {
            var layer = new maptalks.VectorLayer('1', { renderer:'canvas' });
            var ready = false;
            layer.onLoad = function () {
                if (!ready) {
                    setTimeout(function () {
                        ready = true;
                        layer.load();
                    }, 100);
                }
                return ready;
            };
            layer.on('layerload', function () {
                expect(ready).to.be.ok();
                done();
            });
            map.once('frameend', function () {
                expect(layer.isLoaded()).not.to.be.ok();
            });
            map.addLayer(layer);

        });

        it('onAdd is called when added to map', function (done) {
            var layer = new maptalks.VectorLayer('1');
            layer.onAdd = function () {
                done();
            };
            map.addLayer(layer);

        });
    });

    it('#getMinZoom and #getMaxZoom', function () {
        var layer = new maptalks.VectorLayer('1', {
            minZoom : 10
        });

        map.addLayer(layer);
        expect(layer.getMinZoom()).to.be.eql(10);
        expect(layer.getMaxZoom()).to.be.eql(map.getMaxZoom());
    });

    describe('zindex of layers', function () {
        it('default zindex is 0', function () {
            var layer1 = new maptalks.TileLayer('1', { renderer:'canvas' });
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);

            expect(layer1.getZIndex()).to.be(0);
            expect(layer2.getZIndex()).to.be(0);
            expect(layer3.getZIndex()).to.be(0);
        });

        it('setZIndex to bring a layer to front', function () {
            var layer1 = new maptalks.TileLayer('1', { renderer:'canvas' });
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);

            layer1.setZIndex(1);
            expect(map.getLayers()).to.be.eql([layer2, layer3, layer1]);

            layer2.setZIndex(2);
            expect(map.getLayers()).to.be.eql([layer3, layer1, layer2]);

            layer3.setZIndex(3);
            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);
        });

        it('setZIndex with 1 and to null later, layer should stay at the same index', function () {
            var layer1 = new maptalks.TileLayer('1', { renderer:'canvas' });
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);

            layer1.setZIndex(1);
            expect(map.getLayers()).to.be.eql([layer2, layer3, layer1]);

            layer2.setZIndex(null);
            expect(map.getLayers()).to.be.eql([layer2, layer3, layer1]);
        });

        it('setZIndex to null, layer index should not change', function () {
            var layer1 = new maptalks.TileLayer('1', { renderer:'canvas' });
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);

            layer1.setZIndex(null);
            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);
        });

        it('remove a layer with z index', function () {
            var layer1 = new maptalks.TileLayer('1', { renderer:'canvas' });
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            layer1.setZIndex(3);
            layer2.setZIndex(2);
            layer3.setZIndex(1);

            expect(map.getLayers()).to.be.eql([layer3, layer2, layer1]);

            layer2.remove();
            expect(map.getLayers()).to.be.eql([layer3, layer1]);

            expect(layer1.getZIndex()).to.be(3);
            expect(layer3.getZIndex()).to.be(1);
        });

        it('setZIndex before adding to map to bring a layer to front', function () {
            var layer1 = new maptalks.TileLayer('1', { renderer:'canvas' });
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            layer1.setZIndex(1);

            map.addLayer([layer1, layer2, layer3]);

            expect(map.getLayers()).to.be.eql([layer2, layer3, layer1]);

            layer2.setZIndex(2);
            expect(map.getLayers()).to.be.eql([layer3, layer1, layer2]);

            layer3.setZIndex(3);
            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);
        });

        it('setZIndex in options before adding to map to bring a layer to front', function () {
            var layer1 = new maptalks.TileLayer('1', { renderer:'canvas', zIndex : 1 });
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            expect(map.getLayers()).to.be.eql([layer2, layer3, layer1]);

            layer2.setZIndex(2);
            expect(map.getLayers()).to.be.eql([layer3, layer1, layer2]);

            layer3.setZIndex(3);
            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);
        });
    });

    describe('change order of layers', function () {

        it('bring a layer to front', function () {
            var layer1 = new maptalks.TileLayer('1', { renderer:'canvas' });
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);

            layer1.bringToFront();
            expect(map.getLayers()).to.be.eql([layer2, layer3, layer1]);

            layer2.bringToFront();
            expect(map.getLayers()).to.be.eql([layer3, layer1, layer2]);

            layer3.bringToFront();
            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);
        });

        it('bring a layer to back', function () {
            var layer1 = new maptalks.TileLayer('1', { renderer:'canvas' });
            var layer2 = new maptalks.VectorLayer('2');
            var layer3 = new maptalks.VectorLayer('3');

            map.addLayer([layer1, layer2, layer3]);

            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);

            layer3.bringToBack();
            expect(map.getLayers()).to.be.eql([layer3, layer1, layer2]);

            layer2.bringToBack();
            expect(map.getLayers()).to.be.eql([layer2, layer3, layer1]);

            layer3.bringToBack();
            expect(map.getLayers()).to.be.eql([layer3, layer2, layer1]);
        });

        it('sort layers by map and paint', function (done) {
            var layer1 = new maptalks.VectorLayer('1', new maptalks.Circle(map.getCenter(), 100, {
                symbol : {
                    polygonFill : '#f00'
                }
            }));
            var layer2 = new maptalks.VectorLayer('2', new maptalks.Circle(map.getCenter(), 100, {
                symbol : {
                    polygonFill : '#0f0'
                }
            }));
            var layer3 = new maptalks.VectorLayer('3', new maptalks.Circle(map.getCenter(), 100, {
                symbol : {
                    polygonFill : '#00f'
                }
            }));
            map.once('renderend', function () {
                expect(map).to.be.painted(0, 0, [0, 0, 255]);
                map.once('renderend', function () {
                    expect(map).to.be.painted(0, 0, [255, 0, 0]);
                    done();
                });
                map.sortLayers(['3', '2', '1']);
                expect(map.getLayers()).to.be.eql([layer3, layer2, layer1]);
            });
            map.addLayer([layer1, layer2, layer3]);
            expect(map.getLayers()).to.be.eql([layer1, layer2, layer3]);

        });
    });

    describe('set a mask of a vector marker', function () {
        var mask, mask2;

        beforeEach(function () {
            mask = new maptalks.Marker(map.getCenter(), {
                symbol:{
                    markerType:'ellipse',
                    markerWidth:400,
                    markerHeight:400
                }
            });

            mask2 = new maptalks.Circle(map.getCenter(), 1000);
        });

        it('to a tile layer', function () {
            var tilelayer = new maptalks.TileLayer('tile with mask', {
                urlTemplate:'http://www.aacaward.com/jiema/html/data/aac/{z}/{x}/{y}.png',
                subdomains:[1, 2, 3, 4],
                renderer : 'canvas'
            });
            map.addLayer(tilelayer);
            tilelayer.setMask(mask);
            expect(tilelayer.getMask()).not.to.be.empty();
            tilelayer.removeMask();
            expect(tilelayer.getMask()).not.to.be.ok();

            tilelayer.setMask(mask2);
            expect(tilelayer.getMask()).not.to.be.empty();
            tilelayer.removeMask();
            expect(tilelayer.getMask()).not.to.be.ok();
        });

        it('to a VectorLayer', function () {
            var vectorlayer = new maptalks.VectorLayer('vector with mask');
            map.addLayer(vectorlayer);
            vectorlayer.addGeometry(GEN_GEOMETRIES_OF_ALL_TYPES());
            vectorlayer.setMask(mask);
            expect(vectorlayer.getMask()).not.to.be.empty();
            vectorlayer.removeMask();
            expect(vectorlayer.getMask()).not.to.be.ok();

            vectorlayer.setMask(mask2);
            expect(vectorlayer.getMask()).not.to.be.empty();
            vectorlayer.removeMask();
            expect(vectorlayer.getMask()).not.to.be.ok();
        });
    });

    it('change opacity', function (done) {
        var layer1 = new maptalks.TileLayer('1', { renderer:'canvas' });
        var layer2 = new maptalks.VectorLayer('2', new maptalks.Marker(map.getCenter(), {
            symbol : {
                markerType : 'ellipse',
                markerWidth : 10,
                markerHeight : 10,
                markerFill : '#f00'
            }
        }));
        map.addLayer([layer2]);

        expect(layer1.getOpacity()).to.be.eql(1);
        expect(layer2.getOpacity()).to.be.eql(1);

        layer1.setOpacity(0.5);
        expect(layer1.getOpacity()).to.be.eql(0.5);

        layer2.once('layerload', function () {
            layer2.once('layerload', function () {
                expect(layer2.getOpacity()).to.be.eql(0.1);
                var canvas = map.getRenderer().canvas;
                var size = map.getSize().toPoint();
                var context = canvas.getContext('2d');
                var imgData = context.getImageData(Math.round(size.x / 2), Math.round(size.y / 2), 1, 1).data;
                expect(imgData[3]).to.be.below(40);
                done();
            });
            layer2.setOpacity(0.1);
        });

        layer2.setOpacity(0.6);
        expect(layer2.getOpacity()).to.be.eql(0.6);

        // setTimeout(function () {
        //     var canvas = map.getRenderer().canvas;
        //     var size = map.getSize().toPoint();
        //     var context = canvas.getContext('2d');
        //     var imgData = context.getImageData(Math.round(size.x / 2), Math.round(size.y / 2), 1, 1).data;
        //     console.log(imgData[3]);
        //     expect(imgData[3]).to.be.below(40);
        //     done();
        // }, 60);
    });

});
