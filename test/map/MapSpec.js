/*
 sinon(spy): http://sinonjs.org/docs/
 --- chai(assert): http://chaijs.com/api/bdd/
 expect.js: https://github.com/Automattic/expect.js
 */

describe('#Map', function () {

    var container;
    var eventContainer;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);

    beforeEach(function() {
        container = document.createElement('div');
        container.style.width = '4px';
        container.style.height = '3px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:false,
            zoom: 17,
            center: center
        };
        map = new Z.Map(container, option);
        tile = new Z.TileLayer('tile', {
            urlTemplate:"/resources/tile.png",
            subdomains: [1, 2, 3],
            visible : false
        });
        eventContainer = map._panels.mapPlatform;
    });

    afterEach(function() {
        removeContainer(container)
    });

    describe('status', function() {
        it('getSize', function () {
            var size = map.getSize();

            expect(size).to.have.property('width');
            expect(size).to.have.property('height');
            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('getExtent', function () {
            var extent = map.getExtent(),
                projection = map.getProjection(),
                res = map._getResolution(),
                size = map.getSize();

            expect(extent).to.not.be(null);
            expect(extent).to.be.an(maptalks.Extent);

            var min = projection.project(extent.getMin()),
                max = projection.project(extent.getMax());
            expect((max.x - min.x) / res).to.be.approx(size.width);
            expect((max.y - min.y) / res).to.be.approx(size.height);
        });

        it('_get2DExtent', function () {
            var extent = map._get2DExtent(),
                size = map.getSize();

            expect(extent).to.not.be(null);
            expect(extent).to.be.an(maptalks.PointExtent);
            expect(extent.getWidth()).to.be.eql(size.width);
            expect(extent.getHeight()).to.be.eql(size.height);
        });

        it('getZoom', function () {
            var zoom = map.getZoom();
            expect(zoom).to.be.eql(17);
        });



        it('isLoaded',function() {
            expect(map.isLoaded()).to.be.ok();
        });

        it('is rendered by canvas',function() {
            expect(map.isCanvasRender()).to.be.ok();
        });
    });

    describe('conversions', function () {
        it('coordinateToContainerPoint', function () {
            var point = map.coordinateToContainerPoint({x: 1, y: 1});

            expect(point).to.be.a(maptalks.Point);
        });

        it('containerPointToCoordinate', function () {
            var coord = map.containerPointToCoordinate(new maptalks.Point(0, 0));

            expect(coord).to.be.a(maptalks.Coordinate);
        });
    });

    describe('#getCenter', function() {
        it('getCenter返回结果与初始化时指定center相等(Load之前)', function() {

            expect(map.getCenter()).to.closeTo(center);
        });

        it('getCenter返回结果与初始化时指定center相等(Load之后)', function() {
            map.setBaseLayer(tile);

            expect(map.getCenter()).to.closeTo(center);
        });

        it('getCenter返回结果与初始化时指定center相等(setZoom之后)', function() {
            map.setBaseLayer(tile);
            map.setZoom(13);

            expect(map.getCenter()).to.closeTo(center);
        });
    });

    describe('#setCenter', function() {
        it('setCenterAndZoom', function() {
            var nc = new Z.Coordinate(119, 32);
            var z = map.getZoom();
            map.setCenterAndZoom(nc);

            expect(map.getCenter()).to.closeTo(nc);
            expect(map.getZoom()).to.be.eql(z);
        });

        it('setCenterAndZoom2', function() {
            var nc = new Z.Coordinate(119, 32);
            var nz = map.getZoom() + 1;
            map.setCenterAndZoom(nc, nz);

            expect(map.getCenter()).to.closeTo(nc);
            expect(map.getZoom()).to.be.eql(nz);
        });

        it('setCenter后, getCenter返回结果与指定center近似相等(Load之前)', function() {
            var nc = new Z.Coordinate(119, 32);
            map.setCenter(nc);

            expect(map.getCenter()).to.closeTo(nc);
        });

        it('setCenter后, getCenter返回结果与指定center相等(Load之后)', function() {
            map.setBaseLayer(tile);

            var nc = new Z.Coordinate(122, 32);
            map.setCenter(nc);

            expect(map.getCenter()).to.closeTo(nc);
        });

        it('setCenter设定中心点为当前地图中心点, 应该触发movestart', function() {
            map.setBaseLayer(tile);

            var spy = sinon.spy();
            map.on('movestart', spy);
            map.setCenter(center);

            expect(spy.called).to.be.ok();
        });

        it('setCenter设定中心点为当前地图中心点, 应该触发moveend', function() {
            map.setBaseLayer(tile);

            var spy = sinon.spy();
            map.on('moveend', spy);
            map.setCenter(center);

            expect(spy.called).to.be.ok();
        });

        it('setCenter设定中心点不同于当前地图中心点, 应该触发movestart', function() {
            map.setBaseLayer(tile);

            var spy = sinon.spy();
            map.on('movestart', spy);
            var nc = new Z.Coordinate(119, 32);
            map.setCenter(nc);

            expect(spy.called).to.be.ok();
        });

        it('setCenter设定中心点不同于当前地图中心点, 应该触发moveend', function() {
            map.setBaseLayer(tile);

            var spy = sinon.spy();
            map.on('moveend', spy);
            var nc = new Z.Coordinate(119, 32);
            map.setCenter(nc);

            expect(spy.called).to.be.ok();
        });
    });

    describe('#Zoom Level', function() {
        it('get (min/max/current)zoom level', function() {
            map.setBaseLayer(tile);

            expect(map.getZoom()).to.eql(17);
            expect(map.getMinZoom()).to.be.a('number');
            expect(map.getMaxZoom()).to.be.a('number');
        });

        it('set (min/max/current)zoom level', function() {
            map.setBaseLayer(tile);

            var min = 3, max = 14, cur = max + 1;
            map.setMinZoom(min);
            map.setMaxZoom(max);
            map.setZoom(cur);

            expect(map.getZoom()).to.equal(max);
            expect(map.getMinZoom()).to.equal(min);
            expect(map.getMaxZoom()).to.equal(max);
        });

        it('set max zoom level to less than current zoom level', function() {
            map.setBaseLayer(tile);

            var max = 14, cur = max + 1;
            map.setZoom(cur);
            map.setMaxZoom(max);

            expect(map.getZoom()).to.equal(max);
            expect(map.getMaxZoom()).to.equal(max);
        });

        it('zoom in/out', function() {
            map.setBaseLayer(tile);

            var min = 3, max = 14, cur = 8;
            map.setMinZoom(min);
            map.setMaxZoom(max);
            map.setZoom(cur);

            expect(map.zoomIn().getZoom()).to.equal(cur + 1);
            expect(map.zoomOut().getZoom()).to.equal(cur);
        });

        it('getFitZoom', function () {
            var extent = map.getExtent();
            var zoom = map.getZoom();
            var fitZoom = map.getFitZoom(extent);

            expect(fitZoom).to.eql(zoom);
        });
    });

    describe('#addLayer', function() {
        it('图层加入地图时触发add事件', function() {
            var spy = sinon.spy();
            var layer = new Z.VectorLayer('id');
            layer.on('add', spy);
            map.addLayer(layer);
            expect(spy.called).to.be.ok();

            var spy2 = sinon.spy();
            tile.on('add', spy2);
            map.addLayer(tile);
            expect(spy2.called).to.be.ok();
        });

        it('图层加入已载入地图时立即触发loaded事件', function(done) {
            map.setBaseLayer(tile);

            var layer = new Z.VectorLayer('id');
            layer.on('layerload', function() {
                done();
            });
            map.addLayer(layer);
        });

        it('当地图载入完成时, 如果加入的图层已被删除, 不触发loaded事件', function(done) {
            var layer = new Z.VectorLayer('id');
            layer.on('remove', function() {
                done();
            });
            map.addLayer(layer);
            map.removeLayer(layer);
            map.setBaseLayer(tile);
        });

        it('当地图载入完成时触发已加入图层的loaded事件', function(done) {
            var layer = new Z.VectorLayer('id');
            layer.on('layerload', function() {
                done();
            });
            map.addLayer(layer);
            map.setBaseLayer(tile);
        });
    });

    describe('#removeLayer', function() {
        it('删除图层后getLayer返回null(地图未载入)', function() {
            var layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            map.removeLayer(layer);

            expect(map.getLayer(layer)).to.equal(null);
        });

        it('删除图层后getLayer返回null(地图已载入)', function() {
            map.setBaseLayer(tile);

            var layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            map.removeLayer([layer]);

            expect(map.getLayer(layer)).to.equal(null);
        });

        it('删除图层时触发图层的removed事件', function() {
            // var spy = sinon.spy();
            // var layer = new Z.VectorLayer('id');
            // layer.on('removed', spy);
            // map.addLayer(layer);
            // map.removeLayer(layer);

            // expect(spy.called).to.be.ok();
        });
    });

    describe('events', function() {

        it('double click', function() {
            map.setBaseLayer(tile);

            var spy = sinon.spy();
            map.on('dblclick', spy);

            happen.dblclick(eventContainer);

            expect(spy.called).to.be.ok();
        });

        it("mousedown following mouseup on map should not trigger move events", function() {
            map.setBaseLayer(tile);

            var spy = sinon.spy();
            map.on('movestart moving moveend', spy);

            happen.mousedown(eventContainer);
            happen.mouseup(eventContainer);

            expect(spy.called).to.not.be.ok();
        });

        it('fire resize when dom\'s size is changed', function (done) {
            map.on('resize', function(param) {
                done();
            });
            container.style.width = '10px';
        });

    });

    describe('#setBaseLayer', function() {
        function isDrawn(x, y, canvas) {
            var context = canvas.getContext('2d');
            var imgData = context.getImageData(x, y, 1, 1).data;
            if (imgData[3] > 0) {
                return true;
            }
            return false;
        }

        it('use tilelayer as base tile', function(done) {
            this.timeout(6000);
            tile.config({
                'baseLayerRenderer': 'canvas',
                'crossOrigin' : 'anonymous',
                'gradualLoading' : false,
                'visible' : true
            });
            var size = map.getSize();
            var baseLoaded = false,
                baseRemoved = false;
            map.on('baselayerload', function() {
                baseLoaded = true;
            });
            function onRenderEnd() {
                if (baseLoaded) {
                    if (!baseRemoved) {
                        expect(isDrawn(size.width/2, size.height/2, map._getRenderer()._canvas)).to.be.ok();
                        baseRemoved = true;
                        map.removeBaseLayer();
                    } else {
                        expect(isDrawn(size.width/2, size.height/2, map._getRenderer()._canvas)).not.to.be.ok();
                        done();
                    }
                }
            }
            map.on('renderend', onRenderEnd);
            map.setBaseLayer(tile);
            expect(map.getBaseLayer()).to.be.eql(tile);
        });

        it('use vectorlayer as base tile', function(done) {
            var layer = new maptalks.VectorLayer('vector').addGeometry(new maptalks.Circle(map.getCenter(), 1000, {
                symbol : {
                    polygonFill : '#000',
                    polygonOpacity : 0.5
                }
            }));
            var size = map.getSize();
            var baseLoaded = false,
                baseRemoved = false;
            layer.on('renderend', function() {
                baseLoaded = true;
            });
            map.on('baselayerload', function() {
                baseRemoved = true;
                map.removeBaseLayer();
            });
            function onRenderEnd() {
                if (!baseRemoved) {
                    if (baseLoaded) {
                        expect(isDrawn(size.width/2, size.height/2, map._getRenderer()._canvas)).to.be.ok();
                    }
                } else {
                    expect(isDrawn(size.width/2, size.height/2, map._getRenderer()._canvas)).not.to.be.ok();
                    done();
                }
            }
            map.on('renderend', onRenderEnd);
            map.setBaseLayer(layer);
            expect(map.getBaseLayer()).to.be.eql(layer);
        });
    });

    describe('Map.FullScreen', function() {

        it('requestFullScreen', function(done) {
            expect(function () {
                map.requestFullScreen();
                done();
            }).to.not.throwException();
        });

        it('cancelFullScreen', function(done) {
            expect(function () {
                map.cancelFullScreen();
                done();
            }).to.not.throwException();
        });

    });

    describe('Map.Topo', function() {

        it('computeLength', function() {
            var lonlat1 = new Z.Coordinate([0, 0]);
            var lonlat2 = new Z.Coordinate([1, 1]);
            var distance = map.computeLength(lonlat1, lonlat2);

            expect(distance).to.be.above(0);
        });

        it('computeGeodesicLength', function() {
            var all = genAllTypeGeometries();

            for (var i = 0; i < all.length; i++) {
                var g = all[i];
                var len = map.computeGeometryLength(g);
                expect(len).to.be.a('number');
            }
        });

        it('computeGeodesicArea', function() {
            var all = genAllTypeGeometries();

            for (var i = 0; i < all.length; i++) {
                var g = all[i];
                var area = map.computeGeometryArea(g);
                expect(area).to.be.a('number');
            }
        });

        it('identify', function(done) {
            var layer = new Z.VectorLayer('id');
            var geometries = genAllTypeGeometries();
            //var point = map.coordinateToContainerPoint(center);
            layer.addGeometry(geometries, true);
            map.addLayer(layer);

            map.identify({
                coordinate: center,
                layers: [layer]
            }, function (geos) {
                expect(geos.length).to.be.above(0);
                done();
            });
        });

    });

    it('toDataURL', function () {
        var expected = 'data:image/png;base64';
        var data = map.toDataURL();
        expect(data.substring(0, expected.length)).to.be.eql(expected);
        var layer = new Z.VectorLayer('id');
        var geometries = genAllTypeGeometries();
        layer.addGeometry(geometries, true);
        map.addLayer(layer);
        data = map.toDataURL();

        expect(data.substring(0, expected.length)).to.be.eql(expected);
    });
});
