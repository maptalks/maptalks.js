describe('TileConfig', function () {

    var map, container;

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '1px';
        container.style.height = '1px';
        document.body.appendChild(container);
    });

    afterEach(function () {
        if (map) {
            map.remove();
        }
        REMOVE_CONTAINER(container);
    });

    it('should getTilePrjExtent with 3857 projection', function () {
        var option = {
            zoom: 13,
            center: [-0.09, 51.505]
        };
        map = new maptalks.Map(container, option);
        var z = 13, x = 4093, y = 2724;

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

        var z = 13, x = 1644, y = 440;

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

    it('tile index in full extent', function () {
        var tileSystem = [1,1,-20037508.34,-20037508.34];
        var fullExtent = {
            bottom: 3574191.5907699764,
            left: 11581589.65334464,
            right: 11588412.424935361,
            top: 3579213.587178574
        };

        var tileConfig = new maptalks.TileConfig(tileSystem, fullExtent, new maptalks.Size(256, 256));
        var fullIndex = tileConfig._getTileFullIndex(19.109257071294063);
        console.log(fullIndex.toString());
        expect(fullIndex.toString()).to.be.eql('6463,4826,6464,4827');
    });
});
