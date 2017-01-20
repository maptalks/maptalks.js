/*!
    Feature Filter by

    (c) mapbox 2016
    www.mapbox.com
    License: MIT, header required.
*/

describe('FeatureFilter', function () {
    var filter = maptalks.MapboxUtil.createFilter;
    it('degenerate', function () {
        expect(filter()()).to.be.ok();
        expect(filter(undefined)()).to.be.ok();
        expect(filter(null)()).to.be.ok();

    });

    it('==, string', function () {
        var f = filter(['==', 'foo', 'bar']);
        expect(f({ properties: { foo: 'bar' }})).to.be.ok();
        expect(f({ properties: { foo: 'baz' }})).not.to.be.ok();

    });

    it('==, number', function () {
        var f = filter(['==', 'foo', 0]);
        expect(f({ properties: { foo: 0 }})).to.be.ok();
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();
        expect(f({ properties: {}})).not.to.be.ok();

    });

    it('==, null', function () {
        var f = filter(['==', 'foo', null]);
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();
        expect(f({ properties: {}})).not.to.be.ok();

    });

    it('==, $type', function () {
        var f = filter(['==', '$type', 'LineString']);
        expect(f({ type: 1 })).not.to.be.ok();
        expect(f({ type: 2 })).to.be.ok();

    });

    it('!=, string', function () {
        var f = filter(['!=', 'foo', 'bar']);
        expect(f({ properties: { foo: 'bar' }})).not.to.be.ok();
        expect(f({ properties: { foo: 'baz' }})).to.be.ok();

    });

    it('!=, number', function () {
        var f = filter(['!=', 'foo', 0]);
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: 1 }})).to.be.ok();
        expect(f({ properties: { foo: '0' }})).to.be.ok();
        expect(f({ properties: { foo: true }})).to.be.ok();
        expect(f({ properties: { foo: false }})).to.be.ok();
        expect(f({ properties: { foo: null }})).to.be.ok();
        expect(f({ properties: { foo: undefined }})).to.be.ok();
        expect(f({ properties: {}})).to.be.ok();

    });

    it('!=, null', function () {
        var f = filter(['!=', 'foo', null]);
        expect(f({ properties: { foo: 0 }})).to.be.ok();
        expect(f({ properties: { foo: 1 }})).to.be.ok();
        expect(f({ properties: { foo: '0' }})).to.be.ok();
        expect(f({ properties: { foo: true }})).to.be.ok();
        expect(f({ properties: { foo: false }})).to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).to.be.ok();
        expect(f({ properties: {}})).to.be.ok();

    });

    it('!=, $type', function () {
        var f = filter(['!=', '$type', 'LineString']);
        expect(f({ type: 1 })).to.be.ok();
        expect(f({ type: 2 })).not.to.be.ok();

    });

    it('<, number', function () {
        var f = filter(['<', 'foo', 0]);
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: -1 }})).to.be.ok();
        expect(f({ properties: { foo: '1' }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: '-1' }})).not.to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();
        expect(f({ properties: {}})).not.to.be.ok();

    });

    it('<, string', function () {
        var f = filter(['<', 'foo', '0']);
        expect(f({ properties: { foo: -1 }})).not.to.be.ok();
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: '1' }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: '-1' }})).to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();

    });

    it('<=, number', function () {
        var f = filter(['<=', 'foo', 0]);
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: 0 }})).to.be.ok();
        expect(f({ properties: { foo: -1 }})).to.be.ok();
        expect(f({ properties: { foo: '1' }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: '-1' }})).not.to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();
        expect(f({ properties: {}})).not.to.be.ok();

    });

    it('<=, string', function () {
        var f = filter(['<=', 'foo', '0']);
        expect(f({ properties: { foo: -1 }})).not.to.be.ok();
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: '1' }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).to.be.ok();
        expect(f({ properties: { foo: '-1' }})).to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();

    });

    it('>, number', function () {
        var f = filter(['>', 'foo', 0]);
        expect(f({ properties: { foo: 1 }})).to.be.ok();
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: -1 }})).not.to.be.ok();
        expect(f({ properties: { foo: '1' }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: '-1' }})).not.to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();
        expect(f({ properties: {}})).not.to.be.ok();

    });

    it('>, string', function () {
        var f = filter(['>', 'foo', '0']);
        expect(f({ properties: { foo: -1 }})).not.to.be.ok();
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: '1' }})).to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: '-1' }})).not.to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();

    });

    it('>=, number', function () {
        var f = filter(['>=', 'foo', 0]);
        expect(f({ properties: { foo: 1 }})).to.be.ok();
        expect(f({ properties: { foo: 0 }})).to.be.ok();
        expect(f({ properties: { foo: -1 }})).not.to.be.ok();
        expect(f({ properties: { foo: '1' }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: '-1' }})).not.to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();
        expect(f({ properties: {}})).not.to.be.ok();

    });

    it('>=, string', function () {
        var f = filter(['>=', 'foo', '0']);
        expect(f({ properties: { foo: -1 }})).not.to.be.ok();
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: '1' }})).to.be.ok();
        expect(f({ properties: { foo: '0' }})).to.be.ok();
        expect(f({ properties: { foo: '-1' }})).not.to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();

    });

    it('in, degenerate', function () {
        var f = filter(['in', 'foo']);
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();

    });

    it('in, string', function () {
        var f = filter(['in', 'foo', '0']);
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();
        expect(f({ properties: {}})).not.to.be.ok();

    });

    it('in, number', function () {
        var f = filter(['in', 'foo', 0]);
        expect(f({ properties: { foo: 0 }})).to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();

    });

    it('in, null', function () {
        var f = filter(['in', 'foo', null]);
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: true }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();

    });

    it('in, multiple', function () {
        var f = filter(['in', 'foo', 0, 1]);
        expect(f({ properties: { foo: 0 }})).to.be.ok();
        expect(f({ properties: { foo: 1 }})).to.be.ok();
        expect(f({ properties: { foo: 3 }})).not.to.be.ok();

    });

    it('in, large_multiple', function () {
        var f = filter(['in', 'foo'].concat(Array.apply(null, { length: 2000 }).map(Number.call, Number)));
        expect(f({ properties: { foo: 0 }})).to.be.ok();
        expect(f({ properties: { foo: 1 }})).to.be.ok();
        expect(f({ properties: { foo: 1999 }})).to.be.ok();
        expect(f({ properties: { foo: 2000 }})).not.to.be.ok();

    });

    it('in, $type', function () {
        var f = filter(['in', '$type', 'LineString', 'Polygon']);
        expect(f({ type: 1 })).not.to.be.ok();
        expect(f({ type: 2 })).to.be.ok();
        expect(f({ type: 3 })).to.be.ok();

        var f1 = filter(['in', '$type', 'Polygon', 'LineString', 'Point']);
        expect(f1({ type: 1 })).to.be.ok();
        expect(f1({ type: 2 })).to.be.ok();
        expect(f1({ type: 3 })).to.be.ok();


    });

    it('!in, degenerate', function () {
        var f = filter(['!in', 'foo']);
        expect(f({ properties: { foo: 1 }})).to.be.ok();

    });

    it('!in, string', function () {
        var f = filter(['!in', 'foo', '0']);
        expect(f({ properties: { foo: 0 }})).to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).to.be.ok();
        expect(f({ properties: { foo: undefined }})).to.be.ok();
        expect(f({ properties: {}})).to.be.ok();

    });

    it('!in, number', function () {
        var f = filter(['!in', 'foo', 0]);
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).to.be.ok();
        expect(f({ properties: { foo: null }})).to.be.ok();
        expect(f({ properties: { foo: undefined }})).to.be.ok();

    });

    it('!in, null', function () {
        var f = filter(['!in', 'foo', null]);
        expect(f({ properties: { foo: 0 }})).to.be.ok();
        expect(f({ properties: { foo: '0' }})).to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).to.be.ok();

    });

    it('!in, multiple', function () {
        var f = filter(['!in', 'foo', 0, 1]);
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: 3 }})).to.be.ok();

    });

    it('!in, large_multiple', function () {
        var f = filter(['!in', 'foo'].concat(Array.apply(null, { length: 2000 }).map(Number.call, Number)));
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: 1999 }})).not.to.be.ok();
        expect(f({ properties: { foo: 2000 }})).to.be.ok();

    });

    it('!in, $type', function () {
        var f = filter(['!in', '$type', 'LineString', 'Polygon']);
        expect(f({ type: 1 })).to.be.ok();
        expect(f({ type: 2 })).not.to.be.ok();
        expect(f({ type: 3 })).not.to.be.ok();

    });

    it('any', function () {
        var f1 = filter(['any']);
        expect(f1({ properties: { foo: 1 }})).not.to.be.ok();

        var f2 = filter(['any', ['==', 'foo', 1]]);
        expect(f2({ properties: { foo: 1 }})).to.be.ok();

        var f3 = filter(['any', ['==', 'foo', 0]]);
        expect(f3({ properties: { foo: 1 }})).not.to.be.ok();

        var f4 = filter(['any', ['==', 'foo', 0], ['==', 'foo', 1]]);
        expect(f4({ properties: { foo: 1 }})).to.be.ok();


    });

    it('all', function () {
        var f1 = filter(['all']);
        expect(f1({ properties: { foo: 1 }})).to.be.ok();

        var f2 = filter(['all', ['==', 'foo', 1]]);
        expect(f2({ properties: { foo: 1 }})).to.be.ok();

        var f3 = filter(['all', ['==', 'foo', 0]]);
        expect(f3({ properties: { foo: 1 }})).not.to.be.ok();

        var f4 = filter(['all', ['==', 'foo', 0], ['==', 'foo', 1]]);
        expect(f4({ properties: { foo: 1 }})).not.to.be.ok();


    });

    it('none', function () {
        var f1 = filter(['none']);
        expect(f1({ properties: { foo: 1 }})).to.be.ok();

        var f2 = filter(['none', ['==', 'foo', 1]]);
        expect(f2({ properties: { foo: 1 }})).not.to.be.ok();

        var f3 = filter(['none', ['==', 'foo', 0]]);
        expect(f3({ properties: { foo: 1 }})).to.be.ok();

        var f4 = filter(['none', ['==', 'foo', 0], ['==', 'foo', 1]]);
        expect(f4({ properties: { foo: 1 }})).not.to.be.ok();


    });

    it('has', function () {
        var f = filter(['has', 'foo']);
        expect(f({ properties: { foo: 0 }})).to.be.ok();
        expect(f({ properties: { foo: 1 }})).to.be.ok();
        expect(f({ properties: { foo: '0' }})).to.be.ok();
        expect(f({ properties: { foo: true }})).to.be.ok();
        expect(f({ properties: { foo: false }})).to.be.ok();
        expect(f({ properties: { foo: null }})).to.be.ok();
        expect(f({ properties: { foo: undefined }})).to.be.ok();
        expect(f({ properties: {}})).not.to.be.ok();

    });

    it('!has', function () {
        var f = filter(['!has', 'foo']);
        expect(f({ properties: { foo: 0 }})).not.to.be.ok();
        expect(f({ properties: { foo: 1 }})).not.to.be.ok();
        expect(f({ properties: { foo: '0' }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: false }})).not.to.be.ok();
        expect(f({ properties: { foo: null }})).not.to.be.ok();
        expect(f({ properties: { foo: undefined }})).not.to.be.ok();
        expect(f({ properties: {}})).to.be.ok();

    });

    it('==, $id', function () {
        var f = filter(['==', '$id', 1]);
        expect(f({ id: 1 })).to.be.ok();
        expect(f({ id: 2 })).not.to.be.ok();

    });

    it('==, $subType', function () {
        var f = filter(['==', '$subType', 'Label']);
        expect(f({ subType: 'Label' })).to.be.ok();
        expect(f({ subType: 'Circle' })).not.to.be.ok();

    });
});
