describe('Line Pack specs', function () {

    let features;
    beforeEach(() => {
        features = [{ type : 'Feature', geometry : { type : 'LineString', coordinates : [[0, 0], [500, 0]] }, properties : {}}];
    });

    it('anchors', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile : 'resources/plane-min.png',
                    markerWidth : 30,
                    markerHeight : 30,
                    markerPlacement : 'line'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.performLayout(1);
            const anchors = result.packs[0].a_anchor;
            expect(anchors.length).to.be(72);
            expect(anchors[0]).to.be(40);
            expect(anchors[1]).to.be(0);
            expect(anchors[12]).to.be(120);
            expect(anchors[13]).to.be(0);
            expect(anchors[24]).to.be(200);
            expect(anchors[25]).to.be(0);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('anchors with extent', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile : 'resources/plane-min.png',
                    markerWidth : 30,
                    markerHeight : 30,
                    markerPlacement : 'line'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR, EXTENT : 100 });
        pack.load().then(() => {
            const result = pack.performLayout(1);
            const anchors = result.packs[0].a_anchor;
            expect(anchors.length).to.be(12);
            expect(anchors[0]).to.be(40);
            expect(anchors[1]).to.be(0);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('anchors with zoomscale of 0.5', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile : 'resources/plane-min.png',
                    markerWidth : 30,
                    markerHeight : 30,
                    markerPlacement : 'line'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR, EXTENT : 100 });
        pack.load().then(() => {
            const result = pack.performLayout(0.5);
            const anchors = result.packs[0].a_anchor;
            expect(anchors.length).to.be(24);
            expect(anchors[0]).to.be(20);
            expect(anchors[1]).to.be(0);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('no anchors at big angle', function (done) {
        features = [{ type : 'Feature', geometry : { type : 'LineString', coordinates : [[0, 0], [121, 0], [121, 30]] }, properties : {}}];
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile : 'resources/plane-min.png',
                    markerWidth : 30,
                    markerHeight : 30,
                    markerPlacement : 'line'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR, EXTENT : 200 });
        pack.load().then(() => {
            const result = pack.performLayout(1);
            const anchors = result.packs[0].a_anchor;
            expect(anchors.length).to.be(12);
            expect(anchors[0]).to.be(40);
            expect(anchors[1]).to.be(0);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });
});
