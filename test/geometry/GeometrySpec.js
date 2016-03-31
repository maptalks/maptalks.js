describe('#Geometry', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;
    var context = {
        map:map,
        layer:layer
    };
    var canvasContainer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        layer = new Z.VectorLayer('canvas',{'render':'canvas'});
        map.addLayer(layer);
        context.map = map;
        context.layer = layer;
        canvasContainer = map._panels.mapPlatform;
    });

    afterEach(function() {
        map.removeLayer(layer);
        removeContainer(container)
    });

    // 测试所有类型Geometry的公共方法
    var geometries = genAllTypeGeometries();

    for (var i=0, len = geometries.length;i<len;i++){
        registerGeometryCommonTest.call(this,geometries[i],context);
    }

});
//测试Geometry的公共方法
function registerGeometryCommonTest(geometry,_context) {
    function setupGeometry() {
        // var layer = new Z.VectorLayer('common_test_layer');
        if (geometry.getLayer()) {
            geometry.remove();
        }
        _context.layer.addGeometry(geometry);
        // map.addLayer(layer);
    }

    function teardownGeometry() {
        geometry.remove();
        // map.removeLayer('common_test_layer');
    }

    var type = geometry.getType();
    context(type+':getter and setters.',function() {
        it('id', function() {
            geometry.setId('id');
            var id = geometry.getId();
            expect(id).to.be('id');
            geometry.setId(null);
            expect(geometry.getId()).to.not.be.ok();
        });

        it('Layer',function() {
            expect(geometry.getLayer()).to.not.be.ok();
            var layer = new Z.VectorLayer('id');
            layer.addGeometry(geometry);
            expect(geometry.getLayer()).to.be.ok();
            //delete
            geometry.remove();
            expect(geometry.getLayer()).to.not.be.ok();
        });

        it('Map',function() {
            setupGeometry();

            expect(geometry.getMap()).to.be.ok();

            teardownGeometry();

            expect(geometry.getMap()).to.not.be.ok();
        });

        it('Type',function() {
            var type = geometry.getType();
            expect(type).to.not.be.empty();
        });

        it('Symbol',function() {
           /* var symbol = geometry.getSymbol();
            expect(symbol).to.be.ok();
            expect(symbol).to.not.be.empty();*/
            //setSymbol单独测试
        });

        it('Properties',function() {
            var old_props = geometry.getProperties();

            var props_test = {'foo_num':1, 'foo_str':'str', 'foo_bool':false};
            geometry.setProperties(props_test);

            var props = geometry.getProperties();
            expect(props).to.eql(props_test);

            geometry.setProperties(old_props);
            expect(geometry.getProperties()).to.not.eql(props_test);
        });

    });

    context(type+':can be measured.',function() {
        it('it has geodesic length',function() {
            var length = geometry.getLength();
            if (geometry instanceof Z.Marker) {
                expect(length===0).to.be.ok();
            } else {
                expect(length>0).to.be.ok();
            }

        });

        it('it has geodesic area',function() {
            var types = [Z.Polygon, Z.MultiPolygon];
            var area = geometry.getArea();
            var hit = false;
            for (var i=0, len=types.length;i<len;i++) {
                if (geometry instanceof types[i]) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                expect(area===0).to.be.ok();
            } else {
                expect(area>0).to.be.ok();
            }

        });

        it('it has extent',function() {
            setupGeometry();

            var extent = geometry.getExtent();
            expect(extent).to.be.a(Z.Extent);
            expect(extent).to.not.be.empty();

            teardownGeometry();
        });

        it('it has size',function() {
            setupGeometry();

            var size = geometry.getSize();
            expect(size).to.be.a(Z.Size);
            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);

            teardownGeometry();
        });

        it('it has center',function() {
            var center = geometry.getCenter();
            expect(center).to.be.a(Z.Coordinate);
            expect(center.x).to.be.ok();
            expect(center.y).to.be.ok();

            setupGeometry();

            center = geometry.getCenter();
            expect(center).to.be.a(Z.Coordinate);
            expect(center.x).to.be.ok();
            expect(center.y).to.be.ok();

            teardownGeometry();
        });
    });

    context(type+':can show and hide.',function() {
        it('show and hide',function() {
            geometry.show();
            expect(geometry.isVisible()).to.be.ok();
            geometry.hide();
            expect(geometry.isVisible()).to.not.be.ok();

            setupGeometry();

            geometry.show();
            expect(geometry.isVisible()).to.be.ok();
            geometry.hide();
            expect(geometry.isVisible()).to.not.be.ok();

            teardownGeometry();

            geometry.show();
            expect(geometry.isVisible()).to.be.ok();
        });
    });

    context(type+':copy',function() {
        it ('copy',function() {
            var json = geometry.toJSON();

            var cloned = geometry.copy();

            var clonedJson = cloned.toJSON();

            expect(clonedJson).to.eql(json);
        });
    });

    // context(type+':has crs',function() {
    //     it ('can read crs from json',function() {
    //         var json = geometry.toGeoJSON();
    //         json.crs = {
    //             "type" : "cnCoordinateType",
    //             "properties" : {
    //                 "name" : "gcj02"
    //             }
    //         };
    //         var parsed = Z.GeoJSON.fromGeoJSON(json);

    //         expect(parsed.getCRS()).to.eql(json.crs);
    //     });

    //     it ('has crs',function() {
    //         var coordinateType = Z.CRS.GCJ02;
    //         var json = geometry.setCRS(coordinateType).toGeoJSON();
    //         expect(json['crs']).to.be.ok();
    //         expect(json['crs']).to.eql({"type":"cnCoordinateType","properties":{"name":"gcj02"}});
    //     });
    // });

    context(type+':remove',function() {
        it ('remove from layer',function() {
            //layer not on map
            var layer = new Z.VectorLayer('svg');
            layer.addGeometry(geometry);
            expect(geometry.getLayer()).to.be.ok();
            expect(geometry.getMap()).to.not.be.ok();
            geometry.remove();
            expect(geometry.getLayer()).to.not.be.ok();

            setupGeometry();

            expect(geometry.getLayer()).to.be.ok();
            expect(geometry.getMap()).to.be.ok();
            geometry.remove();
            expect(geometry.getLayer()).to.not.be.ok();

            var canvasLayer = new Z.VectorLayer('event_test_canvas',{'render':'canvas'});
            canvasLayer.addGeometry(geometry);
            _context.map.addLayer(canvasLayer);

            expect(geometry.getLayer()).to.be.ok();
            expect(geometry.getMap()).to.be.ok();
            geometry.remove();
            expect(geometry.getLayer()).to.not.be.ok();

            teardownGeometry();
        });
    });

    context(type+':some internal methods should be tested.',function() {
        it('painter',function() {
            setupGeometry();

            var painter = geometry._getPainter();
            expect(painter).to.be.ok();
            geometry.remove();

            var canvasLayer = new Z.VectorLayer('event_test_canvas',{'render':'canvas'});
            canvasLayer.addGeometry(geometry);
            _context.map.addLayer(canvasLayer);

            painter = geometry._getPainter();
            expect(painter).to.be.ok();

            teardownGeometry();
        });

        it('getExternalResource',function() {
            var oldSymbol = geometry.getSymbol();

            var type = geometry.getType();
            if (type === Z.Geometry.TYPE_POINT) {
                var symbol = {
                    'marker-file':'http://foo.com/foo.png'
                };
                geometry.setSymbol(symbol);
                var resource = geometry._getExternalResource();
                expect(resource).to.have.length(1);
                expect(resource[0][0]).to.be(symbol['marker-file']);
            } else {
                var symbol = {
                    'polygon-pattern-file':'url(\'http://foo.com/foo.png\')',
                    'line-pattern-file':'url(\'http://foo.com/foo2.png\')',
                };
                geometry.setSymbol(symbol);
                var resource = geometry._getExternalResource();
                expect(resource).to.have.length(2);
                expect(resource[0][0]).to.be('http://foo.com/foo.png');
                expect(resource[1][0]).to.be('http://foo.com/foo2.png');
            }
        });

        it('getProjection',function() {
            var projection = geometry._getProjection();
            expect(projection).not.to.be.ok();

            setupGeometry();

            var projection = geometry._getProjection();
            expect(projection.code).to.be(_context.map.getProjection().code);

            teardownGeometry();
        });

        it('getMeasurer',function() {
            var measurer = geometry._getMeasurer();
            expect(measurer).to.be(Z.measurer.WGS84Sphere);

            geometry.config('measure', 'identity');

            measurer = geometry._getMeasurer();
            expect(measurer).to.be(Z.measurer.Identity);

            geometry.config('measure', 'baidu');

            measurer = geometry._getMeasurer();
            expect(measurer).to.be(Z.measurer.BaiduSphere);
        });
    });
    var spy;
    context(type+':map events listeners',function() {
        it ('onZoomEnd',function() {
            var map = _context.map;
            map.config('zoomAnimation',false);
            setupGeometry();
            spy = sinon.spy(geometry,'_onZoomEnd');
            map.zoomOut();
            expect(spy.called).to.be.ok();
        });
    });
}
