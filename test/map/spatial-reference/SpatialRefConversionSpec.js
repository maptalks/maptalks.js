describe('#SpatialReference.Conversion', function () {
    beforeEach(function () {

    });

    afterEach(function () {
        REMOVE_CONTAINER();
    });

    function prepareMap(fullExtent) {
        var container = document.createElement('div');
        container.style.width = '100px';
        container.style.height = '100px';
        document.body.appendChild(container);
        return  new maptalks.Map(container, {
            'spatialReference' : {
                'resolutions' : [1, 2, 4],
                'projection' : 'EPSG:4326',
                'fullExtent' : fullExtent
            },
            'zoom' : 1,
            'center' : [0, 0]
        });
    }

    it('2d point system', function () {
        //reverse the x, y direction
        var map = prepareMap({
            'top':  -90,
            'left': 180,
            'bottom': 90,
            'right': -180
        });
        //2d point system is always same as
        var p1 = map.coordinateToPoint(new maptalks.Coordinate([180, -90]));
        var p2 = map.coordinateToPoint(new maptalks.Coordinate([-180, 90]));
        var c1 = map.coordinateToContainerPoint(new maptalks.Coordinate([180, -90]));
        var c2 = map.coordinateToContainerPoint(new maptalks.Coordinate([-180, 90]));
        expect(p1.x < p2.x && p1.y > p2.y).to.be.ok();
        expect(c1.x < c2.x && c1.y < c2.y).to.be.ok();
    });

    it('2d point system 2', function () {
        //reverse the x, y direction
        var map = prepareMap({
            'top':  90,
            'left': -180,
            'bottom': -90,
            'right': 180
        });
        //2d point system is always same as
        var p1 = map.coordinateToPoint(new maptalks.Coordinate([-180, 90]));
        var p2 = map.coordinateToPoint(new maptalks.Coordinate([180, -90]));
        var c1 = map.coordinateToContainerPoint(new maptalks.Coordinate([-180, 90]));
        var c2 = map.coordinateToContainerPoint(new maptalks.Coordinate([180, -90]));
        expect(p1.x < p2.x && p1.y > p2.y).to.be.ok();
        expect(c1.x < c2.x && c1.y < c2.y).to.be.ok();
    });
});
