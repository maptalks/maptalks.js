describe('GroupTileLayer', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    function createMap() {
        container = document.createElement('div');
        container.style.width = '3px';
        container.style.height = '3px';
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
                urlTemplate : '/resources/tile.png'
            }),
            new maptalks.TileLayer('tile2', {
                urlTemplate : '/resources/tile.png'
            })
        ], {
            renderer : 'canvas'
        });
        group.once('layerload', function () {
            var grid = group.getTiles();
            expect(grid.tiles.length).to.be.eql(32);
            map.removeLayer(group);
            done();
        });
        map.addLayer(group);
    });

    it('json', function (done) {
        var group = new maptalks.GroupTileLayer('group', [
            new maptalks.TileLayer('tile1', {
                urlTemplate : '/resources/tile.png'
            }),
            new maptalks.TileLayer('tile2', {
                urlTemplate : '/resources/tile.png'
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

            expect(grid.tiles.length).to.be.eql(32);
            done();
        });
        map.addLayer(layer);
    });
});
