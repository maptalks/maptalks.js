
describe('#GeometryDrag', function () {
    var container,eventContainer;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);

    function dragGeometry(geometry, isMove) {
        map.removeLayer('id');
        var layer = new Z.VectorLayer('id');
        map.addLayer(layer);

        geometry.addTo(layer);
        var spy = sinon.spy();
        geometry.on('mousedown', spy);

        var domPosition = Z.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(geometry.getCenter()).add(domPosition);
        var requestAnimFn = Z.Util.requestAnimFrame;
        //replace original requestAnimFrame to immediate execution.
        Z.Util.requestAnimFrame=function(fn) {
            fn();
        };

        happen.mousedown(eventContainer,{
                'clientX':point.x,
                'clientY':point.y
                });
        expect(spy.called).to.be.ok();
        if (isMove === undefined || isMove) {
            for (var i = 0; i < 10; i++) {
                happen.mousemove(document,{
                    'clientX':point.x+i,
                    'clientY':point.y+i
                    });
            };
        }
        happen.mouseup(document);
        Z.Util.requestAnimFrame = requestAnimFn;
    }

    function dragMap() {
        var domPosition = Z.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(map.getCenter()).add(domPosition).add(new Z.Point(30,20));
        happen.mousedown(eventContainer,{
                'clientX':point.x,
                'clientY':point.y
                });
        for (var i = 0; i < 10; i++) {
            happen.mousemove(document,{
                'clientX':point.x+i,
                'clientY':point.y+i
                });
        };
        happen.mouseup(document);
    }

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        map.config('panAnimation', false);
        eventContainer = map._panels.canvasContainer;
    });

    afterEach(function() {
        removeContainer(container)
    });
    describe('drag geometries', function() {
        it('in default, geometries cannot be dragged', function() {
            var marker = new maptalks.Marker(center);
            dragGeometry(marker);
            expect(marker.getCoordinates()).to.be.closeTo(center);
        });

        it('can drag a default marker', function() {
            var marker = new maptalks.Marker(center,{draggable:true});
            dragGeometry(marker);
            expect(marker.getCoordinates()).not.to.be.eql(center);
        });

        it('drag all kinds of geometries', function() {
            this.timeout(8000);
            var geometries = genAllTypeGeometries();

            for (var i = 0; i < geometries.length; i++) {
                var geo = geometries[i];
                if (geo instanceof Z.GeometryCollection || geo instanceof Z.Sector  || geo instanceof Z.CurveLine) {
                    //not fit for geometry collection's test.
                    continue;
                }
                geo.config('draggable', true);
                var center = geo.getCenter();
                dragGeometry(geo);
                expect(geo.getCenter()).not.to.closeTo(center);
            }
        });

        it('enable map draggable after dragging', function() {
            var center = map.getCenter();
            var marker = new maptalks.Marker(center,{draggable:true});
            dragGeometry(marker);
            var center = map.getCenter();
            dragMap();
            expect(map.getCenter()).not.to.closeTo(center);
        });

        it('enable map draggable after dragging without moving', function() {
            var center = map.getCenter();
            var marker = new maptalks.Marker(center,{draggable:true});
            dragGeometry(marker, false);
            var center = map.getCenter();
            dragMap();
            expect(map.getCenter()).not.to.closeTo(center);
        });
    });

    describe('drag can be disable', function() {
        it('disables dragging', function() {
            var marker = new maptalks.Marker(center,{draggable:false});
            dragGeometry(marker);
            expect(marker.getCoordinates()).to.be.closeTo(center);
        });
    });


});
