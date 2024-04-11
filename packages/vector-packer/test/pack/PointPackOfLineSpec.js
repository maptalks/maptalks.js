describe('Point Pack of Line specs', function () {

    let features;
    beforeEach(() => {
        features = [{ type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [500, 0]] }, properties: {} }];
    });

    it('anchors', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile: 'resources/plane-min.png',
                    markerWidth: 30,
                    markerHeight: 30,
                    markerPlacement: 'line'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const anchors = result.data.packs[0].data.aPosition;
            expect(anchors.length).to.be(24);
            expect(anchors).to.be.eql(new Int16Array([125, 0, 0, 125, 0, 0, 125, 0, 0, 125, 0, 0, 375, 0, 0, 375, 0, 0, 375, 0, 0, 375, 0, 0]));
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
                    markerFile: 'resources/plane-min.png',
                    markerWidth: 30,
                    markerHeight: 30,
                    markerPlacement: 'line'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR, EXTENT: 256 });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const anchors = result.data.packs[0].data.aPosition;
            expect(anchors).to.be.eql(new Int8Array([125, 0, 0, 125, 0, 0, 125, 0, 0, 125, 0, 0]));
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
                    markerFile: 'resources/plane-min.png',
                    markerWidth: 30,
                    markerHeight: 30,
                    markerPlacement: 'line'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR, EXTENT: 100 });
        pack.load(0.5).then(result => {
            // const result = pack.pack(0.5);
            const anchors = result.data.packs[0].data.aPosition;
            expect(anchors).to.be.eql(new Int8Array([63, 0, 0, 63, 0, 0, 63, 0, 0, 63, 0, 0]));
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('no anchors at big angle', function (done) {
        features = [{ type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [121, 0], [121, 30]] }, properties: {} }];
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile: 'resources/plane-min.png',
                    markerWidth: 30,
                    markerHeight: 30,
                    markerPlacement: 'line'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR, EXTENT: 8192 });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const anchors = result.data.packs[0].data.aPosition;
            expect(anchors.length).to.be(0);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });
});
