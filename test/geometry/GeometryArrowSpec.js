describe('Geometry.Arrow', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;
    var context = {
        map: map,
        layer: layer
    };

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, { width: 1000, height: 500 });
        container = setups.container;
        map = setups.map;
        layer = new maptalks.VectorLayer('canvas');
        map.addLayer(layer);
        context.map = map;
        context.layer = layer;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('#1469 arrow first-last when has altitude', function (done) {
        map.setView({
            "center": [-0.113049, 51.503568], "zoom": 14, "pitch": 53.45000000000005, "bearing": -28.649999999999466
        })


        // 有高度 双箭头 不显示
        var line1 = new maptalks.LineString(
            [
                [-0.131049, 51.498568],
                [-0.107049, 51.498568],
                [-0.093049, 51.498568]
            ],
            {
                arrowStyle: "classic",
                arrowPlacement: "vertex-firstlast",
                symbol: {
                    lineColor: "#1bbc9b",
                    lineWidth: 10
                },
                properties: {
                    altitude: 500
                }
            }
        );
        layer.config({
            enableAltitude: true
        });
        line1.addTo(layer);

        setTimeout(() => {
            const { xmin, ymin, xmax, ymax } = line1.getContainerExtent();
            const size = map.getSize();
            const cx = size.width / 2, cy = size.height / 2;
            //left top
            const p1 = [xmin + 10 - cx, ymin + 1 - cy];
            //right bottom
            const p2 = [xmax - 10 - cx, ymax - 1 - cy];
            expect(layer).to.be.painted(p1[0], p1[1]);
            expect(layer).to.be.painted(p2[0], p2[1]);
            done();

        }, 500)
    });

    it('#2365 ArcCurve render error when arcDegree<0', function (done) {
        map.setView({
            "center": [-0.113049, 51.503568], "zoom": 14, "pitch": 53.45000000000005, "bearing": -28.649999999999466
        })


        // 有高度 双箭头 不显示
        var line1 = new maptalks.ArcCurve(
            [
                [-0.131049, 51.498568],
                [-0.107049, 51.498568],
                [-0.093049, 51.498568]
            ],
            {
                arcDegree: -30,
                arrowStyle: "classic",
                arrowPlacement: "vertex-firstlast",
                symbol: {
                    lineColor: "#1bbc9b",
                    lineWidth: 10
                },
                properties: {
                    // altitude: 500
                }
            }
        );
        layer.config({
            enableAltitude: true
        });
        line1.addTo(layer);

        setTimeout(() => {
            const { xmin, ymin, xmax, ymax } = line1.getContainerExtent();
            const size = map.getSize();
            const cx = size.width / 2, cy = size.height / 2;
            //left top
            const p1 = [xmin + 2 - cx, ymin - cy];
            //right bottom
            const p2 = [xmax - 2 - cx, ymax - cy];
            expect(layer).to.be.painted(p1[0], p1[1]);
            expect(layer).to.be.painted(p2[0], p2[1]);
            done();

        }, 500)
    });

});
