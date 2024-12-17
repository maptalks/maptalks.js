describe('GeoJSON', function () {
    //examples are from geoJSON.org
    var geoJSONs = [

        { 'type': 'Point', 'coordinates': [100.0, 0.0] },
        {
            'type': 'LineString',
            'coordinates': [[100.0, 0.0], [101.0, 1.0]]
        },
        //Polygon without Holes
        {
            'type': 'Polygon',
            'coordinates': [
                [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]]
            ]
        },
        //Polygon with Holes
        {
            'type': 'Polygon',
            'coordinates': [
                [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
            ]
        },
        {
            'type': 'MultiPoint',
            'coordinates': [[100.0, 0.0], [101.0, 1.0]]
        },
        {
            'type': 'MultiLineString',
            'coordinates': [
                [[100.0, 0.0], [101.0, 1.0]],
                [[102.0, 2.0], [103.0, 3.0]]
            ]
        },
        {
            'type': 'MultiPolygon',
            'coordinates': [
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
            'type': 'GeometryCollection',
            'geometries': [
                { 'type': 'Point',
                    'coordinates': [100.0, 0.0]
                },
                { 'type': 'LineString',
                    'coordinates': [[101.0, 0.0], [102.0, 1.0]]
                }
            ]
        }
    ];

    var featureCollectionGeoJSON = {
        'type': 'FeatureCollection',
        'features': [
            { 'type': 'Feature',
                'geometry': { 'type': 'Point', 'coordinates': [102.0, 0.5] },
                'properties': { 'prop0': 'value0' }
            },
            { 'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': [
                        [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
                    ]
                },
                'properties': {
                    'prop0': 'value0',
                    'prop1': 0.0
                }
            },
            { 'type': 'Feature',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [
                        [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                            [100.0, 1.0], [100.0, 0.0]]
                    ]
                },
                'properties': {
                    'prop0': 'value0',
                    'prop1': { 'this': 'that' }
                }
            }
        ]
    };

    describe('geojson to coordinate', function () {
        var geoJSONCoords = [
            [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
        ];
        var result = maptalks.Coordinate.toCoordinates(geoJSONCoords);
        expect(result).to.have.length(geoJSONCoords.length);
        expect(result[0]).to.eql(new maptalks.Coordinate(geoJSONCoords[0]));
        var reverse = maptalks.Coordinate.toNumberArrays(result);
        expect(reverse).to.eql(geoJSONCoords);
    });

    describe('parse FeatureCollection', function () {
        var fJsons = featureCollectionGeoJSON['features'];
        var features = maptalks.GeoJSON.toGeometry(featureCollectionGeoJSON);
        it('parse FeatureCollection', function () {
            expect(features).to.have.length(3);
            expect(features[0]).to.an(maptalks.Marker);
            expect(features[0].toGeoJSON()).to.eql(fJsons[0]);
            expect(features[0].getProperties()).to.eql(featureCollectionGeoJSON['features'][0]['properties']);
            expect(features[1]).to.an(maptalks.LineString);
            expect(features[1].toGeoJSON()).to.eql(fJsons[1]);
            expect(features[2]).to.an(maptalks.Polygon);
            expect(features[2].toGeoJSON()).to.eql(fJsons[2]);
        });

    });

    describe('parse GeoJSON Objects', function () {
        var geometries = maptalks.GeoJSON.toGeometry(geoJSONs);

        it('parse GeoJSON Objects', function () {
            expect(geometries).to.have.length(geoJSONs.length);
        });

        it('evaluate point', function () {
            var point = geometries[0];
            expect(point).to.an(maptalks.Marker);
            expect(point.getType()).to.eql(geoJSONs[0].type);
            expect(point.getCenter()).to.eql(new maptalks.Coordinate(geoJSONs[0]['coordinates']));
            expect(point.toGeoJSON()['geometry']).to.eql(geoJSONs[0]);
            expect(point.toGeoJSONGeometry()).to.eql(geoJSONs[0]);
        });

        it('evaluate polyline', function () {
            var polyline = geometries[1];
            expect(polyline).to.an(maptalks.LineString);
            expect(polyline.getType()).to.eql(geoJSONs[1].type);
            expect(polyline.toGeoJSON()['geometry']).to.eql(geoJSONs[1]);
            expect(polyline.toGeoJSONGeometry()).to.eql(geoJSONs[1]);
        });

        it('evaluate polygon', function () {
            var polygon = geometries[2];
            expect(polygon).to.an(maptalks.Polygon);
            expect(polygon.getType()).to.eql(geoJSONs[2].type);
            expect(polygon.toGeoJSON()['geometry']).to.eql(geoJSONs[2]);
            expect(polygon.toGeoJSONGeometry()).to.eql(geoJSONs[2]);
        });

        it('evaluate polygon with holes', function () {
            var polygon = geometries[3];
            expect(polygon).to.an(maptalks.Polygon);
            expect(polygon.toGeoJSON()['geometry']).to.eql(geoJSONs[3]);
            expect(polygon.toGeoJSONGeometry()).to.eql(geoJSONs[3]);
            var holes = polygon.getHoles();
            expect(holes).to.have.length(1);
        });

        it('evaluate multipoint', function () {
            var multipoint = geometries[4];
            expect(multipoint).to.an(maptalks.MultiPoint);
            expect(multipoint.getType()).to.eql(geoJSONs[4].type);
            expect(multipoint.toGeoJSON()['geometry']).to.eql(geoJSONs[4]);
            expect(multipoint.toGeoJSONGeometry()).to.eql(geoJSONs[4]);
        });

        it('evaluate MultiLineString', function () {
            var multiPolyline = geometries[5];
            expect(multiPolyline).to.an(maptalks.MultiLineString);
            expect(multiPolyline.getType()).to.eql(geoJSONs[5].type);
            expect(multiPolyline.toGeoJSON()['geometry']).to.eql(geoJSONs[5]);
            expect(multiPolyline.toGeoJSONGeometry()).to.eql(geoJSONs[5]);
        });

        it('evaluate MultiPolygon', function () {
            var multiPolygon = geometries[6];
            expect(multiPolygon).to.an(maptalks.MultiPolygon);
            expect(multiPolygon.getType()).to.eql(geoJSONs[6].type);
            expect(multiPolygon.toGeoJSON()['geometry']).to.eql(geoJSONs[6]);
            expect(multiPolygon.toGeoJSONGeometry()).to.eql(geoJSONs[6]);
        });

        it('evaluate GeometryCollection', function () {
            var geometryCollection = geometries[7];
            expect(geometryCollection).to.an(maptalks.GeometryCollection);
            expect(geometryCollection.getType()).to.eql(geoJSONs[7].type);
            expect(geometryCollection.toGeoJSON()['geometry']).to.eql(geoJSONs[7]);
            expect(geometryCollection.toGeoJSONGeometry()).to.eql(geoJSONs[7]);
        });

    });

    describe('foreach call back', function () {

        it('FeatureCollection', function () {
            var fJsons = featureCollectionGeoJSON['features'];
            var features = maptalks.GeoJSON.toGeometry(featureCollectionGeoJSON, function (geometry) {
                expect(geometry).have.property('properties');
                geometry.config('zIndex', 0);
            });
            for (var i = 0; i < features.length; i++) {
                expect(features[i].options['zIndex']).to.be.eql(0);
            }
        });

        it('evaluate point', function () {
            var point = maptalks.GeoJSON.toGeometry(geoJSONs[0], function (geometry) {
                geometry.config('zIndex', 0);
            });
            expect(point.options['zIndex']).to.be.eql(0);
        });
    });

});
