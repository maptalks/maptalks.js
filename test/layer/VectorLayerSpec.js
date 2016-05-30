// var utils = require('../SpecUtils.js');

describe('VectorLayer', function() {

    var container;
    var map;
    var tile, layer;
    var center = new Z.Coordinate(118.846825, 32.046534);

    beforeEach(function() {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new Z.Map(container, option);
        tile = new Z.TileLayer('tile', {

            urlTemplate:"http://t{s}.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}",
            subdomains: [1, 2, 3]
        });
        layer = new Z.VectorLayer('id');
    });

    afterEach(function() {
        removeContainer(container);
    });

    describe('can addGeometry', function() {
        beforeEach(function() {
            map.setBaseLayer(tile);
            map.addLayer(layer);
        });

        afterEach(function() {
            map.removeLayer(layer);
        });

        it('all type of geometry', function(done) {
            expect(function() {
                layer.addGeometry([],true);

                layer.on('layerload', function() {
                    map.on('zoomend', function() {
                        done();
                    });
                    map.zoomOut();

                });
            }).to.not.throwException();

        });

        it('empty geometries', function(done) {
            var geometries = genAllTypeGeometries();
            map.on('zoomend', function() {
                done();
            });
            layer.on('layerload', function() {
                map.on('zoomend', function() {
                    map.panBy(new maptalks.Point(1,1));
                });
                map.zoomOut();
            })
            expect(function() {
                layer.addGeometry(geometries,true);
            }).to.not.throwException();
        });
    });



    /*it('hit detect', function(done) {
        function dragMap() {
            var center = map.getCenter();
            var spy = sinon.spy();

            var domPosition = maptalks.DomUtil.getPagePosition(container);
            var point = map.coordinateToContainerPoint(center).add(domPosition);
            happen.mousedown(map._panels.mapPlatform,{
                    'clientX':point.x,
                    'clientY':point.y
                    });
            happen.mousemove(document,{
                    'clientX':point.x + 1,
                    'clientY':point.y + 1
                    });
            happen.mouseup(document);
        }
        map.on('moveend', function(done) {
            done();
        });
        layer.clear();
        map.addLayer(layer);
        layer.once('layerload', function() {
            dragMap();
        });
        layer.addGeometry(new maptalks.Circle(map.getCenter(), 1000));
    });*/

    it('set drawOnce option', function(done) {
        layer.clear();
        layer.config({
            'drawOnce' : true,
            'drawImmediate' : true
        });
        map.addLayer(layer);
        var geometries = genAllTypeGeometries();

        map.on('moveend', function() {
            map.removeLayer(layer);
            done();
        });
        var counter = 0;
        map.on('zoomend', function() {
            if (counter === 0) {
                map.zoomIn();
                counter++;
            } else {
                map.panBy(new maptalks.Point(10,10));
            }

        });
        layer.on('layerload', function() {
            map.zoomOut();
        })
        expect(function() {
            layer.addGeometry(geometries);
        }).to.not.throwException();
    });

    describe('can setStyle', function() {
        function testStyle(style, hitIndex, symbols) {
            layer.clear();
            var points = [
                new maptalks.Marker([0,0], {
                    properties : {
                        'foo1' : 1,
                        'foo2' : 'test1',
                        'foo3' : true
                    }
                }),
                new maptalks.Marker([0,0], {
                    properties : {
                        'foo1' : 2,
                        'foo2' : 'test2',
                        'foo3' : false
                    }
                }),
                new maptalks.Marker([0,0], {
                    properties : {
                        'foo1' : 3,
                        'foo2' : 'test3',
                        'foo3' : true
                    }
                }),
                new maptalks.Marker([0,0], {
                    properties : {
                        'foo1' : 4,
                        'foo2' : 'test4',
                        'foo3' : true
                    }
                }),
                new maptalks.Circle([0,0], 100, {
                    properties : {
                        'foo1' : 5,
                        'foo2' : 'test5',
                        'foo3' : true
                    }
                })
            ];

            var defaultSymbols = [];
            layer.addGeometry(points).forEach(function(geometry) {
                defaultSymbols.push(geometry.getSymbol());
            }).setStyle(style);

            expect(layer.getStyle()).to.be.eql(style);

            for (var i = 0; i < points.length; i++) {
                var hit = hitIndex.indexOf(i);
                if (hitIndex.indexOf(i) >= 0) {
                    expect(points[i].getSymbol()).to.be.eql(symbols[hit]);
                } else {
                    expect(points[i].getSymbol()).to.be.eql(defaultSymbols[i]);
                }
            }

            var geoAddLater = points[hitIndex[0]].copy();
            geoAddLater.setSymbol(null);
            layer.addGeometry(geoAddLater);
            expect(geoAddLater.getSymbol()).to.be.eql(symbols[0]);

            var profile = layer.toJSON();
            for (var i = 0; i < profile.geometries.length; i++) {
                expect(profile.geometries[i].symbol).not.to.be.ok();
            }

            layer.removeStyle();

            expect(layer.getStyle()).not.to.be.ok();

            for (var i = 0; i < points.length; i++) {
                expect(points[i].getSymbol()).to.be.eql(defaultSymbols[i]);
            }
            expect(geoAddLater.getSymbol()).to.be.eql(defaultSymbols[0]);
        }

        it('setStyle with a singleStyle', function() {
            var symbol = {
                'markerFile' : 'http://www.foo.com/foo.png'
            };
            testStyle({
                filter : [
                            'all',
                            ['==', 'foo1', 2],
                            ['==', '$type', 'Point']
                         ],
                symbol : symbol
            }, [1], [symbol]);
        });

        it('setStyle with a array of styles', function() {
            var symbol = {
                'markerFile' : 'http://www.foo.com/foo.png'
            };
            var symbol2 = {
                'markerFile' : 'http://www.foo.com/foo2.png'
            };
            testStyle([
                {
                    filter : ['==', 'foo1', 2],
                    symbol : symbol
                },
                {
                    filter : [
                                'all',
                                ['!=', '$type', 'Polygon'],
                                ['==', 'foo1', 3]
                            ],
                    symbol : symbol2
                },
            ], [1, 2], [symbol, symbol2]);
        });
    });

});
