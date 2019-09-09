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
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('panTo without animation', function () {
        var coord = center.substract(1, 1);
        map.panTo(coord, { 'animation' : false });
        expect(map.getCenter()).to.be.closeTo(coord);
    });

    it('panTo', function (done) {
        var coord = center.substract(1, 1);
        map.once('moveend', function () {
            expect(map.getCenter()).to.be.closeTo(coord);
            done();
        });
        map.panTo(coord, { 'animation' : true });
    });

    it('when panning map to a point, call the callback function in each frame', function (done) {
        var coord = center.substract(1, 1);
        var spy = sinon.spy();
        var t = 100;
        map.panTo(coord, {
           'animation' : true,
           'duration': t
        }, spy);
        expect(spy.called).to.not.be.ok();
        setTimeout(function(){
           expect(spy.called).to.be.ok();
           done();
        }, 50);
    });

    it('panBy without animation', function (done) {
        map.setBearing(90);
        var offset = { x: 20, y: 0 };
        map.once('moveend', function () {
            expect(+map.getCenter().x.toFixed(6)).to.be.eql(center.x);
            expect(map.getCenter().y).not.to.be.eql(center.y);
            done();
        });
        map.panBy(offset, { 'animation' : false });
    });

    it('panBy with animation', function (done) {
        var offset = { x: 20, y: 20 };
        map.once('moveend', function () {
            expect(map.getCenter()).not.to.be.eql(center);
            done();
        });
        map.panBy(offset, { 'animation' : true });
    });

    it('panBy with callback', function (done) {
        var offset = { x: 20, y: 20 };
        var spy = sinon.spy();
        var t = 100;
        map.panBy(offset, { 'animation' : true, 'duration': t }, spy);
        expect(spy.called).to.not.be.ok();
        setTimeout(function(){
           expect(spy.called).to.be.ok();
           done();
        }, 50);
    });

    it('change zoom or center during panning', function (done) {
        var coord = center.substract(1, 1),
            newCenter = center.add(1, 1);
        map.once('moveend', function () {
            expect(map.getCenter()).to.be.closeTo(newCenter);
            done();
        });
        map.panTo(coord, { 'animation' : true });
        map.setCenterAndZoom(newCenter, map.getZoom() + 1);
    });
});
