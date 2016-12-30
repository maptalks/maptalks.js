
describe('#GeoJSONLayer', function() {
    //examples are from geoJSON.org
    var geoJSONs = [

        { "type": "Point", "coordinates": [100.0, 0.0] },
        {
            "type": "LineString",
            "coordinates": [ [100.0, 0.0], [101.0, 1.0] ]
        },
        //Polygon without Holes
        {
            "type": "Polygon",
            "coordinates": [
                [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]
            ]
        },
        //Polygon with Holes
        {
            "type": "Polygon",
            "coordinates": [
                [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ],
                [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2] ]
            ]
        },
        {
            "type": "MultiPoint",
            "coordinates": [ [100.0, 0.0], [101.0, 1.0] ]
        },
        {
            "type": "MultiLineString",
            "coordinates": [
                [ [100.0, 0.0], [101.0, 1.0] ],
                [ [102.0, 2.0], [103.0, 3.0] ]
            ]
        },
        {
            "type": "MultiPolygon",
            "coordinates": [
                [
                    [[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]
                ],
                [
                    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
                ]
            ]
        },
        {
            "type": "GeometryCollection",
            "geometries": [
                { "type": "Point",
                  "coordinates": [100.0, 0.0]
                },
                { "type": "LineString",
                  "coordinates": [ [101.0, 0.0], [102.0, 1.0] ]
                }
            ]
        },
        {
            "type": "FeatureCollection",
            "features": [
                { "type": "Feature",
                  "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
                  "properties": {"prop0": "value0"}
                },
                { "type": "Feature",
                  "geometry": {
                      "type": "LineString",
                      "coordinates": [
                          [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
                      ]
                  },
                  "properties": {
                      "prop0": "value0",
                      "prop1": 0.0
                  }
                },
                { "type": "Feature",
                  "geometry": {
                      "type": "Polygon",
                      "coordinates": [
                          [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                            [100.0, 1.0], [100.0, 0.0] ]
                      ]
                  },
                  "properties": {
                      "prop0": "value0",
                      "prop1": {"this": "that"}
                  }
                }
            ]
        }
    ];


    var container;
    var map;

    beforeEach(function() {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: [100, 0]
        };
        map = new Map(container, option);
    });

    afterEach(function() {
        removeContainer(container);
    });

    it('create', function () {
        var count = geoJSONs.length + 2,
            pos = geoJSONs.length - 1;
        var layer = new GeoJSONLayer('v', {'visible' : true}).addTo(map);
        layer.addData(geoJSONs);
        var json = layer.toJSON();
        expect(json).to.be.ok();
        expect(json['geojson']).to.have.length(count);
        expect(json['geojson'].slice(0, pos)).to.be.eql(geoJSONs.slice(0, pos));
    });

    it('from/toJSON', function () {
        var count = geoJSONs.length + 2,
            pos = geoJSONs.length - 1;
        var layer = new GeoJSONLayer('v', geoJSONs).addTo(map);
        var json = layer.toJSON();
        expect(json).to.be.ok();
        expect(json['geojson']).to.have.length(count);
        expect(json['geojson'].slice(0, pos)).to.be.eql(geoJSONs.slice(0, pos));

        var layer2 = Layer.fromJSON(json);
        expect(layer2).to.be.a(GeoJSONLayer);
        expect(layer2.getCount()).to.be.eql(count);
    });

    it('add again', function (done) {
        var count = geoJSONs.length + 2;
        var layer = new GeoJSONLayer('v', geoJSONs).addTo(map);
        expect(layer.getCount()).to.be(count);
        map.removeLayer(layer);
        expect(layer.getCount()).to.be(count);
        layer.on('layerload', function () {
            expect(layer.getCount()).to.be(count);
            expect(layer).to.be.painted(0, -5);
            done();
        });
        map.addLayer(layer);
    });



});
