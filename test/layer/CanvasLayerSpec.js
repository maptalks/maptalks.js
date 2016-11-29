// var utils = require('../SpecUtils.js');

describe('#CanvasLayer', function() {

    var container;
    var map;
    var tile, layer;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function() {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function() {
        removeContainer(container);
    });

    it('add', function (done) {
        var size = map.getSize();
        layer = new maptalks.CanvasLayer('v');
        layer.prepareToDraw = function (context) {
            return [size.width, size.height]
        };

        layer.draw = function (context, w, h) {
            expect(w).to.be.eql(size.width);
            expect(h).to.be.eql(size.height);
            context.fillStyle = "#f00";
            context.fillRect(0, 0, w, h);
        };
        layer.on('layerload', function () {
            expect(layer).to.be.painted(0, 0, [255, 0, 0]);
            done();
        });
        layer.addTo(map);
    });

    it('zoom events', function (done) {
        layer = new maptalks.CanvasLayer('v');
        layer.draw = function (context) {
            context.fillStyle = "#f00";
            context.fillRect(0, 0, 10, 10);
        };
        layer.addTo(map);
        var zoomStartFired = false;
        layer.onZoomStart = function (param) {
            expect(param).to.be.ok();
            zoomStartFired = true;
        }
        layer.onZoomEnd = function (param) {
            expect(param).to.be.ok();
            expect(zoomStartFired).to.be.ok();
            done();
        }
        map.zoomIn();
    });

    it('move events', function (done) {
        layer = new maptalks.CanvasLayer('v');
        layer.draw = function (context) {
            context.fillStyle = "#f00";
            context.fillRect(0, 0, 10, 10);
        };
        layer.addTo(map);
        var moveStartFired = false;
        layer.onMoveStart = function (param) {
            expect(param).to.be.ok();
            moveStartFired = true;
        }
        layer.onMoveEnd = function (param) {
            expect(param).to.be.ok();
            expect(moveStartFired).to.be.ok();
            done();
        }
        map.setCenter([0, 0]);
    });

    it('resize events', function (done) {
        layer = new maptalks.CanvasLayer('v');
        layer.draw = function (context) {
            context.fillStyle = "#f00";
            context.fillRect(0, 0, 10, 10);
        };
        layer.addTo(map);
        var moveStartFired = false;
        layer.onResize = function () {
            done();
        }
        map._fireEvent('resize');
    });

    it('remove', function (done) {
        layer = new maptalks.CanvasLayer('v');
        layer.draw = function (context) {
            context.fillStyle = "#f00";
            context.fillRect(0, 0, 10, 10);
        };
        layer.addTo(map);
        layer.on('layerload', function () {
            map.removeLayer(layer);
            done();
        });
    });
});
