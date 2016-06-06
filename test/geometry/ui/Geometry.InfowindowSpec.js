describe("Geometry.Infowindow", function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
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
        map = new Z.Map(container, option);
        tile = new Z.TileLayer('tile', {

            urlTemplate:"http://t{s}.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}",
            subdomains: [1, 2, 3]
        });
        layer = new Z.VectorLayer('vector').addTo(map);
    });

    afterEach(function () {
        removeContainer(container)
    });

    it("infowindow has methods to change itself.", function(done) {
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

    describe("all kinds of geometries can have a infowindow", function() {
        it('set a infowindow', function() {
            var options = {
                title: 'title',
                content: 'content'
            };
            var geometries = genAllTypeGeometries();
            for (var i = 0; i < geometries.length; i++) {
                geometries[i].setInfoWindow(options);
                expect(geometries[i].getInfoWindow()).not.to.be.ok();
            }
            layer.addGeometry(geometries);
        });

        it('set and open/close and remove a infowindow', function() {
            var options = {
                title: 'title',
                content: 'content'
            };
            var geometries = genAllTypeGeometries();
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

        it('set and open/close and remove a customized infowindow', function() {
            var options = {
                custom:true,
                content: '<div style="width:400px;height:300;">this is a customized infowindow.</div>'
            };
            var geometries = genAllTypeGeometries();
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

    });

});
