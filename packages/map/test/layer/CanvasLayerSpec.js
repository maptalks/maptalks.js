describe('Layer.CanvasLayer', function () {

    var container;
    var map;
    var layer;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center,
            zoomAnimationDuration : 100
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('add', function (done) {
        var size = map.getSize();
        layer = new maptalks.CanvasLayer('v');
        layer.prepareToDraw = function () {
            return [size.width, size.height];
        };

        layer.draw = function (context, view, w, h) {
            expect(view.extent.isValid()).to.be.ok();
            expect(view.middleWest).to.be.ok();
            expect(view.zoom).to.be.eql(map.getZoom());
            expect(w).to.be.eql(size.width);
            expect(h).to.be.eql(size.height);
            context.fillStyle = '#f00';
            context.fillRect(0, 0, w, h);
        };
        layer.on('layerload', function () {
            expect(layer).to.be.painted(0, 0, [255, 0, 0]);
            done();
        });
        layer.addTo(map);
    });

    it('zoom events', function (done) {
        var size = map.getSize();
        layer = new maptalks.CanvasLayer('v');
        layer.draw = function (context) {
            context.fillStyle = '#f00';
            context.fillRect(0, 0, size.width, size.height);
        };
        var drawCalled = false;
        layer.drawOnInteracting = function (context) {
            drawCalled = true;
            context.fillStyle = '#f00';
            context.fillRect(0, 0, size.width, size.height);
        };
        // layer.addTo(map);
        var zoomStartFired = false;
        layer.onZoomStart = function (param) {
            expect(param).to.be.ok();
            zoomStartFired = true;
        };
        layer.onZooming = function (param) {
            expect(param).to.be.ok();
        };
        layer.onZoomEnd = function (param) {
            //cleared
            expect(param).to.be.ok();
            expect(zoomStartFired).to.be.ok();
            expect(drawCalled).to.be.ok();
            done();
        };
        layer.once('layerload', function () {
            setTimeout(function () {
                map.zoomIn();
            }, 30);
        });
        layer.addTo(map);
    });

    it('move events', function (done) {
        layer = new maptalks.CanvasLayer('v');
        layer.draw = function (context) {
            context.fillStyle = '#f00';
            context.fillRect(0, 0, 10, 10);
        };
        layer.addTo(map);
        var moveStartFired = false;
        var movingFired = false;
        layer.onMoveStart = function (param) {
            expect(param).to.be.ok();
            moveStartFired = true;
        };
        layer.onMoving = function (param) {
            expect(param).to.be.ok();
            movingFired = true;
        };
        layer.onMoveEnd = function (param) {
            expect(param).to.be.ok();
            expect(moveStartFired).to.be.ok();
            expect(movingFired).not.to.be.ok();
            done();
        };
        map.setCenter([0, 0]);
    });

    it('resize events', function (done) {
        layer = new maptalks.CanvasLayer('v');
        layer.draw = function (context) {
            context.fillStyle = '#f00';
            context.fillRect(0, 0, 10, 10);
        };
        layer.addTo(map);
        layer.onResize = function () {
            done();
        };
        map._fireEvent('resize');
    });

    it('remove', function (done) {
        layer = new maptalks.CanvasLayer('v');
        layer.draw = function (context) {
            context.fillStyle = '#f00';
            context.fillRect(0, 0, 10, 10);
        };
        layer.addTo(map);
        layer.on('layerload', function () {
            map.removeLayer(layer);
            done();
        });
    });

    it('can be masked', function (done) {
        function isDrawn(canvas, p) {
            var context = canvas.getContext('2d');
            var imgData = context.getImageData(p.x, p.y, 1, 1).data;
            if (imgData[3] > 0) {
                return true;
            }
            return false;
        }
        var size = map.getSize();
        layer = new maptalks.CanvasLayer('v');
        layer.draw = function (context) {
            context.fillStyle = 'rgba(255, 0, 0, 0.1)';
            context.fillRect(0, 0, size.width, size.height);
        };
        var maskRadius = 10;
        layer.setMask(new maptalks.Circle(map.getCenter(), maskRadius, {
            symbol : {
                polygonFill : '#000'
            }
        }));
        var canvas = map.getRenderer().canvas;
        var c = new maptalks.Point(canvas.width / 2, canvas.height / 2);
        layer.once('layerload', function () {
            expect(isDrawn(canvas, c)).to.be.ok();
            if (maptalks.Browser.gecko3d) {
                expect(layer).to.be.painted(0, 0, [254, 0, 0]);
            } else {
                expect(layer).to.be.painted(0, 0, [255, 0, 0]);
            }
            expect(isDrawn(canvas, c.add(0, maskRadius + 2))).not.to.be.ok();
            done();
        });
        layer.addTo(map);
    });

    it('show', function (done) {
        var size = map.getSize();
        layer = new maptalks.CanvasLayer('v', { visible : false, doubleBuffer : true });
        layer.draw = function (context) {
            context.fillStyle = '#f00';
            context.fillRect(0, 0, size.width, size.height);
        };

        layer.once('add', function () {
            expect(layer).not.to.be.painted();
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, 0, [255, 0, 0]);
                done();
            });
            layer.show();
        });
        layer.addTo(map);
    });

    it('hide', function (done) {
        var size = map.getSize();
        layer = new maptalks.CanvasLayer('v');
        layer.draw = function (context) {
            context.fillStyle = '#f00';
            context.fillRect(0, 0, size.width, size.height);
        };

        layer.once('layerload', function () {
            expect(layer).to.be.painted(0, 0, [255, 0, 0]);
            layer.once('hide', function () {
                expect(layer).not.to.be.painted();
                done();
            });
            layer.hide();
        });
        layer.addTo(map);
    });

    it('set opacity to the layer', function (done) {
        var size = map.getSize();
        layer = new maptalks.CanvasLayer('v', { 'opacity' : 0.4 });
        layer.draw = function (context) {
            context.fillStyle = '#f00';
            context.fillRect(0, 0, size.width, size.height);
        };
        layer.once('layerload', function () {
            map.once('renderend', function () {
                /*eslint-disable no-undef */
                var mapImage = COMMON_GET_MAP_COLOR(map, size.width / 2, size.height / 2);
                expect([mapImage[0], mapImage[1], mapImage[2], mapImage[3]]).to.be.eql([255, 0, 0, 255 * 0.4]);
                layer.once('layerload', function () {
                    map.once('renderend', function () {
                        mapImage = COMMON_GET_MAP_COLOR(map, size.width / 2, size.height / 2);
                        expect([mapImage[0], mapImage[1], mapImage[2], mapImage[3]]).to.be.eql([255, 0, 0, 255 * 0.4]);
                        done();
                    });
                });
                map.zoomIn();
                /*eslint-enable no-undef */
            });

        });
        layer.addTo(map);
    });
});
