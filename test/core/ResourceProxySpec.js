describe('ResourceProxy.Spec', function () {
    const { ResourceProxy, formatResourceUrl } = maptalks;
    var hostUrl = 'http://localhost:9876/resources';

    const MTKHOST = 'https://www.maptalks.com';

    ResourceProxy.proxy['/geojson/'] = {
        target: `${MTKHOST}/geojson/`
    }
    ResourceProxy.origin['https://www.abc.com/'] = {
        target: `${MTKHOST}/`
    }

    var container;
    var map, layer;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '200px';
        container.style.height = '200px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        layer = new maptalks.VectorLayer('layer').addTo(map);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });


    it('local proxy', function (done) {
        expect(formatResourceUrl('/geojson/a.geojson')).to.equal(`${MTKHOST}/geojson/a.geojson`);
        expect(formatResourceUrl('/geojson/a/b/c.geojson')).to.equal(`${MTKHOST}/geojson/a/b/c.geojson`);
        done();
    });

    it('origin proxy', function (done) {
        expect(formatResourceUrl('https://www.abc.com/a')).to.equal(`${MTKHOST}/a`);
        expect(formatResourceUrl('https://www.abc.com/a/b/c')).to.equal(`${MTKHOST}/a/b/c`);
        done();
    });

    it('base64', function (done) {
        var base64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        expect(formatResourceUrl(base64)).to.equal(base64);
        done();
    });

    it('blob url ', function (done) {
        fetch(hostUrl + '/tile.png').then(function (res) {
            return res.blob();
        }).then(function (blob) {
            var url = URL.createObjectURL(blob);
            expect(formatResourceUrl(url)).to.equal(url);
            done();
        })
    });

    it('get resource from  ResourceProxy', function (done) {
        ResourceProxy.addResource('abc', `${MTKHOST}/abc.png`);
        expect(formatResourceUrl('$abc')).to.equal(`${MTKHOST}/abc.png`);
        done();
    });

    it('load sprite', function (done) {
        ResourceProxy.loadSprite({
            imgUrl: hostUrl + '/sprite.png',
            jsonUrl: hostUrl + '/sprite.json'
        }).then(function (result) {
            layer.clear();
            new maptalks.Marker(map.getCenter(), {
                symbol: {
                    markerFile: "$116"
                }
            }).addTo(layer);
            setTimeout(() => {
                expect(layer).to.be.painted(0, -5);
                done();
            }, 200);
        })
    });
    
    it('load sprite custom sourceName', function (done) {
        ResourceProxy.loadSprite({
            imgUrl: hostUrl + '/sprite.png',
            jsonUrl: hostUrl + '/sprite.json',
            sourceName: 'sprite/'
        }).then(function (result) {
            layer.clear();
            new maptalks.Marker(map.getCenter(), {
                symbol: {
                    markerFile: "$sprite/116"
                }
            }).addTo(layer);
            setTimeout(() => {
                expect(layer).to.be.painted(0, -5);
                done();
            }, 200);
        })
    });

    it('load svgs', function (done) {
        ResourceProxy.loadSvgs(hostUrl + '/svgs.json').then(function (result) {
            layer.clear();
            new maptalks.Marker(map.getCenter(), {
                symbol: {
                    markerType: 'path',
                    markerPath: '$airfield.svg',//use $ get icon data
                    'markerPathWidth': 15,
                    'markerPathHeight': 15,
                    'markerWidth': 30,
                    'markerHeight': 30
                }
            }).addTo(layer);
            setTimeout(() => {
                expect(layer).to.be.painted(0, -1);
                done();
            }, 200);
        })
    });

    it('load svgs with object params', function (done) {
        ResourceProxy.loadSvgs({
            url: hostUrl + '/svgs.json'
        }).then(function (result) {
            layer.clear();
            new maptalks.Marker(map.getCenter(), {
                symbol: {
                    markerType: 'path',
                    markerPath: '$airfield.svg',//use $ get icon data
                    'markerPathWidth': 15,
                    'markerPathHeight': 15,
                    'markerWidth': 30,
                    'markerHeight': 30
                }
            }).addTo(layer);
            setTimeout(() => {
                expect(layer).to.be.painted(0, -1);
                done();
            }, 200);
        })
    });

    it('load svgs custom resourceName', function (done) {
        ResourceProxy.loadSvgs({
            url: hostUrl + '/svgs.json',
            sourceName: 'svgs/'
        }).then(function (result) {
            layer.clear();
            new maptalks.Marker(map.getCenter(), {
                symbol: {
                    markerType: 'path',
                    markerPath: '$svgs/airfield.svg',//use $ get icon data
                    'markerPathWidth': 15,
                    'markerPathHeight': 15,
                    'markerWidth': 30,
                    'markerHeight': 30
                }
            }).addTo(layer);
            setTimeout(() => {
                expect(layer).to.be.painted(0, -1);
                done();
            }, 200);
        })
    });



});
