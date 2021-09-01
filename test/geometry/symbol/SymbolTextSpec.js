describe('SymbolTextSpec', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var textSize = 33;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center);
        container = setups.container;
        map = setups.map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });
    it('text symbol ', function () {
        var geometry = new maptalks.Marker(center, {
            symbol: {
                textName: '■■■',
                textSize: textSize
            }
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        expect(v).to.be.painted(2, 0);
    });

    it('text symbol TextDesc ', function () {
        var geometry = new maptalks.Marker(center, {
            symbol: {
                textName: 'maptalks',
                textSize: textSize
            }
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        // expect(geometry.getTextDesc().size.width).to.be.eql(132);
        expect(geometry.getTextDesc().size.height).to.be.eql(textSize);
    });
    it('text symbol TextDesc when textName is null ', function () {
        var geometry = new maptalks.Marker(center, {
            symbol: {
                textName: null,
                textSize: textSize
            }
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        expect(geometry.getTextDesc().size.width).to.be.eql(0);
        expect(geometry.getTextDesc().size.height).to.be.eql(textSize);
    });
    it('text symbol TextDesc when textName is "" ', function () {
        var geometry = new maptalks.Marker(center, {
            symbol: {
                textName: '',
                textSize: textSize
            }
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        expect(geometry.getTextDesc().size.width).to.be.eql(0);
        expect(geometry.getTextDesc().size.height).to.be.eql(textSize);
    });
    it('text symbol TextDesc when textName is 0 ', function () {
        var geometry = new maptalks.Marker(center, {
            symbol: {
                textName: 0,
                textSize: textSize
            }
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        // expect(geometry.getTextDesc().size.width).to.be.eql(0);
        expect(geometry.getTextDesc().size.height).to.be.eql(textSize);
    });
    it('text symbol TextDesc when textName is number ', function () {
        var geometry = new maptalks.Marker(center, {
            symbol: {
                textName: 1,
                textSize: textSize
            }
        });
        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        v.addGeometry(geometry);
        // expect(geometry.getTextDesc().size.width).to.be.eql(0);
        expect(geometry.getTextDesc().size.height).to.be.eql(textSize);
    });
});
