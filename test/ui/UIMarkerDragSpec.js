describe('#UIMarkerDrag', function () {
    var container, eventContainer;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    function dragMarker(marker, isMove) {
        var spy = sinon.spy();
        marker.on('mousedown', spy);
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(marker.getCoordinates()).add(domPosition);
        happen.mousedown(marker.getDOM(), {
            'clientX':point.x,
            'clientY':point.y
        });
        expect(spy.called).to.be.ok();
        if (isMove === undefined || isMove) {
            for (var i = 0; i < 10; i++) {
                happen.mousemove(document, {
                    'clientX':point.x + i,
                    'clientY':point.y + i
                });
            }
            if (marker.options.draggable) {
                expect(marker.isDragging()).to.be.ok();
            }
        }

        happen.mouseup(document);
    }

    function dragMap() {
        var domPosition = GET_PAGE_POSITION(container);
        var point = map.coordinateToContainerPoint(map.getCenter()).add(domPosition).add(new maptalks.Point(30, 20));
        happen.mousedown(eventContainer, {
            'clientX':point.x,
            'clientY':point.y
        });
        for (var i = 0; i < 10; i++) {
            happen.mousemove(document, {
                'clientX':point.x + i,
                'clientY':point.y + i
            });
        }
        happen.mouseup(document);
    }

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
        context.map = map;
        eventContainer = map.getPanels().canvasContainer;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('drag uimarker', function () {
        it('in default, uimarkers cannot be dragged', function () {
            var center = map.getCenter();
            var marker = new maptalks.ui.UIMarker(map.getCenter(), {
                content : '<div id="uimarker">marker</div>'
            });
            marker.addTo(map).show();
            dragMarker(marker);
            expect(marker.getCoordinates()).to.be.closeTo(center);
        });
    });

    it('can drag a uimarker', function () {
        var center = map.getCenter();
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content : '<div id="uimarker">marker</div>',
            draggable : true
        });
        marker.addTo(map).show();
        dragMarker(marker);
        expect(marker.getCoordinates()).not.to.be.eql(center);
    });

    it('can disable draggable', function () {
        var center = map.getCenter();
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content : '<div id="uimarker">marker</div>',
            draggable : true
        });
        marker.addTo(map).show();
        marker.config('draggable', false);
        dragMarker(marker);
        expect(marker.getCoordinates()).to.be.eql(center);
    });

    it('enable map draggable after dragging', function () {
        var center = map.getCenter();
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content : '<div id="uimarker">marker</div>',
            draggable : true
        });
        marker.addTo(map).show();
        dragMarker(marker);
        center = map.getCenter();
        dragMap();
        expect(map.getCenter()).not.to.closeTo(center);
    });

    it('enable map draggable after dragging without moving', function () {
        var center = map.getCenter();
        var marker = new maptalks.ui.UIMarker(map.getCenter(), {
            content : '<div id="uimarker">marker</div>',
            draggable : true
        });
        marker.addTo(map).show();
        dragMarker(marker, false);
        center = map.getCenter();
        dragMap();
        expect(map.getCenter()).not.to.closeTo(center);
    });
});
