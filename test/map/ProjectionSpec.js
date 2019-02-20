describe('Map.Projection', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '100px';
        container.style.height = '100px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:false,
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('customize projection', function () {
        var custom = {
            project : function (c) {
                return c.add(1, 1);
            },

            unproject : function (c) {
                return c.sub(1, 1);
            }
        };

        map.setSpatialReference({
            'projection': custom,
            'resolutions': (function () {
                var resolutions = [];
                for (var i = 0; i < 10; i++) {
                    resolutions[i] = 4 / Math.pow(2, i);
                }
                return resolutions;
            })(),
            'fullExtent': {
                'top'   : 100000,
                'left'  : 0,
                'right' : 100000,
                'bottom' : 0
            }
        });

        var projection = map.getProjection();
        var coords = [
            new maptalks.Coordinate(0, 0),
            new maptalks.Coordinate(1, 1)
        ];
        var expected = [[1, 1], [2, 2]];
        var actual = maptalks.Coordinate.toNumberArrays(projection.projectCoords(coords));
        expect(actual).to.be.eql(expected);
    });

    describe('is default projection', function () {
        it('default projection is EPSG:3857', function () {
            var projection = map.getProjection();
            expect(projection.code).to.be.eql('EPSG:3857');
        });
    });

    describe('change to EPSG:4326', function () {
        it('change to EPSG:4326', function () {
            map.setSpatialReference({
                projection:'EPSG:4326'
            });
            expect(map.getProjection().code).to.be.eql('EPSG:4326');
            expect(map.getCenter()).to.closeTo(center);
        });

        it('change to EPSG:4490', function () {
            map.setSpatialReference({
                projection:'EPSG:4490'
            });
            expect(map.getProjection().code).to.be.eql('EPSG:4490');
            expect(map.getCenter()).to.closeTo(center);
        });

        it('change center before changing spatial reference', function () {
            var newCenter = new maptalks.Coordinate(100, 0);
            map.setCenter(newCenter);
            map.config({
                spatialReference : {
                    projection:'EPSG:4326'
                }
            });
            expect(map.getProjection().code).to.be.eql('EPSG:4326');
            expect(map.getCenter()).to.closeTo(newCenter);
        });
    });

    describe('change to IDENTITY', function () {
        it('change to IDENTITY', function () {
            map.setSpatialReference({
                projection:'IDENTITY',
                resolutions : [1, 10, 20],
                fullExtent:{
                    'top':0,
                    'left':0,
                    'bottom':1000000,
                    'right':1000000
                }
            });
            expect(map.getProjection().code).to.be.eql('IDENTITY');
            expect(map.getCenter()).to.closeTo(center);
            expect(map.computeLength([0, 10], [0, 20])).to.be.eql(10);
            var circle = new maptalks.Circle([10, 10], 1);
            expect(map.computeGeometryArea(circle)).to.be.eql(Math.PI);
            var polygon = new maptalks.Polygon([
                [0, 0], [0, 10], [10, 10], [10, 0]
            ]);
            expect(map.computeGeometryArea(polygon)).to.be.eql(100);
            expect(map.locate([0, 0], 10, 10)).to.be.eql(new maptalks.Coordinate(10, 10));
        });

        it('fit to extent in IDENTITY projection', function () {
            // a bug reported by @1dent1ty in 2017-11-09
            map.setSpatialReference({
                projection:'identity',
                resolutions: [
                    156543.03392804097,
                    78271.51696402048,
                    9135.75848201024,
                    19567.87924100512,
                    9783.93962050256,
                    4891.96981025128,
                    2445.98490512564,
                    1222.99245256282,
                    611.49622628141,
                    305.748113140705,
                    152.8740565703525,
                    76.43702828517625,
                    38.21851414258813,
                    19.109257071294063,
                    9.554628535647032,
                    4.777314267823516,
                    2.388657133911758,
                    1.194328566955879,
                    0.5971642834779395,
                    0.29858214173896974
                ],
                fullExtent : {
                    'top': 6378137 * Math.PI,
                    'left': -6378137 * Math.PI,
                    'bottom': -6378137 * Math.PI,
                    'right': 6378137 * Math.PI
                }
            });
            map.setMaxExtent(new maptalks.Extent([453136.979,4078961.066,533971.862,4145348.864]));
            var z = map.getFitZoom(map.getMaxExtent());
            expect(z).to.be.eql(7);
        });

        it('rotate polygon with  IDENTITY projection, #726', function () {
            map.setSpatialReference({
                projection:'IDENTITY',
                resolutions : [1, 10, 20],
                fullExtent:{
                    'top':0,
                    'left':0,
                    'bottom':1000000,
                    'right':1000000
                }
            });

            var vecLayer = new maptalks.VectorLayer('field').addTo(map);
            var baseGeom = new maptalks.Polygon([[[0,0],[0,20],[20,30],[20,0]]], {
                symbol : {
                lineWidth : 2,
                lineColor : '#000',
                polygonFill : 'rgb(129, 0, 0)'
                }
            })
            baseGeom.copy().addTo(vecLayer)
                .translate(90,90)
                .rotate(30).rotate(30).rotate(30);
            var geojson = {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[0,0],[0,20],[20,30],[20,0],[0,0]]]},"properties":null};
            expect(baseGeom.toGeoJSON()).to.be.eqlGeoJSON(geojson);
        });
    });

    describe('change to Baidu', function () {
        it('change to baidu', function () {
            map.setSpatialReference({
                projection:'baidu'
            });
            map.options['minZoom'] = null;
            expect(map.getMinZoom()).to.be.eql(3);
            expect(map.getProjection().code).to.be.eql('BAIDU');
            expect(map.getCenter()).to.closeTo(center);
        });

        it('baidu projection with Infinity', function () {
            var baiduProj = maptalks.SpatialReference.getProjectionInstance('baidu');
            var a = baiduProj.project(new maptalks.Coordinate(Infinity, -Infinity));
            var b = baiduProj.project(new maptalks.Coordinate(-Infinity, -Infinity));
        });
    });
});

