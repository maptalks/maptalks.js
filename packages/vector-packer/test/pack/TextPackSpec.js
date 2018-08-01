describe('Point Pack of texts specs', function () {
    let features;
    beforeEach(() => {
        features = [{ type : 'Feature', geometry : { type : 'Point', coordinates : [0, 0] }, properties : {}}];
    });

    it('load atlas and layout', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    textName : 'hihi',
                    textSize : 30
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

    it('textSize, textDx and textDy', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    textName : 'hihi',
                    textSize : 30,
                    textDx : 10,
                    textDy : 5
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;
            expect(data.a_offset.length).to.be(32);
            expect(data.a_offset[0]).to.be(10);
            expect(data.a_offset[1]).to.be(5);

            expect(data.a_size.length).to.be(64);
            expect(data.a_size[0]).to.be(30);
            expect(data.a_size[1]).to.be(30);
            expect(data.a_size[2]).to.be(30);
            expect(data.a_size[3]).to.be(30);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('dynamic textSize', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': maptalks.MapboxUtil.loadFunctionTypes({
                    textName : 'hihi',
                    textSize : { stops: [[7, 5], [14, 200]] }
                }, () => {

                })
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;
            expect(data.a_size.length).to.be(64);
            expect(data.a_size[0]).to.be(5);
            expect(data.a_size[1]).to.be(5);
            expect(data.a_size[2]).to.be(200);
            expect(data.a_size[3]).to.be(200);

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('textHorizontalAlignment, textVerticalAlignment', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    textName : 'hi',
                    textSize : 40,
                    textHorizontalAlignment : 'left',
                    textVerticalAlignment : 'bottom',
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;
            expect(data.a_shape.length).to.be(16);
            expect(data.a_shape[0]).to.be(-4);
            expect(data.a_shape[1]).to.be(-33);
            expect(data.a_shape[2]).to.be(-4);
            expect(data.a_shape[3]).to.be(-1);
            expect(data.a_shape[4]).to.be(28);
            expect(data.a_shape[5]).to.be(-33);
            expect(data.a_shape[6]).to.be(28);
            expect(data.a_shape[7]).to.be(-1);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('textHorizontalAlignment, textVerticalAlignment', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    textName : 'hi',
                    textSize : 40,
                    textFill : '#123'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;
            expect(data.a_color.length).to.be(24);
            expect(data.a_color[0]).to.be(17);
            expect(data.a_color[1]).to.be(34);
            expect(data.a_color[2]).to.be(51);
            expect(data.a_color[3]).to.be(17);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('textRotation', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    textName : 'hi',
                    textSize : 40,
                    textHorizontalAlignment : 'left',
                    textVerticalAlignment : 'bottom',
                    textRotation : 60
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;
            expect(data.a_rotation.length).to.be(8);
            expect(data.a_rotation[0]).to.be(new Float32Array([60 * Math.PI / 180])[0]);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('textOpacity', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    textName : 'hi',
                    textSize : 40,
                    textHorizontalAlignment : 'left',
                    textVerticalAlignment : 'bottom',
                    textOpacity : 0.5
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);
            const data = result.packs[0].data;
            expect(data.a_opacity.length).to.be(8);
            expect(data.a_opacity[0]).to.be(128);
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('textOpacity', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    textName : '中yin混合',
                    textSize : 30,
                    textHorizontalAlignment : 'left',
                    textVerticalAlignment : 'bottom'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
        pack.load().then(() => {
            const result = pack.pack(1);

            const data = result.packs[0].data;
            expect(data.a_shape.length).to.be(48);
            expect(data.a_shape[0]).to.be(-4);
            expect(data.a_shape[1]).to.be(-28);
            expect(data.a_shape[2]).to.be(-4);

            expect(data.a_texcoord.length).to.be(48);
            expect(data.a_texcoord[0]).to.be(32);
            expect(data.a_texcoord[1]).to.be(32);
            expect(data.a_texcoord[2]).to.be(32);
            expect(data.a_texcoord[3]).to.be(64);

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });
});
