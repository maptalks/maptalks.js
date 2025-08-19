describe('UI.UIMarker', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var context = {

    };
    var layer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        context.map = map;
        layer = new maptalks.VectorLayer('v').addTo(map);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('add', function () {
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<div id="uimarker">marker</div>'
        });
        marker.addTo(map).show();
        var m = document.getElementById('uimarker');
        expect(m).to.be.ok();
        expect(m.clientHeight).to.be.above(0);
        expect(m.clientWidth).to.be.above(0);
    });

    it('add2', function () {
        var dom = document.createElement('div');
        dom.id = 'uimarker';
        dom.innerHTML = 'marker';
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content: dom
        });
        marker.addTo(map);
        var m = document.getElementById('uimarker');
        expect(m).to.be.ok();
        expect(m.clientHeight).to.be.above(0);
        expect(m.clientWidth).to.be.above(0);
        expect(marker.isVisible()).to.be.ok();
    });

    it('show when zooming', function (done) {
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<div id="uimarker">marker</div>'
        });
        marker.addTo(map).show();
        map.on('zoomstart', function () {
            expect(marker.isVisible()).to.be.ok();
        });
        map.on('zoomend', function () {
            expect(marker.isVisible()).to.be.ok();
            done();
        });
        map.zoomIn();
    });

    it('can flash', function (done) {
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<div id="uimarker">marker</div>'
        });
        marker.addTo(map).flash(100, 1, function () {
            expect(marker.isVisible()).to.be.ok();
            done();
        });
    });

    it('can hide', function () {
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<div id="uimarker">marker</div>',
            animation: null
        });
        marker.addTo(map).show();
        marker.hide();
        expect(marker.isVisible()).not.to.be.ok();
        var m = document.getElementById('uimarker');
        expect(m).to.be.ok();
        expect(m.clientHeight).to.be.eql(0);
        expect(m.clientWidth).to.be.eql(0);
    });

    it('can remove', function () {
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<div id="uimarker">marker</div>'
        });
        marker.addTo(map).show();
        marker.remove();
        var m = document.getElementById('uimarker');
        expect(m).not.to.be.ok();
    });

    it('is not single', function () {
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<svg>marker</svg>'
        });
        marker.addTo(map).show();
        var marker2 = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<svg>marker2</svg>'
        });
        marker2.addTo(map).show();

        var m = document.getElementsByTagName('svg');
        expect(m).to.have.length(2);
    });

    it('can be set to single', function () {
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            single: true,
            content: '<svg>marker</svg>'
        });
        marker.addTo(map).show();
        var marker2 = new maptalks.ui.UIMarker(map.getCenter(), {
            single: true,
            content: '<svg>marker2</svg>'
        });
        marker2.addTo(map).show();

        var m = document.getElementsByTagName('svg');
        expect(m).to.have.length(1);
    });

    it('can getContent', function () {
        var content = '<svg>marker</svg>';
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            single: true,
            content: content
        });
        marker.addTo(map).show();
        expect(marker.getContent()).to.be.eql(content);
    });

    it('can setContent', function () {
        var content = '<svg>marker</svg>';
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            single: true,
            content: '<div id="uimarker">marker</div>'
        });
        marker.addTo(map).show();
        var m = document.getElementById('uimarker');
        expect(m).to.be.ok();
        marker.setContent(content);
        expect(marker.getContent()).to.be.eql(content);
        m = document.getElementById('uimarker');
        expect(m).not.to.be.ok();
    });

    it('can getCoordinates', function () {
        var content = '<svg>marker</svg>';
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            single: true,
            content: content
        });
        marker.addTo(map).show();
        expect(marker.getCoordinates().toArray()).to.be.eql(map.getCenter().toArray());
    });

    it('can setCoordinates', function () {
        var content = '<svg>marker</svg>';
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            single: true,
            content: content
        });
        marker.addTo(map).show();
        marker.setCoordinates(map.getCenter().add(0.01, 0.01));
        expect(marker.getCoordinates().toArray()).to.be.eql(map.getCenter().add(0.01, 0.01).toArray());
    });

    it('can be set to pitchWithMap', function (done) {
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            pitchWithMap: true,
            rotateWithMap: true,
            content: '<div id="uimarker">marker</div>'
        });
        marker.addTo(map).show();
        var m = document.getElementById('uimarker');
        expect(m).to.be.ok();
        marker.setCoordinates(map.getCenter().add(0.01, 0.01));

        map.setPitch(40).setBearing(50);

        var renderer = map._getRenderer();
        renderer.callInNextFrame(function () {
            var transform = m.parentElement.style.transform;
            var mapPitch = Math.round(map.getPitch());
            var mapBearing = Math.round(map.getBearing());
            expect(transform.indexOf('rotateX(' + mapPitch + 'deg) rotateZ(-' + mapBearing + 'deg)')).to.be.above(0);
            done();
        });
    });
    it('has altitude', function (done) {
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<div id="uimarker" class="text-marker" style="width:100px;height:40px;background:black;color:white;text-align:center;">maptalks</div>',
            verticalAlignment: 'top',
            altitude: 20,
            dy: -5
        });
        marker.addTo(map).show();

        setTimeout(function () {
            var m = document.getElementById('uimarker');
            expect(m).to.be.ok();
            map.getContainer().style.width = '400px';
            map.getContainer().style.height = '300px';
            var renderer = map._getRenderer();
            renderer.callInNextFrame(function () {
                var rect = m.getBoundingClientRect();
                var size = map.getSize();
                var cy = size.height / 2;
                expect(rect.height).to.be.equal(40);
                cy -= 50;
                var inRect = cy >= rect.top && cy <= rect.bottom;
                expect(inRect).to.be.equal(true);
                cy -= 40;
                var inRect = cy >= rect.top && cy <= rect.bottom;
                expect(inRect).to.be.equal(false);
                done();
            });
        }, 200);

        map.setView({
            zoom: 18,
            pitch: 60
        });
    });

    it('UIMarker Can only be added to the map', function (done) {
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<div id="uimarker" class="text-marker" style="width:100px;height:40px;background:black;color:white;text-align:center;">maptalks</div>',
            verticalAlignment: 'top',
            altitude: 20,
            dy: -5
        });
        //layer add uimarker
        try {
            layer.addGeometry(marker);
        } catch (err) {
            expect(!!err).to.be.ok();
        }
        expect(layer.getGeometries().length).to.be.equal(0);
        //add Invalid geometry
        try {
            layer.addGeometry({ type: 'hello' });
        } catch (err) {
            expect(!!err).to.be.ok();
        }

        expect(layer.getGeometries().length).to.be.equal(0);
        //uimarker add to layer
        try {
            marker.addTo(layer);
        } catch (err) {
            expect(!!err).to.be.ok();
        }
        //uimarker add Geometry
        const point = new maptalks.Marker(map.getCenter());
        try {
            marker.addTo(point);
        } catch (err) {
            expect(!!err).to.be.ok();
        }
        done();
    });

    it('#2607 collision should update when collision state change', function (done) {
        var marker1 = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<div id="uimarker" class="text-marker" style="width:100px;height:40px;background:black;color:white;text-align:center;">maptalks</div>',
            verticalAlignment: 'top',
            collision: true
        }).addTo(map);
        var marker2 = new maptalks.ui.UIMarker(map.getCenter(), {
            content: '<div id="uimarker" class="text-marker" style="width:100px;height:40px;background:black;color:white;text-align:center;">maptalks</div>',
            verticalAlignment: 'top',
            collision: true
        }).addTo(map);

        setTimeout(() => {
            expect(marker1.getDOM().style.visibility).to.be.equal('visible');
            expect(marker2.getDOM().style.visibility).to.be.equal('hidden');
            marker2.config({
                collision: false
            });
            setTimeout(() => {
                expect(marker1.getDOM().style.visibility).to.be.equal('visible');
                expect(marker2.getDOM().style.visibility).to.be.equal('visible');
                done();
            }, 100);
        }, 100);



    });
});
