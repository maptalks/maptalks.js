describe('MapSetCenter.Spec', function () {
    var container;
    var eventContainer;
    var map;
    var baseLayer;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    
    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '400px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation: false,
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
        map.config('zoomAnimationDuration', 20);
        map._getRenderer()._setCheckSizeInterval(20);
        baseLayer = new maptalks.VectorLayer('base_', new maptalks.Marker(center));
        eventContainer = map._panels.front;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });
    
    describe('#setCenterWidthPadding', function () {
        it('set center with paddingLeft', function () {
            map.setCenter(center, { paddingLeft: 100 });
            var pCenter = map.getCenter();
            var pPoint = map.coordinateToViewPoint(pCenter);
            var tPoint = map.coordinateToViewPoint(center);
            expect(Math.round(tPoint.x - pPoint.x)).to.equal(100/2);
        });

        it('set center with paddingRight', function () {
            map.setCenter(center, { paddingRight: 100 });
            var pCenter = map.getCenter();
            var pPoint = map.coordinateToViewPoint(pCenter);
            var tPoint = map.coordinateToViewPoint(center);
            expect(Math.round(tPoint.x - pPoint.x)).to.equal(-100/2);
        });

        it('set center with paddingLeft and paddingRight', function () {
            map.setCenter(center, { paddingLeft: 100, paddingRight: 180 });
            var pCenter = map.getCenter();
            var pPoint = map.coordinateToViewPoint(pCenter);
            var tPoint = map.coordinateToViewPoint(center);
            expect(Math.round(tPoint.x - pPoint.x)).to.equal((100 - 180) / 2);
        });
        
        it('set center with paddingTop', function () {
            map.setCenter(center, { paddingTop: 100 });
            var pCenter = map.getCenter();
            var pPoint = map.coordinateToViewPoint(pCenter);
            var tPoint = map.coordinateToViewPoint(center);
            expect(Math.round(tPoint.y - pPoint.y)).to.equal(100/2);
        });

        it('set center with paddingBottom', function () {
            map.setCenter(center, { paddingBottom: 100 });
            var pCenter = map.getCenter();
            var pPoint = map.coordinateToViewPoint(pCenter);
            var tPoint = map.coordinateToViewPoint(center);
            expect(Math.round(tPoint.y - pPoint.y)).to.equal(-100/2);
        });

        it('set center with paddingTop and paddingBottom', function () {
            map.setCenter(center, { paddingTop: 100, paddingBottom: 180 });
            var pCenter = map.getCenter();
            var pPoint = map.coordinateToViewPoint(pCenter);
            var tPoint = map.coordinateToViewPoint(center);
            expect(Math.round(tPoint.y - pPoint.y)).to.equal((100 - 180) / 2);
        });
    })
})