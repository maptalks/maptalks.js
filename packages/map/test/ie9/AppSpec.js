describe('IE9.Specs', function () {

    var container;
    var map;
    var layer;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
    });

    afterEach(function () {
        if (map) map.remove();
        REMOVE_CONTAINER(container);
    });

    it('add a tile layer and a vectorlayer', function (done) {
        if (!maptalks.Browser.ie9) {
            done();
            return;
        }
        map = new maptalks.Map(container, {
            center : [118.846825, 32.046534],
            zoom : 12,
            baseLayer : new maptalks.TileLayer('t', {
                urlTemplate : TILE_IMAGE
            })
        });

        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        var layer = new maptalks.VectorLayer('v', geometries).addTo(map);

        setTimeout(function () {
            done();
        }, 1000);
    });
});
