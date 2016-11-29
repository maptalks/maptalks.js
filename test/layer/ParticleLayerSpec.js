// var utils = require('../SpecUtils.js');

describe('#ParticleLayer', function() {

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
        map.remove();
        removeContainer(container);
    });

    function getParticles() {
        var size = map.getSize();
        return [{
            point : new maptalks.Point(size.width / 2, size.height / 2),
            r : 50,
            color : 'rgba(255, 0, 0, 0.1)'
        }];
    }

    it('add', function (done) {
        var size = map.getSize();
        layer = new maptalks.ParticleLayer('v');
        layer.getParticles = getParticles;

        layer.once('layerload', function () {
            expect(layer).to.be.painted(0, 0, [255, 0, 0]);
            done();
        });
        layer.addTo(map);
    });

    it('zoom events', function (done) {
        layer = new maptalks.ParticleLayer('v');
        layer.getParticles = getParticles;
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
        layer = new maptalks.ParticleLayer('v');
        layer.getParticles = getParticles;
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
        layer = new maptalks.ParticleLayer('v');
        layer.getParticles = getParticles;
        layer.addTo(map);
        var moveStartFired = false;
        layer.onResize = function () {
            done();
        }
        map._fireEvent('resize');
    });

    it('remove', function (done) {
        layer = new maptalks.ParticleLayer('v');
        layer.getParticles = getParticles;
        layer.addTo(map);
        layer.on('layerload', function () {
            map.removeLayer(layer);
            done();
        });
    });

    it('can be masked', function (done) {
        var size = map.getSize();
        layer = new maptalks.ParticleLayer('v');
        layer.getParticles = getParticles;
        var maskRadius = 10;
        layer.setMask(new maptalks.Circle(map.getCenter(), maskRadius, {
            symbol : {
                polygonFill : '#000'
            }
        }));
        layer.once('layerload', function () {
            expect(layer).to.be.painted(0, 0, [255, 0, 0]);
            expect(layer).not.to.be.painted(0, maskRadius + 2);
            done();
        });
        layer.addTo(map);
    });

    it('show', function (done) {
        var size = map.getSize();
        layer = new maptalks.ParticleLayer('v', {visible : false});
        layer.getParticles = getParticles;

        layer.once('layerload', function () {
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
        layer = new maptalks.ParticleLayer('v');
        layer.getParticles = getParticles;

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

    it('animation', function (done) {
        var size = map.getSize();
        layer = new maptalks.ParticleLayer('v', {animation : true, fps : 20});
        var count = 0;
        layer.getParticles = function (t) {
            var size = map.getSize();
            return [{
                point : new maptalks.Point(size.width / 2 + (count++) * 2, size.height / 2),
                r : 6,
                color : 'rgba(255, 0, 0, 0.1)'
            }];
        };
        layer.on('layerload', function () {
            if (count === 1) {
                expect(layer).not.to.be.painted(3, 0);
            }
            if (count === 2) {
                expect(layer).to.be.painted(3, 0, [255, 0, 0]);
                done();
            }
        });
        layer.addTo(map);
    });

    it('animation cancel and play', function (done) {
        var size = map.getSize();
        layer = new maptalks.ParticleLayer('v', {animation : true});
        var count = 0;
        layer.getParticles = function (t) {
            var size = map.getSize();
            return [{
                point : new maptalks.Point(size.width / 2 + (count++) * 2, size.height / 2),
                r : 6,
                color : 'rgba(255, 0, 0, 0.1)'
            }];
        };
        layer.once('layerload', function () {
            layer.cancel();
            layer.clearCanvas();
            layer.once('layerload', function () {
                if (count === 2) {
                    expect(layer).to.be.painted(3, 0, [255, 0, 0]);
                    done();
                }
            });
            setTimeout(function () {
                expect(count).to.be(1);
                expect(layer).not.to.be.painted(0, 0);
                layer.play();
            }, 40)
        });
        layer.addTo(map);
    });
});
