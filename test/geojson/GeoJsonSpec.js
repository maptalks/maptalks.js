describe('GeoJSON', function() {
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
            "type":"Circle",
            "coordinates":[100.0,0.0],
            "radius":100
        },
        {
            "type":"Ellipse",
            "coordinates":[100.0,0.0],
            "width":100,
            "height":50
        },
        {
            "type":"Rectangle",
            "coordinates":[100.0,0.0],
            "width":100,
            "height":50
        },
        {
            "type":"Sector",
            "coordinates":[100.0,0.0],
            "radius":1000,
            "startAngle":50,
            "endAngle":120
        }
    ];

    var featureCollectionGeoJSON = {
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
    };

    beforeEach(function() {

    });

    afterEach(function() {

    });

    describe('geojson to coordinate',function(){
        var geoJSONCoords = [
            [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
        ];
        var result = Z.GeoJSON.fromGeoJSONCoordinates(geoJSONCoords);
        expect(result).to.have.length(geoJSONCoords.length);
        expect(result[0]).to.eql(new Z.Coordinate(geoJSONCoords[0]));
        var reverse = Z.GeoJSON.toGeoJSONCoordinates(result);
        expect(reverse).to.eql(geoJSONCoords);
    });

    describe('parse FeatureCollection',function(){
        var fJsons = featureCollectionGeoJSON['features'];
        var features = Z.GeoJSON.fromGeoJSON(featureCollectionGeoJSON);
        it('parse FeatureCollection', function() {
            expect(features).to.have.length(3);
            expect(features[0]).to.an(Z.Marker);
            expect(features[0].toGeoJSON()).to.eql(fJsons[0]);
            expect(features[0].getProperties()).to.eql(featureCollectionGeoJSON['features'][0]['properties']);
            expect(features[1]).to.an(Z.Polyline);
            expect(features[1].toGeoJSON()).to.eql(fJsons[1]);
            expect(features[2]).to.an(Z.Polygon);
            expect(features[2].toGeoJSON()).to.eql(fJsons[2]);
        });

    });

    describe('parse GeoJSON Objects', function() {
        var geometries = Z.GeoJSON.fromGeoJSON(geoJSONs);
        beforeEach(function() {
        });

        afterEach(function() {
        });

        it('parse GeoJSON Objects', function() {
            expect(geometries).to.have.length(geoJSONs.length);
        });

        it('evaluate point', function() {
            var point = geometries[0];
            expect(point).to.an(Z.Marker);
            expect(point.getType()).to.eql(geoJSONs[0].type);
            expect(point.getCenter()).to.eql(new Z.Coordinate(geoJSONs[0]['coordinates']));
            expect(point.toGeoJSON()['geometry']).to.eql(geoJSONs[0]);
        });

        it('evaluate polyline', function() {
            var polyline = geometries[1];
            expect(polyline).to.an(Z.Polyline);
            expect(polyline.getType()).to.eql(geoJSONs[1].type);
            expect(polyline.toGeoJSON()['geometry']).to.eql(geoJSONs[1]);
        });

        it('evaluate polygon', function() {
            var polygon = geometries[2];
            expect(polygon).to.an(Z.Polygon);
            expect(polygon.getType()).to.eql(geoJSONs[2].type);
            expect(polygon.toGeoJSON()['geometry']).to.eql(geoJSONs[2]);
        });

        it('evaluate polygon with holes', function() {
            var polygon = geometries[3];
            expect(polygon).to.an(Z.Polygon);
            expect(polygon.toGeoJSON()['geometry']).to.eql(geoJSONs[3]);
            var holes = polygon.getHoles();
            expect(holes).to.have.length(1);
        });

        it('evaluate multipoint', function() {
            var multipoint = geometries[4];
            expect(multipoint).to.an(Z.MultiPoint);
            expect(multipoint.getType()).to.eql(geoJSONs[4].type);
            expect(multipoint.toGeoJSON()['geometry']).to.eql(geoJSONs[4]);
        });

        it('evaluate MultiLineString', function() {
            var multiPolyline = geometries[5];
            expect(multiPolyline).to.an(Z.MultiPolyline);
            expect(multiPolyline.getType()).to.eql(geoJSONs[5].type);
            expect(multiPolyline.toGeoJSON()['geometry']).to.eql(geoJSONs[5]);
        });

        it('evaluate MultiPolygon', function() {
            var multiPolygon = geometries[6];
            expect(multiPolygon).to.an(Z.MultiPolygon);
            expect(multiPolygon.getType()).to.eql(geoJSONs[6].type);
            expect(multiPolygon.toGeoJSON()['geometry']).to.eql(geoJSONs[6]);
        });

        it('evaluate GeometryCollection', function() {
            var geometryCollection = geometries[7];
            expect(geometryCollection).to.an(Z.GeometryCollection);
            expect(geometryCollection.getType()).to.eql(geoJSONs[7].type);
            expect(geometryCollection.toGeoJSON()['geometry']).to.eql(geoJSONs[7]);
        });

        it('evaluate Circle', function() {
            var circle = geometries[8];
            expect(circle).to.an(Z.Circle);
            expect(circle.getType()).to.eql(geoJSONs[8].type);
            expect(circle.toGeoJSON()['geometry']).to.eql(geoJSONs[8]);
        });

        it('evaluate Ellipse', function() {
            var ellipse = geometries[9];
            expect(ellipse).to.an(Z.Ellipse);
            expect(ellipse.getType()).to.eql(geoJSONs[9].type);
            expect(ellipse.toGeoJSON()['geometry']).to.eql(geoJSONs[9]);
        });

        it('evaluate Rectangle', function() {
            var rect = geometries[10];
            expect(rect).to.an(Z.Rectangle);
            expect(rect.getType()).to.eql(geoJSONs[10].type);
            expect(rect.toGeoJSON()['geometry']).to.eql(geoJSONs[10]);
        });

        it('evaluate Sector', function() {
            var sector = geometries[11];
            expect(sector).to.an(Z.Sector);
            expect(sector.getType()).to.eql(geoJSONs[11].type);
            expect(sector.toGeoJSON()['geometry']).to.eql(geoJSONs[11]);
        });

    });

});
