// var utils = require('../SpecUtils.js');

describe('VectorLayer', function() {

    var container;
    var map;
    var tile;
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
    });

    afterEach(function() {
        removeContainer(container)
    });

    describe('addGeometry', function() {

        var layer = new Z.VectorLayer('id');

        beforeEach(function() {
            map.setBaseLayer(tile);
            map.addLayer(layer);
        });

        afterEach(function() {
            map.removeLayer(layer);
        });

        it('all type of geometry', function() {
            var geometries = genAllTypeGeometries();

            expect(function() {
                layer.addGeometry(geometries,true);
            }).to.not.throwException();
        });

        context('should can setStyle', function() {
            function testStyle(style, hitIndex, symbols) {
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
                    if (hit >= 0) {
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
                    condition : 'properties.foo1 === 2',
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
                        condition : 'properties.foo1 === 2',
                        symbol : symbol
                    },
                    {
                        condition : 'type !== "Polygon" && properties.foo1 === 3',
                        symbol : symbol2
                    },
                ], [1, 2], [symbol, symbol2]);
            });
        })


    });

});
