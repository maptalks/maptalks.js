


describe('#DistanceTool and AreaTool', function () {
    var container,eventContainer;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);

    function measure() {
        var center = map.getCenter();

        var domPosition = Z.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var requestAnimFn = Z.Util.requestAnimFrame;

        happen.click(eventContainer,{
                'clientX':point.x,
                'clientY':point.y
                });
        for (var i = 0; i < 10; i++) {
            happen.mousemove(eventContainer,{
                'clientX':point.x+i,
                'clientY':point.y+i
                });
        };
        happen.click(eventContainer,{
                'clientX':point.x+10,
                'clientY':point.y
                });
        happen.click(eventContainer,{
                'clientX':point.x,
                'clientY':point.y+10
                });
        happen.dblclick(eventContainer,{
                'clientX':point.x-1,
                'clientY':point.y+5
                });
    }

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        eventContainer = map._containerDOM;

    });

    afterEach(function() {
        document.body.removeChild(container);
    });
    describe('measure', function() {
        it('can measure area', function() {
            var areaTool = new Z.AreaTool({
                metric : true,
                imperial:true
            });
            areaTool.addTo(map);
            expect(areaTool.getLastMeasure()).to.be.eql(0);
            measure();
            expect(areaTool.getLastMeasure()).to.be.above(0);
        });

        it('can measure distance', function() {
            var distanceTool = new Z.DistanceTool({
                metric : true,
                imperial:true
            }).addTo(map);
            expect(distanceTool.getLastMeasure()).to.be.eql(0);
            measure();
            expect(distanceTool.getLastMeasure()).to.be.above(0);
        });
    });

});
