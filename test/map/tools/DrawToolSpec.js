


describe('#DrawTool', function () {
    var container,eventContainer;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);

    function drawLine() {
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

    function dragDraw() {
        var center = map.getCenter();

        var domPosition = Z.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        happen.mousedown(eventContainer,{
                'clientX':point.x,
                'clientY':point.y
                });
        for (var i = 0; i < 10; i++) {
            happen.mousemove(eventContainer,{
                'clientX':point.x+i,
                'clientY':point.y+i
                });
        };
        happen.mouseup(eventContainer,{
                'clientX':point.x+10,
                'clientY':point.y+10
                });
    }
    function drawPoint() {
        var center = map.getCenter();

        var domPosition = Z.DomUtil.getPagePosition(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);
        happen.click(eventContainer,{
                'clientX':point.x,
                'clientY':point.y
                });
    }
    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        eventContainer = map._panels.canvasContainer;;

    });

    afterEach(function() {
        removeContainer(container)
    });
    describe('draw geometries', function() {
        it('throw exception with an undefined mode', function() {
            expect(function() {
                var drawTool = new Z.DrawTool({
                });
            }).to.throwException();
        });

        it('throw exception with an invalid mode', function() {
            expect(function() {
                var drawTool = new Z.DrawTool({
                    mode : 'invalidMode'
                });
            }).to.throwException();
        });

        it('can draw a marker', function(done) {
            function drawEnd(param) {
                expect(param.geometry instanceof Z.Marker).to.be.ok();
                expect(param.geometry.getCoordinates()).to.be.closeTo(map.getCenter());
                done();
            }
            var drawTool = new Z.DrawTool({
                mode : 'Point'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', drawEnd);
            drawPoint();
        });

        it('can draw linestring', function(done) {
            function drawEnd(param) {
                expect(param.geometry instanceof Z.LineString).to.be.ok();
                expect(param.geometry.getLength()).to.above(0);
                done();
            }
            var drawTool = new Z.DrawTool({
                mode : 'LineString'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', drawEnd);
            drawLine();
        });

        it('can draw Polygon', function(done) {
            function drawEnd(param) {
                expect(param.geometry instanceof Z.Polygon).to.be.ok();
                expect(param.geometry.getArea()).to.above(0);
                done();
            }
            var drawTool = new Z.DrawTool({
                mode : 'Polygon'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', drawEnd);
            drawLine();
        });

        it('can draw circle', function(done) {
            function drawEnd(param) {
                expect(param.geometry instanceof Z.Circle).to.be.ok();
                expect(param.geometry.getRadius()).to.above(0);
                done();
            }
            var drawTool = new Z.DrawTool({
                mode : 'Circle'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', drawEnd);
            dragDraw();
        });

        it('can draw Rectangle', function(done) {
            function drawEnd(param) {
                expect(param.geometry instanceof Z.Rectangle).to.be.ok();
                expect(param.geometry.getWidth()).to.above(0);
                expect(param.geometry.getHeight()).to.above(0);
                done();
            }
            var drawTool = new Z.DrawTool({
                mode : 'Rectangle'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', drawEnd);
            dragDraw();
        });

        it('can draw Ellipse', function(done) {
            function drawEnd(param) {
                expect(param.geometry instanceof Z.Ellipse).to.be.ok();
                expect(param.geometry.getWidth()).to.above(0);
                expect(param.geometry.getHeight()).to.above(0);
                done();
            }
            var drawTool = new Z.DrawTool({
                mode : 'Ellipse'
            });
            drawTool.addTo(map);
            drawTool.on('drawend', drawEnd);
            dragDraw();
        });
    });

});
