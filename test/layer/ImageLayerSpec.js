describe('Layer.ImageLayer', function () {

    var container;
    var map;
    var layer;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '100px';
        container.style.height = '100px';
        document.body.appendChild(container);
        var option = {
            zoom: 14,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('add and remove', function (done) {
        var extent = new maptalks.Rectangle(center, 100, 100).getExtent();
        var layer = new maptalks.ImageLayer('images', {
                url : TILE_IMAGE,
                extent : extent.toJSON()
            }, {
                renderer : 'canvas'
            });
        layer.on('layerload', function () {
            expect(layer).to.be.painted(1, 1);
            map.removeLayer(layer);
            done();
        });
        layer.addTo(map);
    });

    it('add with array', function (done) {
        var extent = new maptalks.Rectangle(center, 100, 100).getExtent();
        var layer = new maptalks.ImageLayer('images', [
            {
                url : TILE_IMAGE,
                extent : extent.toJSON()
            }
        ], {
            renderer : 'canvas'
        });
        layer.on('layerload', function () {
            expect(layer).to.be.painted(1, 1, [0, 0, 0, 255]);
            done();
        });
        layer.addTo(map);
    });

    it('image opacity', function (done) {
        map.setBearing(20);
        var extent = new maptalks.Rectangle(center, 100, 100).getExtent();
        var layer = new maptalks.ImageLayer('images', [
            {
                url : TILE_IMAGE,
                extent : extent.toJSON(),
                opacity : 0.5
            }
        ], {
            renderer : 'canvas'
        });
        layer.on('layerload', function () {
            if (maptalks.Browser.ie) {
                expect(layer).to.be.painted(0, 1, [0, 0, 0, 58]);
            } else {
                expect(layer).to.be.painted(0, 1, [0, 0, 0, 104]);
            }
            done();
        });
        layer.addTo(map);
    });

    it('#getImages', function () {
        var extent = new maptalks.Rectangle(center, 100, 100).getExtent();
        var images = [
            {
                url : TILE_IMAGE,
                extent : extent.toJSON()
            }
        ];
        var layer = new maptalks.ImageLayer('images', images, {
            renderer : 'canvas'
        });
        expect(layer.getImages()).to.be.eql(images);
    });

    it('#setImages', function () {
        var extent = new maptalks.Rectangle(center, 100, 100).getExtent();
        var images = [
            {
                url : TILE_IMAGE,
                extent : extent.toJSON()
            }
        ];
        var layer = new maptalks.ImageLayer('images', {
            renderer : 'canvas'
        }).addTo(map);
        expect(layer.getImages()).to.be.eql([]);

        layer.setImages(images);
        expect(layer.getImages()).to.be.eql(images);
    });

    it('#setImages and dispose images', function (done) {
        if (!maptalks.Browser.webgl) {
            done();
            return;
        }
        var extent = new maptalks.Rectangle(center, 100, 100).getExtent();
        var images = [
            {
                url : TILE_IMAGE,
                extent : extent.toJSON()
            }
        ];
        var images2 = [
            {
                url : TILE_IMAGE + '2',
                extent : extent.toJSON()
            }
        ];
        var layer = new maptalks.ImageLayer('images', images, {
            renderer : 'gl'
        });
        layer.once('layerload', function () {
            layer.setImages(images2);
            layer.once('layerload', function () {
                done();
            });
        });
        layer.addTo(map);
    });

    it('#setImages and paint', function (done) {
        var extent = new maptalks.Rectangle(center, 100, 100).getExtent();
        var images = [
            {
                url : TILE_IMAGE,
                extent : extent.add([2, 2]).toJSON()
            }
        ];
        var images2 = [
            {
                url : TILE_IMAGE,
                extent : extent.toJSON()
            }
        ];
        var layer = new maptalks.ImageLayer('images', images, {
            renderer : 'canvas'
        });
        layer.once('layerload', function () {
            expect(layer).not.to.be.painted(1, 1);
            layer.setImages(images2);
            layer.once('layerload', function () {
                expect(layer).to.be.painted(1, 1);
                done();
            });

        });
        layer.addTo(map);
    });

    it('add with gl renderer', function (done) {
        if (!maptalks.Browser.webgl) {
            done();
            return;
        }
        var extent = new maptalks.Rectangle(center, 100, 100).getExtent();
        var layer = new maptalks.ImageLayer('images', [
            {
                url : TILE_IMAGE,
                extent : extent
            }
        ], {
            renderer : 'gl'
        });
        layer.on('layerload', function () {
            // expect(layer).to.be.painted(1, 1);
            done();
        });
        layer.addTo(map);
    });
});
