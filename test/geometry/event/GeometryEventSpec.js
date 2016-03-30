describe('Geometry.Events', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var eventContainer;
    var layer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        eventContainer = map._panels.mapMask;
        layer = new maptalks.VectorLayer('vector');
        map.addLayer(layer);
    });

    afterEach(function() {
        removeContainer(container)
    });

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
            happen.mousemove(eventContainer,{
                'clientX':point.x+i,
                'clientY':point.y+i
                });
        };
        happen.mouseup(eventContainer);
        Z.Util.requestAnimFrame = requestAnimFn;
    }

    describe('events',function() {
        it('mousemove and mouseout',function(done) {
            var circle = new maptalks.Circle(map.getCenter(), 10);
            circle.addTo(layer);
            var circle2 = new maptalks.Circle(map.locate(map.getCenter(), 100, 100), 10).addTo(layer);
            var domPosition = Z.DomUtil.getPagePosition(container);
            var point = map.coordinateToContainerPoint(center).add(domPosition);
            function onMouseMove(param) {
                expect(param.type).to.be.eql('mousemove');
                circle.off('mousemove', onMouseMove);
                happen.mousemove(eventContainer,{
                        'clientX':point.x+100,
                        'clientY':point.y+100
                        });
            }
            circle.on('mousemove', onMouseMove);
            circle.on('mouseout',function(param) {
                expect(param.type).to.be.eql('mouseout');
                done();
            });

            happen.mousemove(eventContainer,{
                'clientX':point.x,
                'clientY':point.y
                });
        });

        it('mouseover',function(done) {
            var circle = new maptalks.Circle(map.getCenter(), 10);
            circle.addTo(layer);
            var domPosition = Z.DomUtil.getPagePosition(container);
            var point = map.coordinateToContainerPoint(center).add(domPosition);
            function onMouseOver(param) {
                expect(param.type).to.be.eql('mouseover');
                expect(param.target === circle).to.be.ok();
                done();
            }
            circle.on('mouseover', onMouseOver);
            happen.mousemove(eventContainer,{
                'clientX':point.x,
                'clientY':point.y
                });
        });

        it('click',function() {
            var circle = new maptalks.Circle(map.getCenter(), 10);
            circle.addTo(layer);
            var domPosition = Z.DomUtil.getPagePosition(container);
            var point = map.coordinateToContainerPoint(center).add(domPosition);
            var spy = sinon.spy();
            circle.on('click', spy);

            happen.click(eventContainer,{
                'clientX':point.x,
                'clientY':point.y
                });
            expect(spy.called).to.be.ok();
        });

        it('disable events listening',function() {
            var circle = new maptalks.Circle(map.getCenter(), 10);
            circle.addTo(layer);
            map.config('geometryEvents', false);
            var domPosition = Z.DomUtil.getPagePosition(container);
            var point = map.coordinateToContainerPoint(center).add(domPosition);
            var spy = sinon.spy();
            circle.on('click', spy);

            happen.click(eventContainer,{
                'clientX':point.x,
                'clientY':point.y
                });
            expect(spy.called).not.to.be.ok();
        });
    });
});
