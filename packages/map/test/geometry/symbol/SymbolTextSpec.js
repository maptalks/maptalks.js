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

    it('#2093 text symbol TextDesc rows when textName Is multi line text ', function () {
        function líneasNuevas(s) {
            return s.split('').join('\n').replace(/([\ud800-\udfff])\n([\ud800-\udfff])/g, '$1$2');
        }
        const textNames = ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳'].map(name => {
            return líneasNuevas(name + '行都司');
        });
        textNames.push('大家好');
        textNames.push('Hello\nWorld');
        const randomName = Math.ceil(Math.random() * 100000) + '';
        textNames.push(líneasNuevas(randomName));

        var v = new maptalks.VectorLayer('v', { 'drawImmediate': true }).addTo(map);
        textNames.forEach(textName => {
            v.clear();
            const lineRows = textName.split('\n');
            var geometry = new maptalks.Marker(center.copy(), {
                symbol: {
                    'textName': textName,
                    "textFaceName": "楷体",
                    "textSize": { "stops": [[8, 14], [20, 32]] },
                    "textFill": "#000",
                    "textOpacity": 1,
                    "textHaloFill": [1, 1, 1, 0.9],
                    "textHaloRadius": 1,
                    "textHorizontalAlignment": "middle",
                    "textVerticalAlignment": "middle"
                }
            });
            v.addGeometry(geometry);
            expect(geometry.getTextDesc().rows.length).to.be.eql(lineRows.length);
        });
    });
});
