describe('Geometry.toGeoJSON', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        layer = new maptalks.VectorLayer('canvas');
        map.addLayer(layer);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('coordinates serialize carry z value', function (done) {
        const altitude = Math.random() * 10;
        const lefttop = [-0.01, 0.01, altitude], righttop = [0.01, 0.01, altitude], rightbottom = [0.01, -0.01, altitude], leftbottom = [-0.01, -0.01, altitude];
        const point = new maptalks.Marker(lefttop);
        const multipoint = new maptalks.MultiPoint([lefttop, lefttop]);
        const line = new maptalks.LineString([lefttop, righttop]);
        const multiline = new maptalks.MultiLineString([[lefttop, righttop], [lefttop, righttop]]);
        const polygon = new maptalks.Polygon([[lefttop, righttop, rightbottom, leftbottom]]);
        const multipolygon = new maptalks.MultiPolygon([[[lefttop, righttop, rightbottom, leftbottom]], [[lefttop, righttop, rightbottom, leftbottom]]]);
        const rectange = new maptalks.Rectangle(lefttop, 2000, 1000);
        const ellispe = new maptalks.Ellipse(lefttop, 2000, 1000);
        const sector = new maptalks.Sector(lefttop, 1000, 0, 90);
        const circle = new maptalks.Circle(lefttop, 1000);

        const getFirstCoordinateZvalue = (featureJSON) => {
            let coordinates = featureJSON.geometry.coordinates;
            while (Array.isArray(coordinates[0])) {
                coordinates = coordinates[0];
            }
            return coordinates[2];
        }
        const geos = [point, multipoint, line, multiline, polygon, multipolygon, circle, rectange, ellispe, sector];
        geos.forEach(geo => {
            const featureJSON = geo.toGeoJSON();
            const z = getFirstCoordinateZvalue(featureJSON);
            expect(z).to.be.eql(altitude);
        });
        done();
    });


});
