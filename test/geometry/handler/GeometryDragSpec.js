
describe('#GeometryDrag', function () {
    var container,eventContainer;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);

    function dragGeometry(geometry) {
        var layer = new Z.VectorLayer('id');
        map.addLayer(layer);

        geometry.addTo(layer);
        var spy = sinon.spy();
        geometry.on('mousedown', spy);

        var domPosition = Z.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
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
        for (var i = 0; i < 10; i++) {
            happen.mousemove(document,{
                'clientX':point.x+i,
                'clientY':point.y+i
                });
        };
        happen.mouseup(document);
        Z.Util.requestAnimFrame = requestAnimFn;
    }

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        eventContainer = map._panels.mapMask;
    });

    afterEach(function() {
        document.body.removeChild(container);
    });
    describe('drag a marker', function() {
        it('in default, geometries cannot be dragged', function() {
            var marker = new maptalks.Marker(center);
            dragGeometry(marker);
            expect(marker.getCoordinates()).to.be.nearCoord(center);
        });

        it('can drag a default marker', function() {
            var marker = new maptalks.Marker(center,{draggable:true});
            dragGeometry(marker);
            expect(marker.getCoordinates()).not.to.be.eql(center);
        });
    });

    describe('drag can be disable', function() {
        it('disables dragging', function() {
            var marker = new maptalks.Marker(center,{draggable:false});
            dragGeometry(marker);
            expect(marker.getCoordinates()).to.be.nearCoord(center);
        });
    });


});
