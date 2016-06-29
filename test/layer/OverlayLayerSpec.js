describe('#OverlayLayer', function() {

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

            urlTemplate:"/resources/tile.png",
            subdomains: [1, 2, 3]
        });
    });

    afterEach(function() {
        removeContainer(container)
    });

    describe('visibility', function() {
        it('should be true if initialized with default visibility', function() {
            var layer = new Z.VectorLayer('id');

            expect(layer.isVisible()).to.be.ok();
        });

        it('should be false after hide', function() {
            var layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            layer.hide();

            expect(layer.isVisible()).to.not.be.ok();
        });

        it('should be true after hide then show', function() {
            var layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            layer.hide();
            layer.show();

            expect(layer.isVisible()).to.be.ok();
        });
    });

    describe('addGeometry', function() {
        it('can be called on layer not on map', function() {
            var layer = new Z.VectorLayer('id');
            var gid = 'g1';
            var geo1 = new Z.Marker(center);
            geo1.setId(gid);
            layer.addGeometry(geo1, true);

            expect(layer.getGeometryById(gid)).to.equal(geo1);
        });

        it('can be called on layer on map that not loaded', function() {
            var layer = new Z.VectorLayer('id');
            var gid = 'g1';
            var geo1 = new Z.Marker(center);
            geo1.setId(gid);
            layer.addGeometry(geo1, true);
            map.addLayer(layer);

            expect(layer.getGeometryById(gid)).to.equal(geo1);
        });

        it('can be called if geometry is cleared by another layer', function() {
            var layer1 = new Z.VectorLayer('1');
            var layer2 = new Z.VectorLayer('2');
            var gid = 'g1';
            var geo = new Z.Marker(center);
            geo.setId(gid);
            layer1.addGeometry(geo, true);
            map.addLayer(layer1);
            layer1.clear();
            layer2.addGeometry(geo);
            expect(layer2.getGeometryById(gid)).to.be.ok();
        });

        it('will fail if geometry is added to another layer', function() {
            var layer1 = new Z.VectorLayer('1');
            var layer2 = new Z.VectorLayer('2');
            var gid = 'g1';
            var geo = new Z.Marker(center);
            geo.setId(gid);
            layer1.addGeometry(geo, true);
            map.addLayer(layer1);

            expect(function() {
                layer2.addGeometry(geo);
            }).to.throwException(function(e) {
                expect(e).to.be.a(Error);
            });
        });

        it('shold throw error if geometry to be added has same id', function() {
            var layer = new Z.VectorLayer('id');
            var gid = 'g1';
            var geo1 = new Z.Marker(center);
            geo1.setId(gid);
            layer.addGeometry(geo1);
            var geo2 = new Z.Marker(center);
            geo2.setId(gid);

            expect(layer.addGeometry).withArgs(geo2).to.throwException();
            expect(function() {
                layer.addGeometry(geo2);
            }).to.throwException(function(e) {
                expect(e).to.be.a(Error);
            });
        });

        it('fit map view after added', function(done) {
            var layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            var center1 = center.add(new maptalks.Coordinate(Math.random(), Math.random()));
            var center2 = center.add(new maptalks.Coordinate(Math.random(), Math.random()));
            var geo1 = new Z.Marker(center1);
            var geo2 = new Z.Marker(center2);
            layer.on('addgeo', function() {
                var center = center1.add(center2).multi(1/2);
                expect(map.getCenter()).to.be.closeTo(center);
                done();
            });
            layer.addGeometry([geo1, geo2], true);

        });
    });

    describe('getGeometry', function() {
        it('return null if called with non-existed id', function() {
            var layer = new Z.VectorLayer('id');

            expect(layer.getGeometryById('non-existed')).to.equal(null);
        });

        it('return value is empty after call clear', function() {
            var layer = new Z.VectorLayer('id');
            var gid = 'g1';
            var geo1 = new Z.Marker(center, {id: gid});
            layer.addGeometry(geo1);

            expect(layer.clear().getGeometries()).to.be.empty();
        });

        it('selectAll', function() {
            var layer = new Z.VectorLayer('id');
            expect(layer.filter(function(){return true})).not.to.be.ok();
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
                })
            ];
            var selection = layer.addGeometry(points).filter(function(){return true});
            expect(selection.getGeometries()).to.have.length(points.length);
            for (var i = 0; i < points.length; i++) {
                expect(selection.getGeometries()[i].toJSON()).to.be.eql(points[i].toJSON());
            }

        });

        function genPoints() {
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
                })
            ];
            return points;
        }

        it('filter by properties',function() {
            var layer = new Z.VectorLayer('id');
            var points = genPoints();
            var selection = layer.addGeometry(points).filter(function(geometry) {
                return geometry.getType() === 'Point' && geometry.getProperties().foo1 > 0 && geometry.getProperties().foo2.indexOf("test") >= 0;
            });

            expect(selection).to.be.an(maptalks.GeometryCollection);
            expect(selection.getGeometries()).to.have.length(points.length);
            for (var i = points.length - 1; i >= 0; i--) {
                expect(selection.getGeometries()[i].toJSON()).to.be.eql(points[i].toJSON());
            }

            expect(layer.filter(function(geometry) {
                return geometry.getProperties().foo3 === true;
            }).getGeometries()).to.have.length(3);

            selection = layer.filter(function(geometry) {
                return geometry.getType() !== 'Point';
            });
            expect(selection).not.to.be.ok();
        });

        it('filter by feature-filter',function() {
            var layer = new Z.VectorLayer('id');
            var points = genPoints();
            var selection = layer.addGeometry(points).filter([
                                                                'all',
                                                                ['==', '$type', 'Point'],
                                                                ['>', 'foo1', 0]
                                                             ]);

            expect(selection).to.be.an(Z.GeometryCollection);
            expect(selection.getGeometries()).to.have.length(points.length);
            for (var i = points.length - 1; i >= 0; i--) {
                expect(selection.getGeometries()[i].toJSON()).to.be.eql(points[i].toJSON());
            }

            expect(layer.filter(function(geometry) {
                return geometry.getProperties().foo3 === true;
            }).getGeometries()).to.have.length(3);

            selection = layer.filter(function(geometry) {
                return geometry.getType() !== 'Point';
            });
            expect(selection).not.to.be.ok();
        });
    });

    describe('isEmpty', function() {

        it('return true when clear', function() {
            var layer = new Z.VectorLayer('id').addTo(map);
            var gid = 'g1';
            var geo1 = new Z.Marker(center, {id: gid});
            layer.addGeometry(geo1);
            layer.clear();
            expect(layer.isEmpty()).to.be.ok();
        });

        it('return true when removing geometry', function() {
            var layer = new Z.VectorLayer('id').addTo(map);
            var gid = 'g1';
            var geo1 = new Z.Marker(center, {id: gid});
            layer.addGeometry(geo1);
            layer.removeGeometry(geo1);
            expect(layer.isEmpty()).to.be.ok();
        });

        it('return true when geometry removes itself', function() {
            var layer = new Z.VectorLayer('id').addTo(map);
            var gid = 'g1';
            var geo1 = new Z.Marker(center, {id: gid});
            layer.addGeometry(geo1);
            geo1.remove();
            expect(layer.isEmpty()).to.be.ok();
        });
    });

});
