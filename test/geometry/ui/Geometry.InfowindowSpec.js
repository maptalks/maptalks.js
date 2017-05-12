describe('#Geometry.InfoWindow', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation: false,
            zoom: 15,
            center: center
        };
        map = new maptalks.Map(container, option);
        layer = new maptalks.VectorLayer('vector').addTo(map);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('infowindow has methods to change itself.', function (done) {
        var marker = new maptalks.Marker(center);
        marker.addTo(layer);
        var options = {
            title: 'title',
            content: 'content'
        };
        marker.setInfoWindow(options);
        var w = marker.getInfoWindow();
        w.setContent('content2');
        expect(w.getContent()).to.be.eql('content2');
        w.setTitle('title2');
        expect(w.getTitle()).to.be.eql('title2');
        marker.openInfoWindow();
        w.setContent('content3');
        expect(w.getContent()).to.be.eql('content3');
        w.setTitle('title4');
        expect(w.getTitle()).to.be.eql('title4');
        function onZoomEnd() {
            done();
        }
        map.on('zoomend', onZoomEnd);
        map.zoomIn();
    });

    it('close when layer is removed', function (done) {
        var marker = new maptalks.Marker(center);
        marker.addTo(layer);
        var options = {
            title: 'title',
            content: 'content',
            animation : false
        };
        marker.setInfoWindow(options);
        marker.openInfoWindow();
        var w = marker.getInfoWindow();
        expect(w.isVisible()).to.be.ok();
        layer.remove();
        expect(w.isVisible()).not.to.be.ok();
        done();
    });

    describe('all kinds of geometries can have a infowindow', function () {
        it('set an infowindow', function () {
            var options = {
                title: 'title',
                content: 'content'
            };
            var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
            for (var i = 0; i < geometries.length; i++) {
                geometries[i].setInfoWindow(options);
                expect(geometries[i].getInfoWindow()).not.to.be.ok();
            }
            layer.addGeometry(geometries);
        });

        it('set an infowindow with an infowindow instance', function () {
            var options = {
                title: 'title',
                content: 'content'
            };
            var infoWindow = new maptalks.ui.InfoWindow(options);
            var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
            for (var i = 0; i < geometries.length; i++) {
                geometries[i].setInfoWindow(infoWindow);
                expect(geometries[i].getInfoWindow()).to.be.ok();
            }
            layer.addGeometry(geometries);
        });

        it('showed at the center of geometry in default', function () {
            var options = {
                title: 'title',
                content: 'content',
                animation : null
            };
            var infoWindow = new maptalks.ui.InfoWindow(options);
            var geo = new maptalks.Marker(map.getCenter());
            layer.addGeometry(geo);

            infoWindow.addTo(geo);
            infoWindow.show();

            var c = map.coordinateToViewPoint(map.getCenter());

            var dom = infoWindow.getDOM();
            var offset = infoWindow.getOffset();
            expect(!offset._isNaN()).to.be.ok();
            var p = infoWindow.getPosition();
            expect(p.toArray()).to.be.eql([c.x + offset.x, c.y + offset.y]);
            var t;
            if (maptalks.Browser.any3d) {
                t = 'translate3d(' + p.x + 'px, ' + p.y + 'px, 0px)';
            } else {
                t = 'translate(' + p.x + 'px, ' + p.y + 'px)';
            }
            expect(dom.style[maptalks.DomUtil.TRANSFORM]).to.be.eql(t);
        });

        it('set and open/close and remove a infowindow', function () {
            var options = {
                title: 'title',
                content: 'content',
                animation : null
            };
            var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
            layer.addGeometry(geometries);
            for (var i = 0; i < geometries.length; i++) {
                var geo = geometries[i];
                geo.setInfoWindow(options);
                geo.openInfoWindow();
                var w = geo.getInfoWindow();
                expect(w.isVisible()).to.be.ok();
                geo.closeInfoWindow();
                expect(w.isVisible()).not.to.be.ok();
                geo.removeInfoWindow();
                expect(geo.getInfoWindow()).not.to.be.ok();
            }
        });

        it('set and open/close and remove a customized infowindow', function () {
            var options = {
                custom:true,
                content: '<div style="width:400px;height:300;">this is a customized infowindow.</div>',
                animation : null
            };
            var geometries = GEN_GEOMETRIES_OF_ALL_TYPES();
            layer.addGeometry(geometries);
            for (var i = 0; i < geometries.length; i++) {
                var geo = geometries[i];
                geo.setInfoWindow(options);
                geo.openInfoWindow();
                var w = geo.getInfoWindow();
                expect(w.isVisible()).to.be.ok();
                geo.closeInfoWindow();
                expect(w.isVisible()).not.to.be.ok();
                geo.removeInfoWindow();
                expect(geo.getInfoWindow()).not.to.be.ok();
            }
        });

        it('hide when geometry is hided', function () {
            var options = {
                title: 'title',
                content: 'content',
                animation : null
            };
            var geo = new maptalks.Marker(map.getCenter());
            layer.addGeometry(geo);

            geo.setInfoWindow(options);
            geo.openInfoWindow();
            var w = geo.getInfoWindow();
            expect(w.isVisible()).to.be.ok();

            geo.hide();

            expect(w.isVisible()).not.to.be.ok();
        });

        it('hide when layer is hided', function () {
            var options = {
                title: 'title',
                content: 'content',
                animation : null
            };
            var geo = new maptalks.Marker(map.getCenter());
            layer.addGeometry(geo);

            geo.setInfoWindow(options);
            geo.openInfoWindow();
            var w = geo.getInfoWindow();
            expect(w.isVisible()).to.be.ok();

            layer.hide();

            expect(w.isVisible()).not.to.be.ok();
        });

        it('create and hide when layer is hided', function () {
            var options = {
                title: 'title',
                content: 'content',
                animation : null
            };
            var infoWindow = new maptalks.ui.InfoWindow(options);
            var geo = new maptalks.Marker(map.getCenter());
            layer.addGeometry(geo);

            infoWindow.addTo(geo);
            infoWindow.show(geo.getCenter());
            var w = geo.getInfoWindow();
            expect(w.isVisible()).to.be.ok();

            layer.hide();

            expect(w.isVisible()).not.to.be.ok();
        });

        it('move when geometry is moved', function () {
            var options = {
                title: 'title',
                content: 'content',
                animation : null
            };
            var geo = new maptalks.Marker(map.getCenter());
            layer.addGeometry(geo);

            geo.setInfoWindow(options);
            geo.openInfoWindow();

            var w = geo.getInfoWindow();
            var pos1 = w.getPosition();

            geo.setCoordinates(map.getCenter().add(0.1, 0.1));

            var pos2 = w.getPosition();
            expect(w.isVisible()).to.be.ok();
            expect(pos2.toArray()).not.to.be.eql(pos1.toArray());
        });

        it('animate', function (done) {
            var options = {
                title: 'title',
                content: 'content',
                animation : 'fade,scale',
                animationOnHide : true,
                animationDuration : 50,
                autoPan : false
            };
            var infoWindow = new maptalks.ui.InfoWindow(options);
            var geo = new maptalks.Marker(map.getCenter());
            layer.addGeometry(geo);

            infoWindow.addTo(geo);
            infoWindow.show();

            var p = infoWindow.getPosition();
            // expect(infoWindow.getDOM().style.opacity).to.be.eql(0);
            // expect(infoWindow.getDOM().style[maptalks.DomUtil.TRANSFORM]).to.be.eql('scale(0)');

            setTimeout(function () {
                //show animations
                expect(infoWindow.getDOM().style.opacity).to.be.eql(1);
                expect(infoWindow.getDOM().style[maptalks.DomUtil.TRANSFORM]).to.be.eql('translate3d(' + p.x + 'px, ' + p.y + 'px, 0px) scale(1)');
                expect(infoWindow.isVisible()).to.be.ok();
                infoWindow.hide();
                expect(infoWindow.getDOM().style.display).to.be.eql('');
                setTimeout(function () {
                    //hide animations
                    expect(infoWindow.getDOM().style.display).to.be.eql('none');
                    expect(infoWindow.getDOM().style.opacity).to.be.eql(0);
                    expect(infoWindow.getDOM().style[maptalks.DomUtil.TRANSFORM]).to.be.eql('translate3d(' + p.x + 'px, ' + p.y + 'px, 0px) scale(0)');
                    expect(infoWindow.isVisible()).not.to.be.ok();
                    done();
                }, options.animationDuration + 2);
            }, options.animationDuration + 2);
        });

        it('autoPan', function (done) {
            var options = {
                title: 'title',
                content: 'content',
                animation : false,
                autoPan : true,
                autoPanDuration : 100,
            };
            var infoWindow = new maptalks.ui.InfoWindow(options);
            var center = map.getCenter();
            var geo = new maptalks.Marker(map.getExtent().getMin());
            layer.addGeometry(geo);

            infoWindow.addTo(geo);
            infoWindow.show();

            setTimeout(function () {
                expect(center.toArray()).not.to.be.eql(map.getCenter().toArray());
                done();
            }, infoWindow.options['autoPanDuration'] + 1);
        });

        it('disable autoPan', function (done) {
            var options = {
                title: 'title',
                content: 'content',
                animation : false,
                autoPan : false,
                autoPanDuration : 100,
            };
            var infoWindow = new maptalks.ui.InfoWindow(options);
            var center = map.getCenter();
            var geo = new maptalks.Marker(map.getExtent().getMin());
            layer.addGeometry(geo);

            infoWindow.addTo(geo);
            infoWindow.show();

            setTimeout(function () {
                expect(center.toArray()).to.be.eql(map.getCenter().toArray());
                done();
            }, infoWindow.options['autoPanDuration'] + 1);
        });

        it('single mode', function () {
            var options = {
                title: 'title',
                content: 'content',
                animation : false,
                autoPan : false,
                autoPanDuration : 100,
            };
            var infoWindow = new maptalks.ui.InfoWindow(options);
            var geo = new maptalks.Marker(map.getExtent().getMin());

            var infoWindow2 = new maptalks.ui.InfoWindow(options);
            var geo2 = new maptalks.Marker(map.getExtent().getMin());

            layer.addGeometry(geo, geo2);

            infoWindow.addTo(geo).show();
            infoWindow2.addTo(geo2).show();

            expect(map._panels['ui'].children.length).to.be.eql(1);
        });

        it('disable single mode', function () {
            var options = {
                title: 'title',
                content: 'content',
                animation : false,
                autoPan : false,
                autoPanDuration : 100,
                single : false
            };
            var infoWindow = new maptalks.ui.InfoWindow(options);
            var geo = new maptalks.Marker(map.getExtent().getMin());

            var infoWindow2 = new maptalks.ui.InfoWindow(options);
            var geo2 = new maptalks.Marker(map.getExtent().getMin());

            layer.addGeometry(geo, geo2);

            infoWindow.addTo(geo).show();
            infoWindow2.addTo(geo2).show();

            expect(map._panels['ui'].children.length).to.be.eql(2);
        });
    });

});
