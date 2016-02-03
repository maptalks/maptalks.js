// var CommonSpec = require('./CommonSpec');

describe('#ConnectorLineSpec', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var layer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
    });

    afterEach(function() {
        map.removeLayer(layer);
        document.body.removeChild(container);
    });

    describe('connect geometries', function() {
        it('can connect geometries with each other', function() {
            layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            var geometries = genAllTypeGeometries();
            layer.addGeometry(geometries);
            for (var i = 0; i < geometries.length; i++) {
                for (var ii = 0; ii < geometries.length; ii++) {
                    var conn = new maptalks.ConnectorLine(geometries[i],geometries[ii]);
                    layer.addGeometry(conn);
                    expect(conn.getConnectSource()).to.be.eql(geometries[i]);
                    expect(conn.getConnectTarget()).to.be.eql(geometries[ii]);
                }
            }
        });

        it('can connect geometries with panel', function() {
            var panel = new maptalks.control.Panel({
                position : {//放置panel的位置
                    top: '150',
                    left: '150'
                },
                draggable: true,//能否拖动
                custom: false, //content值能否为html
                content: '面板内容'
            });
            map.addControl(panel);
            layer = new Z.VectorLayer('id');
            map.addLayer(layer);
            var geometries = genAllTypeGeometries();
            layer.addGeometry(geometries);
            for (var i = 0; i < geometries.length; i++) {

                    var conn = new maptalks.ConnectorLine(geometries[i],panel);
                    layer.addGeometry(conn);
                    expect(conn.getConnectSource()).to.be.eql(geometries[i]);
                    expect(conn.getConnectTarget()).to.be.eql(panel);

            }
        });

    });


});
