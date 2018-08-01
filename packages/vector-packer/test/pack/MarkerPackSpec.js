describe('Point Pack of markers specs', function () {
    let features;
    beforeEach(() => {
        features = [{ type : 'Feature', geometry : { type : 'Point', coordinates : [0, 0] }, properties : {}}];
    });

    it('load atlas and layout', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile : 'resources/plane-min.png',
                    markerWidth : 30,
                    markerHeight : 30
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const iconImage = pack.iconAtlas.image,
                glyphImage = pack.glyphAtlas.image;
            expect(iconImage.width).to.be.above(0);
            expect(iconImage.height).to.be.above(0);
            expect(iconImage.data.length).to.be.above(0);
            expect(glyphImage.width).to.be.above(0);
            expect(glyphImage.height).to.be.above(0);
            expect(glyphImage.data.length).to.be.above(0);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('markerWidth, markerHeight, markerDx and markerDy', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile : 'resources/plane-min.png',
                    markerWidth : 40,
                    markerHeight : 30,
                    markerDx : 10,
                    markerDy : 5
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;

            expect(data.a_anchor).to.be.a(Int8Array);

            expect(data.a_offset.length).to.be(8);
            expect(data.a_offset[0]).to.be(10);
            expect(data.a_offset[1]).to.be(5);

            expect(data.a_size.length).to.be(16);
            expect(data.a_size[0]).to.be(40);
            expect(data.a_size[1]).to.be(30);
            expect(data.a_size[2]).to.be(40);
            expect(data.a_size[3]).to.be(30);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('dynamic markerWidth, markerHeight', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': maptalks.MapboxUtil.loadFunctionTypes({
                    markerFile : 'resources/plane-min.png',
                    'markerWidth'  : { stops: [[7, 5], [14, 200]] },
                    'markerHeight' : { stops: [[7, 5], [14, 200]] },
                }, () => {

                })
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;
            expect(data.a_offset.length).to.be(8);
            expect(data.a_offset[0]).to.be(0);
            expect(data.a_offset[1]).to.be(0);

            expect(data.a_size.length).to.be(16);
            expect(data.a_size[0]).to.be(5);
            expect(data.a_size[1]).to.be(5);
            expect(data.a_size[2]).to.be(200);
            expect(data.a_size[3]).to.be(200);

            expect(data.a_shape.length).to.be(8);
            expect(data.a_shape[0]).to.be(-16);
            expect(data.a_shape[1]).to.be(-16);
            expect(data.a_shape[2]).to.be(-16);
            expect(data.a_shape[3]).to.be(16);
            expect(data.a_shape[4]).to.be(16);
            expect(data.a_shape[5]).to.be(-16);
            expect(data.a_shape[6]).to.be(16);
            expect(data.a_shape[7]).to.be(16);

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('markerHorizontalAlignment, markerVerticalAlignment', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile : 'resources/plane-min.png',
                    markerWidth : 400,
                    markerHeight : 300,
                    markerHorizontalAlignment : 'left',
                    markerVerticalAlignment : 'bottom',
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;
            expect(data.a_shape.length).to.be(8);
            expect(data.a_shape[0]).to.be(-1);
            expect(data.a_shape[1]).to.be(-31);
            expect(data.a_shape[2]).to.be(-1);
            expect(data.a_shape[3]).to.be(1);
            expect(data.a_shape[4]).to.be(31);
            expect(data.a_shape[5]).to.be(-31);
            expect(data.a_shape[6]).to.be(31);
            expect(data.a_shape[7]).to.be(1);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('markerRotation', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile : 'resources/plane-min.png',
                    markerWidth : 400,
                    markerHeight : 300,
                    markerHorizontalAlignment : 'left',
                    markerVerticalAlignment : 'bottom',
                    markerRotation : 60
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;
            expect(data.a_rotation.length).to.be(4);
            expect(data.a_rotation[0]).to.be(new Float32Array([60 * Math.PI / 180])[0]);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('markerOpacity', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile : 'resources/plane-min.png',
                    markerWidth : 400,
                    markerHeight : 300,
                    markerHorizontalAlignment : 'left',
                    markerVerticalAlignment : 'bottom',
                    markerOpacity : 0.5
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;
            expect(data.a_opacity.length).to.be(4);
            expect(data.a_opacity[0]).to.be(128);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    //TODO 6. vector 类型的 marker
});
