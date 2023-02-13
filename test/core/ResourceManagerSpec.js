describe('ResourceManager.Spec', function () {
    var hostUrl = 'http://localhost:9876/resources/';
    var ResourceManager = maptalks.ResourceManager;

    var container;
    var map;
    var center = new maptalks.Coordinate(0, 0);
    var canvasContainer;
    var layer;

    beforeEach(function () {
        ResourceManager.setRootUrl(hostUrl);
        var setups = COMMON_CREATE_MAP(center, null, {
            width: 300,
            height: 200
        });
        container = setups.container;
        map = setups.map;
        map.config('centerCross', true);
        canvasContainer = map._panels.front;
        layer = new maptalks.VectorLayer('v').addTo(map);
    });

    afterEach(function () {
        maptalks.Browser.decodeImageInWorker = true;
        map.remove();
        REMOVE_CONTAINER(container);
    });

    function getImage(key) {
        return ResourceManager.get(key);
    }

    function getMarker(markerFile) {
        return new maptalks.Marker(center, {
            properties: {
                iconName: '$tile.png'
            },
            symbol: {
                markerFile: markerFile
            }
        });
    }

    function setLayerImages(layer) {
        var center = map.getCenter();
        var x = center.x, y = center.y;
        var images = [
            {
                url: '$tile.png',
                extent: [x - 0.1, y - 0.1, x + 0.1, y + 0.1]
            }
        ];
        layer.setImages(images);
    }

    it('get image with not cache', function (done) {
        expect(getImage('tile.png')).to.equal(hostUrl + 'tile.png');
        done();
    });

    it('get image with cache', function (done) {
        ResourceManager.add('a', 'tile.png');
        expect(getImage('a')).to.be.equal(hostUrl + 'tile.png');
        done();
    });

    it('get image with has host', function (done) {
        ResourceManager.add('b', 'https://abc.com/tile.png');
        expect(getImage('b')).to.be.equal('https://abc.com/tile.png');
        done();
    });

    it('get image with base64', function (done) {
        var base64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        ResourceManager.add('c', base64);
        expect(getImage('c')).to.be.equal(base64);
        done();
    });

    it('get image with blob', function (done) {
        fetch(hostUrl + 'tile.png').then(function (res) {
            return res.blob();
        }).then(function (blob) {
            var url = URL.createObjectURL(blob);
            ResourceManager.add('d', url);
            expect(getImage('d')).to.be.equal(url);
            done();
        })
    });

    it('load sprite', function (done) {
        ResourceManager.loadSprite({
            imgUrl: hostUrl + 'sprite.png',
            jsonUrl: hostUrl + 'sprite.json'
        }).then(function () {
            var img = getImage('000');
            console.log(img);
            expect(img).to.be.equal('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAeFJREFUOE+lk09IVGEUxc+ZadLnWG9GsJUIQ/YHBgKxFtaEGC4yCDfiRkSjoizoH2WLWURRgqEywkBNTmWBYLtWLQQXMphQMqREgQsrt4q+KYf3Yp5zYx7O4Oi8t+nuLud8P8537/cR/1l0Oi8iTSSnnTy2ABG5mEnMxj2nGy+RfGkHcQLMaSdbG7xDj+BpPBEiOVMKUhIgIsfN5Pxn7dQ5lHW2Y1985C3JbluAiKgAegH4tkxVG9f7LhuvxkGlHFVLSdCnDmwDTJD8kuutBFndECM6iqz2u+AxYmOQjbTV7z1/Fu7DBwtaWUcb9hwL1ucgFkBEAps/l5f+dPXCnLPAJYsVCryRfpR3dVwgOVZIsAXpQcZ8nQ4/hh6N56hFEPeROuwfj8EdPDpE8m5eLBqiiBwSLbW4FqiHGH+LAN4nYSh3rt0n+XS7sBNwU4/GI+l7DyyP60A1siurVhp3XQD+hQRAukgW4u0EfF1vOBPM/vgFpe8GlFtXYSbnkb4dhrnwDeqHd/A0h1pITu26goiEMh8/JfRIDJWDD+GqrRkG0A+gHab5XI+9web3RVRGB16QvFIK4BcttUaf+h7AM5KTeZOIeHLvRLTUCH2qtT67IfpJrtutUUR26Y6/0ekX5rV/GFS5Edy9FPsAAAAASUVORK5CYII=');
            done();
        })

    });

    it('markerFile with $ express', function (done) {
        var marker = getMarker('$tile.png');
        layer.once('layerload', function () {
            expect(layer).to.be.painted(0, -4);
            done();
        });
        layer.addGeometry(marker);
    });

    it('markerFile with {iconName} express', function (done) {
        var marker = getMarker('{iconName}');
        layer.once('layerload', function () {
            expect(layer).to.be.painted(0, -4);
            done();
        });
        layer.addGeometry(marker);
    });

    it('layer remove and add', function (done) {
        var marker = getMarker('$tile.png');
        layer.once('layerload', function () {
            expect(layer).to.be.painted(0, -4);
            layer.remove();
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, -4);
                done();
            });
            layer.addTo(map);
        });
        layer.addGeometry(marker);
    });

    it('multi layer share imagebitmap', function (done) {
        var marker = getMarker('$tile.png');
        layer.once('layerload', function () {
            expect(layer).to.be.painted(0, -4);
            var marker1 = getMarker('$tile.png');
            var layer1 = new maptalks.VectorLayer('layer1').addTo(map);
            layer1.once('layerload', function () {
                expect(layer1).to.be.painted(0, -4);
                done();
            });
            layer1.addGeometry(marker1);
        });
        layer.addGeometry(marker);
    });

    it('multi layer share image with disable decodeImageInWorker', function (done) {
        maptalks.Browser.decodeImageInWorker = false;
        var marker = getMarker('$tile.png');
        layer.once('layerload', function () {
            expect(layer).to.be.painted(0, -4);
            var marker1 = getMarker('$tile.png');
            var layer1 = new maptalks.VectorLayer('layer1').addTo(map);
            layer1.once('layerload', function () {
                expect(layer1).to.be.painted(0, -4);
                done();
            });
            layer1.addGeometry(marker1);
        });
        layer.addGeometry(marker);
    });

    it('multi layer share image with disable decodeImageInWorker and cache is image', function (done) {
        maptalks.Browser.decodeImageInWorker = false;
        ResourceManager.remove('tile.png');
        var image = new Image();
        image.onload = function () {
            ResourceManager.add('tile.png', image);
            var marker = getMarker('$tile.png');
            layer.once('layerload', function () {
                expect(layer).to.be.painted(0, -4);
                var marker1 = getMarker('$tile.png');
                var layer1 = new maptalks.VectorLayer('layer1').addTo(map);
                layer1.once('layerload', function () {
                    expect(layer1).to.be.painted(0, -4);
                    done();
                });
                layer1.addGeometry(marker1);
            });
            layer.addGeometry(marker);
        }
        image.src = ResourceManager.get('tile.png');
    });

    it('imagelayer use $ express', function (done) {
        var imageLayer = new maptalks.ImageLayer('images').addTo(map);
        imageLayer.once('layerload', function () {
            done();
        });
        setLayerImages(imageLayer);
    });

    it('imagelayer remove and add', function (done) {
        var imageLayer = new maptalks.ImageLayer('images').addTo(map);
        imageLayer.once('layerload', function () {
            imageLayer.remove();
            imageLayer.once('layerload', function () {
                done();
            });
            imageLayer.addTo(map);
        });
        setLayerImages(imageLayer);
    });

    it('multi imagelayer share imagebitmap', function (done) {
        var imageLayer = new maptalks.ImageLayer('images').addTo(map);
        imageLayer.once('layerload', function () {
            var imageLayer1 = new maptalks.ImageLayer('images1').addTo(map);
            imageLayer1.once('layerload', function () {
                done();
            });
            setLayerImages(imageLayer1);
        });
        setLayerImages(imageLayer);
    });

    it('multi imagelayer share image with disable decodeImageInWorker', function (done) {
        maptalks.Browser.decodeImageInWorker = false;
        var imageLayer = new maptalks.ImageLayer('images').addTo(map);
        imageLayer.once('layerload', function () {
            var imageLayer1 = new maptalks.ImageLayer('images1').addTo(map);
            imageLayer1.once('layerload', function () {
                done();
            });
            setLayerImages(imageLayer1);
        });
        setLayerImages(imageLayer);
    });

    it('multi imagelayer share image with disable decodeImageInWorker and cache is image', function (done) {
        maptalks.Browser.decodeImageInWorker = false;
        ResourceManager.remove('tile.png');
        var image = new Image();
        image.onload = function () {
            ResourceManager.add('tile.png', image);
            var imageLayer = new maptalks.ImageLayer('images').addTo(map);
            imageLayer.once('layerload', function () {
                var imageLayer1 = new maptalks.ImageLayer('images1').addTo(map);
                imageLayer1.once('layerload', function () {
                    done();
                });
                setLayerImages(imageLayer1);
            });
            setLayerImages(imageLayer);
        }
        image.src = ResourceManager.get('tile.png');

    });

});
