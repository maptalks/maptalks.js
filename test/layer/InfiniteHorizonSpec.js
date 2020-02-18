describe('Infinite Horizon Specs', function () {

    var map, container;
    var center = new maptalks.Coordinate(-0.113049, 51.498568);

    function createMap(zoom, pitch) {
        container = document.createElement('div');
        container.style.width = '1000px';
        container.style.height = '1000px';
        document.body.appendChild(container);
        var option = {
            zoom: zoom,
            bearning: 100,
            pitch: pitch,
            center: center
        };
        map = new maptalks.Map(container, option);
    }

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '1000px';
        container.style.height = '1000px';
        document.body.appendChild(container);
    });

    afterEach(function () {
        if (map) {
            map.remove();
        }
        REMOVE_CONTAINER(container);
    });

    it('cascade level 0 tiles', function () {
        var cascadePitches = maptalks.Map.prototype.options['cascadePitches'];
        createMap(2, cascadePitches[0]);
        var tile = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#'
        }).addTo(map);
        var tiles = tile.getTiles();
        expect(tiles.tileGrids.length).to.be.eql(1);
        expect(tiles.tileGrids[0].tiles.length).to.be.eql(24);
    });

    it('cascade level 1 tiles', function () {
        var cascadePitches = maptalks.Map.prototype.options['cascadePitches'];
        createMap(2, cascadePitches[1]);
        var tile = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#'
        }).addTo(map);
        var tiles = tile.getTiles();
        expect(tiles.tileGrids.length).to.be.eql(2);
        expect(tiles.tileGrids[0].tiles.length).to.be.eql(32);
        expect(tiles.tileGrids[1].tiles.length).to.be.eql(16);
    });

    it('cascade level 1 tiles at level 0', function () {
        var cascadePitches = maptalks.Map.prototype.options['cascadePitches'];
        createMap(0, cascadePitches[1]);
        var tile = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#'
        }).addTo(map);
        var tiles = tile.getTiles();
        expect(tiles.tileGrids.length).to.be.eql(1);
        expect(tiles.tileGrids[0].tiles.length).to.be.eql(84);
    });

    it('cascade level 2 tiles at level 2', function () {
        var maxVisualPitch = maptalks.Map.prototype.options['maxVisualPitch'];
        createMap(2, maxVisualPitch);
        var tile = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#'
        }).addTo(map);
        var tiles = tile.getTiles();
        expect(tiles.tileGrids.length).to.be.eql(1);
        expect(tiles.tileGrids[0].tiles.length).to.be.eql(36);
    });

    it('cascade level 2 tiles', function () {
        var maxVisualPitch = maptalks.Map.prototype.options['maxVisualPitch'];
        createMap(5, maxVisualPitch);
        var tile = new maptalks.TileLayer('tile', {
            renderer : 'canvas',
            urlTemplate : '#'
        }).addTo(map);
        var tiles = tile.getTiles();
        expect(tiles.tileGrids.length).to.be.eql(3);
        expect(tiles.tileGrids[0].tiles.length).to.be.eql(30);
        expect(tiles.tileGrids[1].tiles.length).to.be.eql(2);
        expect(tiles.tileGrids[2].tiles.length).to.be.eql(22);
    });
});
