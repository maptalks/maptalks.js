describe('#MapPan', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '2px';
        container.style.height = '2px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:false,
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        REMOVE_CONTAINER(container);
    });

    it('panTo without animation', function (done) {
        var coord = center.substract(1, 1);
        map.once('moveend', function () {
            expect(map.getCenter()).to.be.closeTo(coord);
            done();
        });
        map.panTo(coord, { 'animation' : false });
    });

    it('panTo', function (done) {
        var coord = center.substract(1, 1);
        map.once('moveend', function () {
            expect(map.getCenter()).to.be.closeTo(coord);
            done();
        });
        map.panTo(coord, { 'animation' : true });
    });

    it('panBy without animation', function (done) {
        var offset = { x: 20, y: 20 };
        map.once('moveend', function () {
            expect(map.getCenter()).not.to.be.eql(center);
            done();
        });
        map.panBy(offset, { 'animation' : false });
    });

    it('panBy without animation', function (done) {
        var offset = { x: 20, y: 20 };
        map.once('moveend', function () {
            expect(map.getCenter()).not.to.be.eql(center);
            done();
        });
        map.panBy(offset, { 'animation' : true });
    });

    it('change zoom or center during panning', function (done) {
        var coord = center.substract(1, 1),
            newCenter = center.add(1, 1);
        var counter = 0;
        map.on('moveend', function () {
            counter++;
            if (counter === 1) {
                return;
            }
            expect(map.getCenter()).to.be.closeTo(newCenter);
            done();
        });
        map.panTo(coord, { 'animation' : true });
        map.setCenterAndZoom(newCenter, map.getZoom() + 1);
    });
});
