describe('Map.Spec', function () {

    var container;
    var eventContainer;
    var map;
    var baseLayer;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '4px';
        container.style.height = '3px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:false,
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        map.config('zoomAnimationDuration', 20);
        map._getRenderer()._setCheckSizeInterval(20);
        baseLayer = new maptalks.VectorLayer('base_', new maptalks.Marker(center));
        eventContainer = map._panels.front;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('status', function () {
        it('has id and is readonly', function () {
            var id = map.id;
            expect(id).to.be.ok();
            map.id = 2;
            //id is readonly
            expect(map.id !== 2).to.be.ok();
        });

        it('#getSize', function () {
            var size = map.getSize();

            expect(size).to.have.property('width');
            expect(size).to.have.property('height');
            expect(size.width).to.be.above(0);
            expect(size.height).to.be.above(0);
        });

        it('#getExtent', function () {
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

        it('#getSpatialReference', function () {
            map.setSpatialReference({
                projection : 'EPSG:3857'
            });
            var sp = map.getSpatialReference().toJSON();
            expect(sp.fullExtent).to.be.eql({
                'top': 6378137 * Math.PI,
                'left': -6378137 * Math.PI,
                'bottom': -6378137 * Math.PI,
                'right': 6378137 * Math.PI
            });
            expect(sp.resolutions).to.be.eql(map._getResolutions());
            expect(sp.projection).to.be.eql('EPSG:3857');
            console.log(JSON.stringify(sp));
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

        it('getZoom2', function () {
            map.remove();
            var option = {
                zoom: 0,
                center: center
            };
            map = new maptalks.Map(container, option);
            expect(map.getZoom()).to.be.eql(0);
        });

        it('isLoaded', function () {
            expect(map.isLoaded()).to.be.ok();
        });
    });

    describe('conversions', function () {
        it('coordinateToContainerPoint', function () {
            var point = map.coordinateToContainerPoint({ x: 1, y: 1 });

            expect(point).to.be.a(maptalks.Point);
        });

        it('containerPointToCoordinate', function () {
            var coord = map.containerPointToCoordinate(new maptalks.Point(0, 0));

            expect(coord).to.be.a(maptalks.Coordinate);
        });
    });

    describe('#getCenter', function () {
        it('center is closeTo the center given in option', function () {

            expect(map.getCenter()).to.closeTo(center);
        });

        it('center remains same after setBaseLayer', function () {
            map.setBaseLayer(baseLayer);

            expect(map.getCenter()).to.closeTo(center);
        });

        it('center remains same after setZoom', function () {
            map.setZoom(13);

            expect(map.getCenter()).to.closeTo(center);
        });
    });

    describe('#getView', function () {
        it('can getView', function () {
            var view = map.getView();
            expect(view.center).to.be.eql(map.getCenter().toArray());
            expect(view.zoom).to.be.eql(map.getZoom());
            expect(view.pitch).to.be.eql(map.getPitch());
            expect(view.bearing).to.be.eql(map.getBearing());
        });
    });

    describe('#setCenter', function () {
        it('setCenterAndZoom', function () {
            var nc = new maptalks.Coordinate(119, 32);
            var z = map.getZoom();
            map.setCenterAndZoom(nc);

            expect(map.getCenter()).to.closeTo(nc);
            expect(map.getZoom()).to.be.eql(z);
        });

        it('setCenterAndZoom2', function () {
            var nc = new maptalks.Coordinate(119, 32);
            var nz = map.getZoom() + 1;
            map.setCenterAndZoom(nc, nz);

            expect(map.getCenter()).to.closeTo(nc);
            expect(map.getZoom()).to.be.eql(nz);
        });

        it('center is changed after setCenter', function () {
            var nc = new maptalks.Coordinate(119, 32).copy();
            map.setCenter(nc);

            expect(map.getCenter()).to.closeTo(nc);
        });

        it('center is changed after setCenter after setBaseLayer', function () {
            map.setBaseLayer(baseLayer);

            var nc = new maptalks.Coordinate(122, 32);
            map.setCenter(nc);

            expect(map.getCenter()).to.closeTo(nc);
        });

        it('setCenter will trigger movestart event with the same center', function () {
            var spy = sinon.spy();
            map.on('movestart', spy);
            map.setCenter(center);

            expect(spy.called).to.be.ok();
        });

        it('setCenter will trigger moveend event with the same center', function () {
            var spy = sinon.spy();
            map.on('moveend', spy);
            map.setCenter(center);

            expect(spy.called).to.be.ok();
        });

        it('setCenter will trigger movestart event with a different center', function () {
            var spy = sinon.spy();
            map.on('movestart', spy);
            var nc = new maptalks.Coordinate(119, 32);
            map.setCenter(nc);

            expect(spy.called).to.be.ok();
        });

        it('setCenter will trigger moveend event with a different center', function () {
            var spy = sinon.spy();
            map.on('moveend', spy);
            var nc = new maptalks.Coordinate(119, 32);
            map.setCenter(nc);

            expect(spy.called).to.be.ok();
        });
    });

    describe('#Zoom Level', function () {
        it('get (min/max/current)zoom level', function () {
            expect(map.getZoom()).to.eql(17);
            expect(map.getMinZoom()).to.be.a('number');
            expect(map.getMaxZoom()).to.be.a('number');
        });

        it('set (min/max/current)zoom level', function () {
            var min = 3, max = 14, cur = max + 1;
            map.setMinZoom(min);
            map.setMaxZoom(max);
            map.setZoom(cur);

            expect(map.getZoom()).to.equal(max);
            expect(map.getMinZoom()).to.equal(min);
            expect(map.getMaxZoom()).to.equal(max);
        });

        it('set max zoom level to less than current zoom level', function () {
            var max = 14, cur = max + 1;
            map.setZoom(cur);
            map.setMaxZoom(max);

            expect(map.getZoom()).to.equal(max);
            expect(map.getMaxZoom()).to.equal(max);
        });

        it('set min zoom level to bigger than current zoom level', function () {
            var min = 14, cur = min - 1;
            map.setZoom(cur);
            map.setMinZoom(min);

            expect(map.getZoom()).to.equal(min);
            expect(map.getMinZoom()).to.equal(min);
        });

        it('zoom in/out', function () {
            var min = 3, max = 14, cur = 8;
            map.setMinZoom(min);
            map.setMaxZoom(max);
            map.setZoom(cur);

            expect(map.zoomIn().getZoom()).to.equal(cur + 1);
            expect(map.zoomOut().getZoom()).to.equal(cur);
        });

        it('zoom in/out with animation', function (done) {
            map.config('zoomAnimation', true);
            var cur = map.getZoom();
            map.on('zoomend', function () {
                expect(map.getZoom()).to.be.eql(cur + 1);
                done();
            });
            map.zoomIn();
            // ignired
            map.zoomIn();
            map.zoomOut();
            expect(map.getZoom()).to.be.eql(cur);
        });

        it('setZoom with animation', function (done) {
            map.config('zoomAnimation', true);
            var cur = map.getZoom();
            map.on('zoomend', function () {
                expect(map.getZoom()).to.be.eql(6);
                done();
            });
            map.setZoom(6);
            //ignored
            // map.setZoom(13);
            expect(map.isZooming()).to.be.ok();
            expect(map.getZoom()).to.be.eql(cur);
        });

        it('setZoom without animation', function () {
            var cur = map.getZoom();
            map.setZoom(cur + 2, { animation : false });
            expect(map.isZooming()).not.to.be.ok();
            expect(map.getZoom()).to.be.eql(cur + 2);
        });

        it('getFitZoom', function () {
            var extent = map.getExtent();
            var zoom = map.getZoom();
            var fitZoom = map.getFitZoom(extent);

            expect(fitZoom).to.eql(zoom);
        });

        it('getFitZoom with baidu projection', function () {
            map.setSpatialReference({
                projection : 'baidu'
            });
            var extent = map.getExtent();
            var zoom = map.getZoom();
            var fitZoom = map.getFitZoom(extent);

            expect(fitZoom).to.eql(zoom);
        });

        it('getFitZoom 2', function () {
            var extent = map.getExtent();
            var zoom = map.getZoom();
            var w = extent.getWidth(),
                h = extent.getHeight();
            var fitZoom = map.getFitZoom(new maptalks.Extent(extent.min + w / 4, extent.ymin + h / 4, extent.xmax - w / 4, extent.ymax - h / 4));

            expect(fitZoom).to.eql(zoom + 3);
        });

        it('fit to extent without animation', function () {
            var extent = new maptalks.Marker(map.getCenter()).getExtent();
            var maxZoom = map.getMaxZoom();
            map.fitExtent(extent.toJSON(), 0, { 'animation' : false });
            expect(maxZoom).to.be.eql(map.getZoom());
        });

        it('fit to extent', function (done) {
            var extent = new maptalks.Marker(map.getCenter()).getExtent();
            var maxZoom = map.getMaxZoom();
            map.once('zoomend', function () {
                expect(maxZoom).to.be.eql(map.getZoom());
                done();
            });
            map.fitExtent(extent.toJSON());
        });

        it('update zoom', function (done) {
            map.once('zoomend', function () {
                map.once('zoomend', function () {
                    expect(map.getZoom()).to.be.eql(15);
                    done();
                });
                map.setZoom(15);
            });
            map.setZoom(13);
        });

        it('disable zoom by zoomable', function () {
            map.config('zoomable', false);
            var cur = map.getZoom();

            expect(map.zoomIn().getZoom()).to.equal(cur);
            expect(map.zoomOut().getZoom()).to.equal(cur);
        });
    });

    describe('#setView', function () {
        it('setView', function () {
            var nc = new maptalks.Coordinate(119, 32);
            var z = map.getZoom() + 1;
            var pitch = 60;
            var bearing = 30;
            map.setView({
                center : nc,
                zoom : z,
                pitch : pitch,
                bearing : bearing
            });

            expect(map.getCenter()).to.closeTo(nc);
            expect(map.getZoom()).to.be.eql(z);
            expect(map.getPitch()).to.be.approx(pitch);
            expect(map.getBearing()).to.be.approx(bearing);
        });
    });

    describe('#setMaxExtent', function (done) {
        it('set max extent and limit center', function () {
            var center = map.getCenter().toArray();
            var extent = map.getExtent();
            map.setMaxExtent(extent);
            map.setCenter(extent.getMax().add(10, 10));
            map.on('moveend', function () {
                expect(map.getCenter().toArray()).to.be.eql(center);
                done();
            });
        });

        it('moveback when zoom ends', function (done) {
            var center = map.getCenter().toArray();
            var extent = map.getExtent();
            map.setMaxExtent(extent);
            map.setZoom(map.getZoom() - 3, { animation : false });
            map.animateTo({
                zoom : map.getZoom()  - 2,
                around : map.getContainerExtent().getMax()
            }, {
                duration : 120
            });
            map.once('animateend', function () {
                expect(map.getCenter().toArray()).not.to.be.eql(center);
                map.on('moveend', function () {
                    expect(map.getCenter().toArray()).to.be.eql(center);
                    done();
                });
            });
        });
    });

    describe('#addLayer', function () {
        it('addLayer will trigger add event on layer', function () {
            var spy = sinon.spy();
            var layer = new maptalks.VectorLayer('id');
            layer.on('add', spy);
            map.addLayer(layer);
            expect(spy.called).to.be.ok();

            var spy2 = sinon.spy();
            baseLayer.on('add', spy2);
            map.addLayer(baseLayer);
            expect(spy2.called).to.be.ok();
        });

        it('layer will trigger layerload event', function (done) {
            var layer = new maptalks.VectorLayer('id', new maptalks.Marker(map.getCenter()));
            layer.on('layerload', function () {
                done();
            });
            map.addLayer(layer);
        });

        it('layerload event will not be fired when removed immediately', function (done) {
            var layer = new maptalks.VectorLayer('id');
            layer.on('remove', function () {
                done();
            });
            map.addLayer(layer);
            map.removeLayer(layer);
        });

        it('layerload triggered after setBaseLayer', function (done) {
            var layer = new maptalks.VectorLayer('id', new maptalks.Marker(map.getCenter()));
            layer.on('layerload', function () {
                done();
            });
            map.addLayer(layer);
            map.setBaseLayer(baseLayer);
        });
    });

    describe('#removeLayer', function () {
        it('map.getLayer returns null if layer is removed', function () {
            var layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            map.removeLayer(layer);

            expect(map.getLayer('id')).to.equal(null);
        });

        it('map.getLayer returns null if layer is removed', function () {

            var layer = new maptalks.VectorLayer('id');
            map.addLayer(layer);
            map.removeLayer([layer]);

            expect(map.getLayer(layer)).to.equal(null);
        });

        it('layer fire remove event when it is removed', function (done) {
            var layer = new maptalks.VectorLayer('id');
            layer.on('remove', function () {
                done();
            });
            map.addLayer(layer);
            map.removeLayer(layer);
        });
    });

    describe('events', function () {

        it('double click', function () {
            var spy = sinon.spy();
            map.on('dblclick', spy);

            happen.dblclick(eventContainer);

            expect(spy.called).to.be.ok();
        });

        it('mousedown following mouseup on map should not trigger move events', function () {
            var spy = sinon.spy();
            map.on('movestart moving moveend', spy);

            happen.mousedown(eventContainer);
            happen.mouseup(eventContainer);

            expect(spy.called).to.not.be.ok();
        });

        it('fire resize when dom\'s size is changed', function (done) {
            map.on('resize', function (param) {
                expect(param).to.be.ok();
                expect(map.getViewPoint().toArray()).to.be.eql([0, 0]);
                expect(map.getCenter().x).to.be.approx(118.84685718);
                expect(map.getCenter().y).to.be.approx(32.046534);
                done();
            });
            container.style.width = '10px';
        });

        it('fire resize when container is hided and shown', function (done) {
            map._getRenderer()._checkSizeInterval = 10;
            // this.timeout(map._getRenderer()._checkSizeInterval * 3);
            var center = map.getCenter();
            map.once('resize', function (param) {
                expect(param).to.be.ok();
                //center remains
                expect(map.getCenter().toArray()).to.be.eql(center.toArray());
                map.once('resize', function (param) {
                    expect(param).to.be.ok();
                    //center remains
                    expect(map.getCenter().toArray()).to.be.eql(center.toArray());
                    done();
                });
                container.style.display = '';
            });
            container.style.display = 'none';
        });

        it('event properties', function (done) {
            function listener(param) {
                expect(param.coordinate).to.be.ok();
                expect(param.containerPoint).to.be.ok();
                expect(param.viewPoint).to.be.ok();
                expect(param.point2d).to.be.ok();
                expect(param.target).to.be.ok();
                expect(param.type).to.be.ok();
                done();
            }
            map.on('dblclick', listener);

            happen.dblclick(eventContainer);
        });

        it('After dragging the map quickly and trigger moveend event,it can get the final coordinate', function(done) {
            map.on('moveend', function(e) {
                expect(e.coordinate).to.be.ok();
                expect(e.containerPoint).to.be.ok();
                expect(e.viewPoint).to.be.ok();
                expect(e.point2d).to.be.ok();
                done();
            });
            var center = map.getCenter();
            map.panTo([center.x + 0.01, center.y + 0.01]);
        });
    });

    describe('#setBaseLayer', function () {
        function isDrawn(x, y, canvas) {
            var context = canvas.getContext('2d');
            var imgData = context.getImageData(x, y, 1, 1).data;
            if (imgData[3] > 0) {
                return true;
            }
            return false;
        }

        it('use tilelayer as base tile', function (done) {
            this.timeout(6000);
            baseLayer.config({
                'renderer': 'canvas',
                'crossOrigin' : 'anonymous',
                'gradualLoading' : false,
                'visible' : true
            });
            var size = map.getSize();
            var baseLoaded = false,
                baseRemoved = false;
            map.on('baselayerload', function () {
                baseLoaded = true;
            });
            function onRenderEnd() {
                if (baseLoaded) {
                    if (!baseRemoved) {
                        expect(isDrawn(size.width / 2, size.height / 2, map._getRenderer().canvas)).to.be.ok();
                        baseRemoved = true;
                        map.removeBaseLayer();
                    } else {
                        expect(isDrawn(size.width / 2, size.height / 2, map._getRenderer().canvas)).not.to.be.ok();
                        done();
                    }
                }
            }
            map.on('renderend', onRenderEnd);
            map.setBaseLayer(baseLayer);
            expect(map.getBaseLayer()).to.be.eql(baseLayer);
        });

        it('use vectorlayer as base tile', function (done) {
            var layer = new maptalks.VectorLayer('vector').addGeometry(new maptalks.Circle(map.getCenter(), 1000, {
                symbol : {
                    polygonFill : '#000',
                    polygonOpacity : 0.5
                }
            }));
            var size = map.getSize();
            var baseLoaded = false,
                baseRemoved = false;
            layer.on('renderend', function () {
                baseLoaded = true;
            });
            map.on('baselayerload', function () {
                baseRemoved = true;
                map.removeBaseLayer();
            });
            function onRenderEnd() {
                if (!baseRemoved) {
                    if (baseLoaded) {
                        expect(isDrawn(size.width / 2, size.height / 2, map._getRenderer().canvas)).to.be.ok();
                    }
                } else {
                    expect(isDrawn(size.width / 2, size.height / 2, map._getRenderer().canvas)).not.to.be.ok();
                    done();
                }
            }
            map.on('renderend', onRenderEnd);
            map.setBaseLayer(layer);
            expect(map.getBaseLayer()).to.be.eql(layer);
        });
    });

    describe('Map.FullScreen', function () {

        it('requestFullScreen', function () {
            if (maptalks.Browser.ie) {
                return;
            }
            map.requestFullScreen();
            // Failed to execute 'requestFullscreen' on 'Element': API can only be initiated by a user gesture.
            // So,the value of 'map.isFullScreen()' is false.
            expect(map.isFullScreen()).not.to.be.ok();
        });

        it('cancelFullScreen', function () {
            if (maptalks.Browser.ie) {
                return;
            }
            map.cancelFullScreen();
            expect(map.isFullScreen()).not.to.be.ok();
        });

    });

    describe('Map.Topo', function () {

        it('computeLength', function () {
            var lonlat1 = new maptalks.Coordinate([0, 0]);
            var lonlat2 = new maptalks.Coordinate([1, 1]);
            var distance = map.computeLength(lonlat1, lonlat2);

            expect(distance).to.be.above(0);
        });

        it('computeGeodesicLength', function () {
            var all = GEN_GEOMETRIES_OF_ALL_TYPES();

            for (var i = 0; i < all.length; i++) {
                var g = all[i];
                var len = map.computeGeometryLength(g);
                expect(len).to.be.a('number');
            }
        });

        it('computeGeodesicArea', function () {
            var all = GEN_GEOMETRIES_OF_ALL_TYPES();

            for (var i = 0; i < all.length; i++) {
                var g = all[i];
                var area = map.computeGeometryArea(g);
                expect(area).to.be.a('number');
            }
        });

        it('identify', function (done) {
            var layer = new maptalks.VectorLayer('id');
            var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
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

        it('identify on invisible layers', function (done) {
            var layer = new maptalks.VectorLayer('id');
            var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
            layer.addGeometry(geometries, true);
            layer.hide();
            map.addLayer(layer);

            map.identify({
                coordinate: center,
                layers: [layer]
            }, function (geos) {
                expect(geos.length).to.be.eql(0);
                done();
            });
        });

        it('identify with tolerance', function (done) {
            var layer = new maptalks.VectorLayer('id');
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol : {
                    markerType : 'ellipse',
                    markerWidth : 4,
                    markerHeight : 4,
                    markerDx : 4
                }
            });
            layer.addGeometry(marker);
            map.addLayer(layer);

            map.identify({
                coordinate: center,
                layers: [layer]
            }, function (geos) {
                expect(geos.length).to.be.eql(0);
                map.identify({
                    coordinate: center,
                    layers: [layer],
                    tolerance : 5
                }, function (geos) {
                    expect(geos.length).to.be.eql(1);
                    done();
                });
            });
        });

        it('identify on empty line', function (done) {
            var layer = new maptalks.VectorLayer('id');
            var line = new maptalks.LineString([]);
            layer.addGeometry(line);
            map.addLayer(layer);

            map.identify({
                coordinate: center,
                layers: [layer]
            }, function (geos) {
                expect(geos.length).to.be.eql(0);
                done();
            });
        });
    });

    describe('geographic distance conversion', function () {
        it('#distanceToPoint', function () {
            var p = map.distanceToPoint(100, 200, map.getZoom() - 1);
            expect(Math.round(p.x)).to.be(49);
            expect(Math.round(p.y)).to.be(99);

            var dist = map.pointToDistance(p.x, p.y, map.getZoom() - 1);
            expect(Math.round(dist)).to.be(224);
        });

        it('#distanceToPixel', function () {
            var size = map.distanceToPixel(100, 200);
            expect(Math.round(size.width)).to.be(99);
            expect(Math.round(size.height)).to.be(198);

            var dist = map.pixelToDistance(size.width, size.height);
            expect(Math.round(dist)).to.be(224);
        });
    });

    it('toDataURL', function () {
        var expected = 'data:image/png;base64';
        var data = map.toDataURL();
        expect(data.substring(0, expected.length)).to.be.eql(expected);
        var layer = new maptalks.VectorLayer('id');
        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        layer.addGeometry(geometries, true);
        map.addLayer(layer);
        data = map.toDataURL();

        expect(data.substring(0, expected.length)).to.be.eql(expected);
    });

    it('remove', function (done) {
        var layer = new maptalks.VectorLayer('id');
        var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
        layer.addGeometry(geometries, true);
        var tilelayer = new maptalks.TileLayer('t2', {
            urlTemplate:'#',
            subdomains: [1, 2, 3],
            visible : false,
            renderer : 'canvas'
        });
        tilelayer.on('add', function () {
            map.remove();
            done();
        });
        map.addLayer([tilelayer, layer]);


    });

    it('set Cursor Style', function () {
        map.setCursor('move');
        expect(map.getMainPanel().style.cursor).to.be.eql('move');
    });

    it('reset cursor', function () {
        map.setCursor('move');
        map.resetCursor();

        expect(map.getMainPanel().style.cursor).to.be.eql('default');
    });

    it('point conversion should not throw exception if size is 0', function () {
        map.remove();
        container = document.createElement('div');
        container.style.width = '0px';
        container.style.height = '0px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:false,
            zoom: 17,
            center: center,
            pitch : 60,
            bearing : 20
        };
        map = new maptalks.Map(container, option);
        map.coordToContainerPoint(center);
        map.containerPointToCoord(new maptalks.Point(0, 0));
    });
});
