describe('GroupTileLayer', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    function createMap() {
        container = document.createElement('div');
        container.style.width = '30px';
        container.style.height = '30px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
    }

    beforeEach(function () {
        createMap();
    });

    afterEach(function () {
        if (map) {
            map.remove();
        }
        REMOVE_CONTAINER(container);
    });

    it('add to map', function (done) {
        var group = new maptalks.GroupTileLayer('group', [
            new maptalks.TileLayer('tile1', {
                urlTemplate : '#'
            }),
            new maptalks.TileLayer('tile2', {
                urlTemplate : '#'
            })
        ], {
            renderer : 'canvas'
        });
        var group2 = new maptalks.GroupTileLayer('group2', [
            new maptalks.TileLayer('tile1', {
                urlTemplate : '#'
            })
        ], {
            renderer : 'canvas'
        });
        setTimeout(function () {
            var grid = group.getTiles();
            var grid2 = group2.getTiles();
            expect(grid.count).to.be.eql(2);
            expect(grid2.count).to.be.eql(1);
            expect(grid.tileGrids[0].tiles.length).to.be.eql(1);
            expect(grid2.tileGrids[0].tiles.length).to.be.eql(1);
            map.removeLayer(group);
            done();
        }, 80);
        map.addLayer([group, group2]);
    });

    it('show and hide', function (done) {
        var tile1 = new maptalks.TileLayer('tile1', {
            urlTemplate : TILE_IMAGE
        });
        var tile2 = new maptalks.TileLayer('tile2', {
            urlTemplate : TILE_IMAGE
        });
        var group = new maptalks.GroupTileLayer('group', [
            tile1, tile2
        ], {
            fadeAnimation : false,
            renderer : 'canvas'
        });
        group.once('layerload', function () {
            expect(group).to.be.painted();
            tile1.hide();
            tile2.hide();
            expect(group.isVisible()).not.to.be.ok();
            group.once('layerload', function () {
                expect(group).to.be.painted();
                done();
            });
            tile1.show();
            expect(group.isVisible()).to.be.ok();
            tile2.show();
        });
        map.addLayer(group);
    });

    it('event bindings', function () {
        var tile1 = new maptalks.TileLayer('tile1', {
            urlTemplate : '#'
        });
        var tile2 = new maptalks.TileLayer('tile2', {
            urlTemplate : '#'
        });
        var group = new maptalks.GroupTileLayer('group', [
            tile1, tile2
        ], {
            fadeAnimation : false,
            renderer : 'canvas'
        });
        map.addLayer(group);
        expect(tile1.listens('show')).to.be.eql(1);
        expect(tile2.listens('hide')).to.be.eql(1);

        group.remove();

        expect(tile1.listens('show')).to.be.eql(0);
        expect(tile2.listens('hide')).to.be.eql(0);
    });

    it('json', function (done) {
        var group = new maptalks.GroupTileLayer('group', [
            new maptalks.TileLayer('tile1', {
                urlTemplate : TILE_IMAGE
            }),
            new maptalks.TileLayer('tile2', {
                urlTemplate : TILE_IMAGE
            })
        ], {
            renderer : 'canvas'
        });

        var json = group.toJSON();
        expect(json.layers.length).to.be.eql(2);
        expect(json.options.renderer).to.be.eql('canvas');

        var layer = maptalks.Layer.fromJSON(json);
        expect(layer).to.be.a(maptalks.GroupTileLayer);
        expect(layer.options.renderer).to.be.eql('canvas');
        var children = layer.getLayers();
        expect(children.length).to.be.eql(2);
        expect(children[0].getId()).to.be.eql('tile1');
        expect(children[1].getId()).to.be.eql('tile2');

        layer.once('layerload', function () {
            var grid = layer.getTiles();
            expect(grid.tileGrids[0].tiles.length).to.be.eql(1);
            expect(grid.tileGrids[1].tiles.length).to.be.eql(1);
            done();
        });
        map.addLayer(layer);
    });

    it('zoom isVisible', function (done) {
        var group = new maptalks.GroupTileLayer('group', [
            new maptalks.TileLayer('tile1', {
                maxZoom : 17,
                urlTemplate : TILE_IMAGE
            })
        ], {
            renderer : 'canvas'
        });
        group.once('layerload', function () {
            expect(group.isVisible()).to.be.ok();
            map.setZoom(18);
            map.once('zoomend', function () {
                expect(group.isVisible()).not.to.be.ok();
                done();
            });
        });
        map.addLayer(group);
    });

    it('duplicate child layer id should throw exception', function () {
        expect(function () {
            var group = new maptalks.GroupTileLayer('group', [
                new maptalks.TileLayer('tile1', {
                    maxZoom : 17,
                    urlTemplate : TILE_IMAGE
                }),
                new maptalks.TileLayer('tile1', {
                    maxZoom : 17,
                    urlTemplate : TILE_IMAGE
                })
            ]);
        }).to.throwException();
    });

    it('update child layer tile config if map\'s spatial reference changed', function () {
        var t1 = new maptalks.TileLayer('tile1', {
            maxZoom : 17,
            urlTemplate : '#'
        });
        var group = new maptalks.GroupTileLayer('group', [
            t1
        ], {
            renderer : 'canvas'
        });

        map.setBaseLayer(group);

        expect(group._getTileConfig().tileSystem).to.be.eql(maptalks.TileSystem['web-mercator']);
        expect(t1._getTileConfig().tileSystem).to.be.eql(maptalks.TileSystem['web-mercator']);

        map.setSpatialReference({
            projection : 'baidu'
        });

        expect(group._getTileConfig().tileSystem).to.be.eql(maptalks.TileSystem['baidu']);
        expect(t1._getTileConfig().tileSystem).to.be.eql(maptalks.TileSystem['baidu']);
    });

    it('should load less tile placeholders than actual tiles', function (done) {
        var group = new maptalks.GroupTileLayer('group', [
            new maptalks.TileLayer('tile0', {
                urlTemplate : TILE_IMAGE
            }),
            new maptalks.TileLayer('tile1', {
                urlTemplate : TILE_IMAGE
            }),
            new maptalks.TileLayer('tile2', {
                urlTemplate : TILE_IMAGE
            }),
            new maptalks.TileLayer('tile3', {
                urlTemplate : TILE_IMAGE
            }),
        ], {
            placeholder : true,
            renderer : 'canvas'
        });
        map.addLayer(group);
        var allTiles = group.getTiles().tileGrids[0].tiles;
        var renderer = group.getRenderer();
        renderer._drawTiles = function (tiles, parentTiles, childTiles, placeholders) {
            expect(placeholders.length > 0);
            expect(placeholders.length === allTiles.length / 4);
            done();
        };
    });
});
