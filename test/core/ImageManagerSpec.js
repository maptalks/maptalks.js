describe('ImageManager.Spec', function () {
    var hostUrl = 'http://localhost:9876/resources/';
    var ImageManager = maptalks.ImageManager;

    var container;
    var map;
    var center = new maptalks.Coordinate(0, 0);
    var canvasContainer;
    var layer;

    beforeEach(function () {
        ImageManager.setSourceUrl(hostUrl);
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
        map.remove();
        REMOVE_CONTAINER(container);
    });

    function getImage(key) {
        return ImageManager.get(key);
    }

    function getMarker(markerFile) {
        return new maptalks.Marker(center, {
            properties: {
                iconName: 'tile.png'
            },
            symbol: {
                markerFile: markerFile
            }
        });
    }

    it('get image with not cache', function (done) {
        expect(getImage('tile.png')).to.equal(hostUrl + 'tile.png');
        done();
    });

    it('get image with cache', function (done) {
        ImageManager.add('a', 'tile.png');
        expect(getImage('a')).to.be.equal(hostUrl + 'tile.png');
        done();
    });

    it('get image with has host', function (done) {
        ImageManager.add('b', 'https://abc.com/tile.png');
        expect(getImage('b')).to.be.equal('https://abc.com/tile.png');
        done();
    });

    it('get image with base64', function (done) {
        var base64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        ImageManager.add('c', base64);
        expect(getImage('c')).to.be.equal(base64);
        done();
    });

    it('get image with blob', function (done) {
        fetch(hostUrl + 'tile.png').then(function (res) {
            return res.blob();
        }).then(function (blob) {
            var url = URL.createObjectURL(blob);
            ImageManager.add('d', url);
            expect(getImage('d')).to.be.equal(url);
            done();
        })
    });

    it('load sprite', function (done) {
        ImageManager.loadSprite({
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

    it('markerFile with {} express', function (done) {
        var marker = getMarker('{iconName}');
        layer.once('layerload', function () {
            expect(layer).to.be.painted(0, -4);
            done();
        });
        layer.addGeometry(marker);
    });

});
