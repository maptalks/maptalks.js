


describe('#DrawTool', function () {
    var container,mapPlatform;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);

    function drawLine() {
        var center = map.getCenter();

        var domPosition = Z.DomUtil.getPageCoordinate(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        var requestAnimFn = Z.Util.requestAnimFrame;

        happen.click(mapPlatform,{
                'clientX':point.x,
                'clientY':point.y
                });
        for (var i = 0; i < 10; i++) {
            happen.mousemove(document,{
                'clientX':point.x+i,
                'clientY':point.y+i
                });
        };
        happen.click(mapPlatform,{
                'clientX':point.x+10,
                'clientY':point.y
                });
        happen.click(mapPlatform,{
                'clientX':point.x,
                'clientY':point.y+10
                });
        happen.dblclick(mapPlatform,{
                'clientX':point.x-1,
                'clientY':point.y+5
                });
    }

    function dragDraw() {
        var center = map.getCenter();

        var domPosition = Z.DomUtil.getPageCoordinate(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        happen.mousedown(mapPlatform,{
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
        mapPlatform = map._containerDOM;

    });

    afterEach(function() {
        document.body.removeChild(container);
    });
    describe('draw geometries', function() {
        it('can draw linestring', function() {
            var spy = sinon.spy();
            var drawTool = new Z.DrawTool({
                mode : 'LineString'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', spy);
            drawLine();
            expect(spy.called).to.be.ok();
        });

        it('can draw Polygon', function() {
            var spy = sinon.spy();
            var drawTool = new Z.DrawTool({
                mode : 'Polygon'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', spy);
            drawLine();
            expect(spy.called).to.be.ok();
        });

        it('can draw circle', function() {
            var spy = sinon.spy();
            var drawTool = new Z.DrawTool({
                mode : 'Circle'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', spy);
            dragDraw();
            // expect(spy.called).to.be.ok();
        });

        it('can draw Rectangle', function() {
            var spy = sinon.spy();
            var drawTool = new Z.DrawTool({
                mode : 'Rectangle'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', spy);
            dragDraw();
            // expect(spy.called).to.be.ok();
        });

        it('can draw Ellipse', function() {
            var spy = sinon.spy();
            var drawTool = new Z.DrawTool({
                mode : 'Ellipse'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', spy);
            dragDraw();
            // expect(spy.called).to.be.ok();
        });
    });

});
