describe('DistanceTool and AreaTool', function () {
    var container, eventContainer;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    function measure(tool) {
        var center = map.getCenter();

        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(center).add(domPosition);

        var measure = 0;
        happen.mousedown(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        happen.click(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        var i;
        for (i = 1; i < 10; i++) {
            happen.mousemove(eventContainer, {
                'clientX':point.x + i,
                'clientY':point.y
            });
        }

        happen.mousedown(eventContainer, {
            'clientX':point.x + 10,
            'clientY':point.y
        });
        happen.click(eventContainer, {
            'clientX':point.x + 10,
            'clientY':point.y
        });

        happen.mousedown(eventContainer, {
            'clientX':point.x + 10,
            'clientY':point.y + 10
        });
        happen.click(eventContainer, {
            'clientX':point.x + 10,
            'clientY':point.y + 10
        });

        if (tool.isEnabled()) {
            expect(tool.getLastMeasure()).to.be.above(measure);
            measure = tool.getLastMeasure();
        }
        for (i = 1; i < 5; i++) {
            happen.mousemove(eventContainer, {
                'clientX':point.x,
                'clientY':point.y + i
            });
            if (tool.isEnabled()) {
                expect(tool.getLastMeasure()).to.be.above(0);
            }
        }
        happen.mousedown(eventContainer, {
            'clientX':point.x - 1,
            'clientY':point.y + 5
        });
        happen.click(eventContainer, {
            'clientX':point.x - 1,
            'clientY':point.y + 5
        });
        happen.dblclick(eventContainer, {
            'clientX':point.x - 1,
            'clientY':point.y + 5
        });
        if (tool.isEnabled()) {
            expect(tool.getLastMeasure()).to.be.above(measure);
            measure = tool.getLastMeasure();
        }
    }

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        map.config('zoomAnimation', false);
        map.setZoom(5);
        eventContainer = map._panels.canvasContainer;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });
    describe('test distanceTool', function () {


        it('can measure distance', function () {
            var distanceTool = new maptalks.DistanceTool({
                metric : true,
                imperial:true
            }).addTo(map);
            expect(distanceTool.getLastMeasure()).to.be.eql(0);
            measure(distanceTool);
            expect(distanceTool.getLastMeasure()).to.be.above(0);
        });

        it('can get measureLayers', function () {
            var distanceTool = new maptalks.DistanceTool({
                metric : true,
                imperial:true
            }).addTo(map);
            measure(distanceTool);
            var measureLayers = distanceTool.getMeasureLayers();
            expect(measureLayers).to.have.length(2);
            var result = distanceTool.getLastMeasure();
            expect(measureLayers[0].getGeometries()[0].getLength()).to.be.eql(result);
        });

        it('can clear measure results', function () {
            var distanceTool = new maptalks.DistanceTool({
                metric : true,
                imperial:true
            }).addTo(map);
            measure(distanceTool);
            distanceTool.clear();
            var measureLayers = distanceTool.getMeasureLayers();
            expect(measureLayers).to.have.length(0);
            var result = distanceTool.getLastMeasure();
            expect(result).to.be.eql(0);
        });

        it('enable/disable', function () {
            var tool = new maptalks.DistanceTool().addTo(map).disable();
            tool.disable();
            measure(tool);
            var result = tool.getLastMeasure();
            expect(result).to.be(0);
            tool.enable();
            measure(tool);
            result = tool.getLastMeasure();
            expect(result).to.be.above(0);
        });
    });

    describe('test areaTool', function () {

        it('can measure area', function () {
            var areaTool = new maptalks.AreaTool({
                metric : true,
                imperial:true
            });
            areaTool.addTo(map);
            expect(areaTool.getLastMeasure()).to.be.eql(0);
            measure(areaTool);
            expect(areaTool.getLastMeasure()).to.be.above(0);
        });

        it('can get measureLayers', function () {
            var areaTool = new maptalks.AreaTool({
                metric : true,
                imperial:true,
                'clearButtonSymbol' : [{
                    'markerType': 'ellipse',
                    'markerFill': '#ffffff',
                    'markerLineColor': '#b4b3b3',
                    'markerLineWidth': 2,
                    'markerWidth': 15,
                    'markerHeight': 15,
                    'markerDx': 20
                }, {
                    'markerType': 'x',
                    'markerWidth': 10,
                    'markerHeight': 10,
                    'markerDx': 20
                }]
            }).addTo(map);
            measure(areaTool);
            var measureLayers = areaTool.getMeasureLayers();
            expect(measureLayers).to.have.length(2);
            var result = areaTool.getLastMeasure();
            expect(measureLayers[0].getGeometries()[0].getArea()).to.be.eql(result);
        });

        it('can clear measure results', function () {
            var areaTool = new maptalks.AreaTool({
                metric : true,
                imperial:true,
                'clearButtonSymbol' : {
                    'markerType': 'ellipse',
                    'markerFill': '#ffffff',
                    'markerLineColor': '#b4b3b3',
                    'markerLineWidth': 2,
                    'markerWidth': 15,
                    'markerHeight': 15,
                    'markerDx': 20
                }
            }).addTo(map);
            measure(areaTool);
            areaTool.clear();
            var measureLayers = areaTool.getMeasureLayers();
            expect(measureLayers).to.have.length(0);
            var result = areaTool.getLastMeasure();
            expect(result).to.be.eql(0);
        });

        it('enable/disable', function () {
            var tool = new maptalks.AreaTool().addTo(map).disable();
            measure(tool);
            var result = tool.getLastMeasure();
            expect(result).to.be(0);
            tool.enable();
            measure(tool);
            result = tool.getLastMeasure();
            expect(result).to.be.above(0);
        });
    });


});
