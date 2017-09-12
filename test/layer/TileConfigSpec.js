describe('TileConfig', function () {

    var map, container;

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '1px';
        container.style.height = '1px';
        document.body.appendChild(container);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('should getTilePrjExtent with 3857 projection', function () {
        var option = {
            zoom: 13,
            center: [-0.09, 51.505]
        };
        map = new maptalks.Map(container, option);

        const [z, x, y] = [13, 4093, 2724];

        // getTileConfig
        const size = 256;
        const srs = map.getSpatialReference();
        const projection = srs.getProjection();
        const tileSystem = maptalks.TileSystem.getDefault(projection);
        const fullExtent = srs.getFullExtent();
        const tileConfig = new maptalks.TileConfig(tileSystem, fullExtent, new maptalks.Size(size, size));

        // tileCoordToExtent
        const res = srs.getResolution(z);
        const extent = tileConfig.getTilePrjExtent(x, y, res);

        expect(extent.contains(projection.project(new maptalks.Coordinate(-0.09, 51.5)))).to.be.ok();
    });

    it('should getTilePrjExtent with baidu projection', function () {
        var option = {
            zoom: 13,
            center: [121, 31],
            spatialReference: {
                projection: 'BAIDU'
            }
        };
        map = new maptalks.Map(container, option);

        var [z, x, y] = [13, 1644, 440];

        // getTileConfig
        var size = 256;
        var srs = map.getSpatialReference();
        var projection = srs.getProjection();
        var tileSystem = maptalks.TileSystem.getDefault(projection);
        var fullExtent = srs.getFullExtent();
        var tileConfig = new maptalks.TileConfig(tileSystem, fullExtent, new maptalks.Size(size, size));

        // tileCoordToExtent
        var res = srs.getResolution(z);
        var extent = tileConfig.getTilePrjExtent(x, y, res);

        expect(extent.contains(projection.project(new maptalks.Coordinate(121, 30.996)))).to.be.ok();
    });
});
