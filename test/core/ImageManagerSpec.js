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

    it('get image witch cache', function (done) {
        ImageManager.add('a', 'tile.png');
        expect(getImage('a')).to.be.equal(hostUrl + 'tile.png');
        done();
    });

    it('get image witch has host', function (done) {
        ImageManager.add('b', 'https://abc.com/tile.png');
        expect(getImage('b')).to.be.equal('https://abc.com/tile.png');
        done();
    });

    it('get image witch base64', function (done) {
        var base64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        ImageManager.add('c', base64);
        expect(getImage('c')).to.be.equal(base64);
        done();
    });

    it('get image witch blob', function (done) {
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
        //data form  mapbox.com for test
        ImageManager.loadSprite({
            imgUrl: hostUrl + 'sprite.png',
            jsonUrl: hostUrl + 'sprite.json'
        }).then(function () {
            var img = getImage('ae-d-route-3');
            expect(img).to.be.equal('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAATBJREFUSEtj/Ps4tfH/f8YKZmYGNgYGBoa/fxl+MTL+7wCxqSHO+OdR2k/9E6/Z3v36BjKTQYiNi+GihegvEJsa4oz/n6b9l9r/EGw4DDxzlAczqSGO1YJl+mJgC6IuvkKxmFRxkEOxWoBiKgUc+lgAiuT460/BKQgELnxkY4BFOKmOByUQA35w+gCDhZrSvxj/PEwKY2ZhWfn+KxND7v3HDPte/yHVXBT1TqIsDJMVZRkEuf8x/P3zJ5zx56Vo3a8cvJdsL7wk2+XoLgL55LCBOAP3j896jP8ep65qfvQ9dMb91xS5HF1zhqIoQ60c52qMjEYtW2AZdhgkU2xFBbWCieYZ7bGd/C+axgFNLWBnYmW4YyP1i/bJFL1Go1YEw2pGRmoZiMucUQsIhjDNgwgAAO/jJ7ZkmWQAAAAASUVORK5CYII=');
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
