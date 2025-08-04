
describe('Map.Camera', function () {

    var container;
    var map, layer;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '30px';
        container.style.height = '30px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation: true,
            zoomAnimationDuration: 100,
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        // bring some offset to map, let view point is different from container point.
        map.setCenter(center._add(0.1, 0.1));
        layer = new maptalks.VectorLayer('v', { 'drawImmediate': true, 'enableAltitude': true }).addTo(map);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('getter and setter', function () {
        map.setBearing(60);
        map.setPitch(40);
        expect(map.getBearing()).to.be.approx(60);
        expect(map.getPitch()).to.be.eql(40);

        expect(map.getFov()).to.be.above(0);
        map.setFov(60);
        expect(map.getFov()).to.be.approx(60);
        // max fov is 60
        map.setFov(90);
        expect(map.getFov()).to.be.approx(60);

        // max pitch
        map.setPitch(360);
        expect(map.getPitch()).to.be.approx(map.options['maxPitch']);
    });

    describe('TileLayer\'s rendering', function () {
        it('gl render after composite operations', function (done) {
            if (!maptalks.Browser.webgl) {
                done();
                return;
            }
            var baseLayer = new maptalks.TileLayer('b', {
                urlTemplate: TILE_IMAGE
            });
            map.addLayer(baseLayer);
            map.setBearing(60);
            map.setCenter(map.getCenter().add(0.001, 0.001));
            map.setPitch(40);
            map.setCenter(map.getCenter().add(0.001, 0.002));
            map.setBearing(0);
            map.setPitch(0);
            baseLayer.on('layerload', function () {
                done();
            });
        });

        it('render with canvas renderer', function (done) {
            var baseLayer = new maptalks.TileLayer('b', {
                urlTemplate: TILE_IMAGE,
                renderer: 'canvas'
            });
            map.addLayer(baseLayer);
            // let canvas renderer draw with pitch
            baseLayer.getRenderer().isDrawable = function () { return true; };
            baseLayer.on('layerload', function () {
                done();
            });
            map.setPitch(80);
        });
    });

    describe('events', function () {
        it('should fire pitch event', function (done) {
            map.on('pitch', function () {
                done();
            });
            map.setPitch(10);
        });

        it('should fire rotate event', function (done) {
            map.on('rotate', function () {
                done();
            });
            map.setBearing(10);
        });

        it('should fire fovchange event', function (done) {
            map.on('fovchange', function () {
                done();
            });
            map.setFov(90);
        });
    });

    describe('zoom', function () {
        it('zoomIn', function (done) {
            map.setPitch(50);
            map.setBearing(60);
            map.on('zoomend', function () {
                done();
            });
            map.zoomIn();
        });

        it('zoomOut', function (done) {
            map.setPitch(50);
            map.setBearing(60);
            map.on('zoomend', function () {
                done();
            });
            map.zoomOut();
        });

        it('setZoom', function (done) {
            map.setPitch(50);
            map.setBearing(60);
            map.on('zoomend', function () {
                done();
            });
            map.setZoom(13);
        });
    });

    describe('conversions', function () {
        var map2;
        beforeEach(function () {
            var container = document.createElement('div');
            container.style.width = '300px';
            container.style.height = '300px';
            document.body.appendChild(container);
            var option = {
                zoomAnimation: true,
                zoomAnimationDuration: 100,
                zoom: 14,
                pitch: 60,
                center: center
            };
            map2 = new maptalks.Map(container, option);
        });
        afterEach(function () {
            map2.remove();
        });
        context('point to containerPoint', function () {
            it('1', function () {
                var center = map2.getCenter();
                var point = map2.coordToPoint(center);
                var cp = map2._pointToContainerPoint(point);
                expect(cp).to.be.closeTo(map2.getSize().toPoint().multi(1 / 2));
                var point2 = map2._containerPointToPoint(cp);

                expect(point.x).to.be.approx(point2.x);
                expect(point.y).to.be.approx(point2.y);
            });

            /* it('2.1', function () {
                map.setPitch(30);
                var point = map._containerPointToPoint({ x: 0, y: 0});
                var cp = map._pointToContainerPoint(point);

                expect(cp.x).to.be.approx(0);
                expect(cp.y).to.be.approx(0);
            });

            it('2.2', function () {
                map.setPitch(30);
                var point = map._containerPointToPoint({ x: 30, y: 0});
                var cp = map._pointToContainerPoint(point);

                expect(cp.x).to.be.approx(30);
                expect(cp.y).to.be.approx(0);
            });

            it('2.3', function () {
                map.setPitch(30);
                var point = map._containerPointToPoint({ x: 0, y: 30});
                var cp = map._pointToContainerPoint(point);

                expect(cp.x).to.be.approx(0);
                expect(cp.y).to.be.approx(30);
            }); */

            it('2.001', function () {

                var ncenter = map.containerPointToCoord({ x: 15, y: 15 });
                expect(ncenter.x).to.be.approx(center.x);
                expect(ncenter.y).to.be.approx(center.y);
            });

            it('2.0', function () {
                map.setPitch(45);
                var ncenter = map.containerPointToCoord({ x: 15, y: 15 });
                expect(center.x).to.be.approx(ncenter.x);
                expect(center.y).to.be.approx(ncenter.y);
            });

            it('2.1', function () {
                map.setPitch(1);
                var extent = map.getExtent();
                var point = map.coordToPoint({ x: extent.xmin, y: extent.ymax });
                var cp = map._pointToContainerPoint(point);

                expect(cp.x).to.be.approx(0);
                expect(cp.y).to.be.approx(0);

                var coord = map.containerPointToCoord(cp);
                expect(coord.x).to.be.approx(extent.xmin);
                expect(coord.y).to.be.approx(extent.ymax);
            });

            it('2.2', function () {
                map.setPitch(1);
                var extent = map.getExtent();
                var point = map.coordToPoint({ x: extent.xmax, y: extent.ymax });
                var cp = map._pointToContainerPoint(point);

                expect(cp.x).to.be.approx(30);
                expect(cp.y).to.be.approx(0);

                var coord = map.containerPointToCoord(cp);
                expect(coord.x).to.be.approx(extent.xmax);
                expect(coord.y).to.be.approx(extent.ymax);
            });

            it('2.3', function () {
                map.setPitch(1);
                var extent = map.getExtent();
                var point = map.coordToPoint({ x: extent.xmin, y: extent.ymin });
                var cp = map._pointToContainerPoint(point);

                expect(cp.x).to.be.approx(-0.175572);
                expect(cp.y).to.be.approx(30);
            });

            it('2.4', function () {
                map.setPitch(1);
                var extent = map.getExtent();
                var point = map.coordToPoint({ x: extent.xmax, y: extent.ymin });
                var cp = map._pointToContainerPoint(point);

                expect(cp.x).to.be.approx(30.175572);
                expect(cp.y).to.be.approx(30);
            });

            it('3', function () {
                map.setPitch(1);

                var cExtent = map.getContainerExtent();
                expect(cExtent.getMax()).to.be.closeTo({ x: 30, y: 30 });
                expect(cExtent.getMin()).to.be.closeTo({ x: 0, y: 0 });

                var pExtent = map.get2DExtent();
                var cp = map._pointToContainerPoint(new maptalks.Point(pExtent.xmin, pExtent.ymax));
                expect(cp).to.be.closeTo({ x: 0, y: 0 });

                var nw = map.getExtent().getMin();
                var point = map.coordToPoint(nw);
                var cp = map._pointToContainerPoint(point);
                // cp = map.coordToContainerPoint(nw);
                expect(cp).to.be.closeTo({ x: -0.175572, y: 30 });
                // point2 = map._containerPointToPoint(pExtent.getMin());

                // expect(point).to.be.closeTo(point2);
            });
        });

        it('containerPoint and viewPoint', function () {
            var center = map.getCenter();
            var cp = map.coordinateToContainerPoint(center);
            var vp = map.containerPointToViewPoint(cp);
            var cp2 = map.viewPointToContainerPoint(vp);
            expect(cp).to.be.closeTo(cp2);

            map.setBearing(60);

            cp = map.coordinateToContainerPoint(center);
            vp = map.containerPointToViewPoint(cp);
            cp2 = map.viewPointToContainerPoint(vp);
            expect(cp).to.be.closeTo(cp2);

            map.setPitch(60);

            cp = map.coordinateToContainerPoint(center);
            vp = map.containerPointToViewPoint(cp);
            cp2 = map.viewPointToContainerPoint(vp);
            expect(cp).to.be.closeTo(cp2);

        });

        it('pixel and distance', function () {
            var size = map.distanceToPixel(300, 400);
            var dist = map.pixelToDistance(size.width, size.height);
            expect(dist).to.be.approx(500, 1E-1);

            map.setBearing(60);

            size = map.distanceToPixel(300, 400);
            dist = map.pixelToDistance(size.width, size.height);
            expect(dist).to.be.approx(500, 1E-1);

            map.setPitch(60);

            size = map.distanceToPixel(300, 400);
            dist = map.pixelToDistance(size.width, size.height);
            expect(dist).to.be.approx(500, 1E-1);
        });

        it('containerPoint and coordinate', function () {
            var center = map.getCenter();
            var cp = map.coordinateToContainerPoint(center);
            var c2 = map.containerPointToCoordinate(cp);
            expect(c2).to.be.closeTo(center);

            map.setPitch(60);

            cp = map.coordinateToContainerPoint(center);
            c2 = map.containerPointToCoordinate(cp);
            expect(c2).to.be.closeTo(center);

            map.setBearing(50);

            cp = map.coordinateToContainerPoint(center);
            c2 = map.containerPointToCoordinate(cp);
            expect(c2).to.be.closeTo(center);
        });

        it('containerPoint and point', function () {
            map.setPitch(30);
            var point = map._containerPointToPoint({ x: 0, y: 0 });
            var pointMax = map._containerPointToPoint({ x: 0, y: 0 }, map.getMaxZoom());
            var scale = map.getScale();
            expect(pointMax.x).to.be.eql(point.x * scale);
            expect(pointMax.y).to.be.eql(point.y * scale);
        });

        // it('point to containerPoint', function (done) {
        //     console.log(map.pixelMatrix);
        //     map.setView({ 'center' : [-0.12615856382717539, 51.492700279705105], 'zoom' : 19, 'pitch' : 60, 'bearing' : 0 });
        //     console.log(map.pixelMatrix);
        //     console.log([1521, 0, 0, 0, -394.907584125704, 321.4251202812899, -0.8663463270567172, -0.8660254037844386, -228.00000000000006, -1570.7246391561312, -0.5001852851376394, -0.5000000000000001, -8801039028.413084, 7222949351.747576, -19464624.077144705, -19457411.738350045]);
        //     setTimeout(function () {
        //         var extent2d = new maptalks.Extent({ 'xmin':-51837.26321211921, 'ymin':-22476997.459779706, 'xmax':-42151.68343609315, 'ymax':-22467312.73870858 });
        //         var coords = extent2d.toArray();
        //         coords.forEach(function (c) {
        //             // console.log(c.toArray());
        //             console.log(map._pointToContainerPoint(c, map.getZoom(), 0).toArray());
        //         });
        //         done();
        //     }, 200);
        // });
    });

    describe('polygon\' size when pitching or rotating', function () {
        it('changed when rotating', function () {
            var top = new maptalks.Coordinate([center.x, center.y + 0.001]);
            var geometry = new maptalks.Polygon([[
                top,
                new maptalks.Coordinate([center.x, center.y]),
                new maptalks.Coordinate([center.x + 0.002, center.y])
            ]]);
            layer.addGeometry(geometry);

            var size = geometry.getSize();

            map.setBearing(90);
            var size2 = geometry.getSize();
            expect(size.toPoint()).to.be.closeTo(new maptalks.Point([size2.height, size2.width]));

            map.setPitch(70);
            var size3 = geometry.getSize();
            expect(size2.width).to.be.above(size3.width);
            expect(size3.height).to.be.below(size2.height);
        });
    });


    describe('marker\' size should be unchanged when pitching or rotating', function () {
        it('image marker', function () {
            var marker = new maptalks.Marker([100, 0], {
                symbol: {
                    'markerFile': 'resources/x.svg',
                    'markerWidth': 20,
                    'markerHeight': 30
                }
            }).addTo(layer);
            var s = new maptalks.Point(20, 30);
            expect(marker.getSize().toPoint()).to.be.eql(s);
            map.setPitch(60);
            expect(marker.getSize().toPoint()).to.be.closeTo(s);
            map.setBearing(40);
            expect(marker.getSize().toPoint()).to.be.closeTo(s);
        });

        it('vector marker', function () {
            var marker = new maptalks.Marker([100, 0], {
                symbol: {
                    'markerType': 'ellipse',
                    'markerWidth': 20,
                    'markerHeight': 30
                }
            }).addTo(layer);
            var s = new maptalks.Point(22, 32);
            expect(marker.getSize().toPoint()).to.be.eql(s);
            map.setPitch(60);
            expect(marker.getSize().toPoint()).to.be.eql(s);
            map.setBearing(40);
            expect(marker.getSize().toPoint()).to.be.closeTo(s);
        });

        it('vector path marker', function () {
            if (maptalks.Browser.ie) {
                // IE throws SecurityError
                return;
            }
            var marker = new maptalks.Marker([100, 0]).addTo(layer);
            var s = new maptalks.Point(24, 34);
            expect(marker.getSize().toPoint()).to.be.eql(s);
            map.setPitch(60);
            expect(marker.getSize().toPoint()).to.be.closeTo(s);
            map.setBearing(40);
            expect(marker.getSize().toPoint()).to.be.closeTo(s);
        });
    });

    describe('draw with altitude when pitching', function () {
        it('circle', function (done) {
            map.setPitch(15);
            map.setBearing(40);
            var geometry = new maptalks.Circle(center, 5, {
                properties: {
                    altitude: 30
                },
                symbol: {
                    polygonFill: '#f00'
                }
            });
            layer.on('layerload', function () {
                expect(layer).to.be.painted(0, -12);
                done();
            });
            layer.addGeometry(geometry);
        });
    });

    describe('Set camera position', function () {
        it('pitch 0, bearing 0', function () {
            map.setCameraOrientation({
                position: [0, 0, 10000],
                pitch: 0,
                bearing: 0,
            })
            expect(map.getCenter().x).to.be.eql(0);
            expect(map.getCenter().y).to.be.eql(0);
            expect(map.getPitch()).to.be.eql(0);
            expect(map.getBearing()).to.be.eql(0);
            expect(map.getZoom()).to.be.within(8, 9);
        });

        it('pitch 45, bearing 45', function () {
            map.setCameraOrientation({
                position: [0, 0, 10000],
                pitch: 45,
                bearing: 45,
            })
            expect(map.getCenter().x).to.be.within(0.07, 0.08);
            expect(map.getCenter().y).to.be.within(0.07, 0.08);
            expect(map.getPitch()).to.be.eql(45);
            expect(map.getBearing()).to.be.eql(45);
            expect(map.getZoom()).to.be.within(7, 8);
        });

        it('pitch 45, bearing 135', function () {
            map.setCameraOrientation({
                position: [0, 0, 10000],
                pitch: 45,
                bearing: 135,
            })
            expect(map.getCenter().x).to.be.within(0.07, 0.08);
            expect(map.getCenter().y).to.be.within(-0.08, 0.07);
            expect(map.getPitch()).to.be.eql(45);
            expect(map.getBearing()).to.be.eql(135);
            expect(map.getZoom()).to.be.within(7, 8);
        });

        it('pitch 45, bearing -45', function () {
            map.setCameraOrientation({
                position: [0, 0, 10000],
                pitch: 45,
                bearing: -45,
            })
            expect(map.getCenter().x).to.be.within(-0.08, 0.07);
            expect(map.getCenter().y).to.be.within(0.07, 0.08);
            expect(map.getPitch()).to.be.eql(45);
            expect(map.getBearing()).to.be.eql(-45);
            expect(map.getZoom()).to.be.within(7, 8);
        });

        it('pitch 45, bearing -135', function () {
            map.setCameraOrientation({
                position: [0, 0, 10000],
                pitch: 45,
                bearing: -135,
            })
            expect(map.getCenter().x).to.be.within(-0.08, -0.07);
            expect(map.getCenter().y).to.be.within(-0.08, -0.07);
            expect(map.getPitch()).to.be.eql(45);
            expect(map.getBearing()).to.be.eql(-135);
            expect(map.getZoom()).to.be.within(7, 8);
        });

        it('position z', function () {
            map.setCameraOrientation({
                position: [0, 0, 100],
                pitch: 0,
                bearing: 0,
            })
            expect(map.getCenter().x).to.be.eql(0);
            expect(map.getCenter().y).to.be.eql(0);
            expect(map.getPitch()).to.be.eql(0);
            expect(map.getBearing()).to.be.eql(0);
            expect(map.getZoom()).to.be.within(14, 15);
        });

        it('map.lookAt', function () {
            const view = map.getView();
            const cameraPosition = map.cameraPosition.slice();
            const pitch = map.getPitch();
            const bearing = map.getBearing();

            map.lookAt(view);

            expect(map.cameraPosition).to.be.closeTo(cameraPosition);
            expect(map.getPitch()).to.be.eql(pitch);
            expect(map.getBearing()).to.be.eql(bearing);
        });

        it('map.lookAt with distance', function () {
            const view = map.getView();
            let distance = map.cameraToCenterDistance;

            // compute meter distance in XYZ against map.cameraToCenterDistance
            const glRes = map.getGLRes();
            const radBearing = map.getBearing() * Math.PI / 180;
            const radPitch = map.getPitch() * Math.PI / 180;
            let distZ = distance * Math.sin(radPitch);
            let xyDist = Math.sin(radPitch) * distance;
            const distX = xyDist * Math.sin(radBearing);
            const distY = xyDist * Math.cos(radBearing);
            distZ = distZ / map._meterToGLPoint;
            xyDist = map.pointAtResToDistance(distX, distY, glRes);
            distance = Math.sqrt(xyDist * xyDist + distZ * distZ);

            const cameraPosition = map.cameraPosition.slice();
            const pitch = map.getPitch();
            const bearing = map.getBearing();

            view.distance = map.pointAtResToAltitude(distance, map.getGLRes());
            map.lookAt(view);

            expect(map.cameraPosition).to.be.closeTo(cameraPosition);
            expect(map.cameraPosition[2]).to.be.eql(cameraPosition[2]);
            expect(map.getPitch()).to.be.eql(pitch);
            expect(map.getBearing()).to.be.eql(bearing);
        });
    });

    describe('containsPoint when pitching', function () {

        it('linestring', function () {
            var top = new maptalks.Coordinate([center.x, center.y + 0.001]);
            var geometry = new maptalks.LineString([
                top,
                new maptalks.Coordinate([center.x, center.y]),
                new maptalks.Coordinate([center.x + 0.002, center.y])
            ]);
            layer.addGeometry(geometry);
            var topPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(topPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(topPt)).not.to.be.ok();
            var newTopPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(newTopPt)).to.be.ok();
            expect(newTopPt.y).to.be.above(topPt.y);
        });

        it('polygon', function () {
            var top = new maptalks.Coordinate([center.x, center.y + 0.001]);
            var geometry = new maptalks.Polygon([[
                top,
                new maptalks.Coordinate([center.x, center.y]),
                new maptalks.Coordinate([center.x + 0.002, center.y])
            ]]);
            layer.addGeometry(geometry);
            var topPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(topPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(topPt)).not.to.be.ok();
            var newTopPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(newTopPt)).to.be.ok();
            expect(newTopPt.y).to.be.above(topPt.y);
        });

        it('circle', function () {
            var top = map.locate(center, 0, 10);
            var geometry = new maptalks.Circle(center, 10);
            layer.addGeometry(geometry);
            var topPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(topPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(topPt)).not.to.be.ok();
            var newTopPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(newTopPt)).to.be.ok();
            expect(geometry.containsPoint(newTopPt.sub(0, 3))).not.to.be.ok();
            expect(newTopPt.y).to.be.above(topPt.y);
        });

        it('ellipse', function () {
            var top = map.locate(center, 0, 4);
            var geometry = new maptalks.Ellipse(center, 10, 8);
            layer.addGeometry(geometry);
            var topPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(topPt)).to.be.ok();
            map.setPitch(80);
            expect(geometry.containsPoint(topPt)).not.to.be.ok();
            var newTopPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(newTopPt)).to.be.ok();
            expect(newTopPt.y).to.be.above(topPt.y);
        });

        it('rectangle', function () {
            var bottom = map.locate(center, 0, -10);
            var geometry = new maptalks.Rectangle(center, 20, 10);
            layer.addGeometry(geometry);
            var bottomPt = map.coordinateToContainerPoint(bottom);
            expect(geometry.containsPoint(bottomPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(bottomPt)).not.to.be.ok();
            var newBottomPt = map.coordinateToContainerPoint(bottom);
            expect(geometry.containsPoint(newBottomPt)).to.be.ok();
            expect(newBottomPt.y).to.be.below(bottomPt.y);
        });

        it('sector', function () {
            var top = map.locate(center, 0, 10);
            var geometry = new maptalks.Sector(center, 10, 0, 90);
            layer.addGeometry(geometry);
            var topPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(topPt)).to.be.ok();
            map.setPitch(60);
            expect(geometry.containsPoint(topPt)).not.to.be.ok();
            var newTopPt = map.coordinateToContainerPoint(top);
            expect(geometry.containsPoint(newTopPt)).to.be.ok();
            expect(newTopPt.y).to.be.above(topPt.y);
        });
    });

    it('should generate dom css matrix', function () {
        map.setPitch(75);
        map.setBearing(45);
        // expect(maptalks.Util.join(map.domCssMatrix)).to.be.eql([31.819805153394643, -8.235571585149868, 0.7139488752261732, 0.6830127018922193, 31.819805153394636, 8.23557158514987, -0.7139488752261733, -0.6830127018922194, 0, -43.466662183008076, -0.27054191763364316, -0.25881904510252074, 0, 0, 46.83368719036461, 45].join());
        expect(maptalks.Util.join(map.domCssMatrix)).to.be.eql([31.819805153394643,-8.235571585149868,0.6834126770126959,0.6830127018922193,31.819805153394636,8.23557158514987,-0.683412677012696,-0.6830127018922194,0,-43.466662183008076,-0.2589706106275245,-0.25881904510252074,0,0,44.956019102246906,45].join());
    });

    it('setCameraPosition', function() {
        const center = map.getCenter();
        const position = new maptalks.Coordinate(center.x + 0.01, center.y + 0.01, 100);
        map.setCameraPosition(position);
        const zoom = map.getZoom();
        const pitch = map.getPitch();
        const bearing = map.getBearing();
        expect(zoom).to.be.eql(14.899641034986649);
        expect(pitch).to.be.eql(85.67228588474566);
        expect(bearing).to.be.eql(139.8095157874954);
    });
});

