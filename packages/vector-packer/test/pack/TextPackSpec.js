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
            const glyphImage = pack.glyphAtlas.image;
            expect(pack.iconAltlas).not.to.be.ok();
            expect(glyphImage.width).to.be.above(0);
            expect(glyphImage.height).to.be.above(0);
            expect(glyphImage.data.length).to.be.eql(glyphImage.width * glyphImage.height); //alpha map
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

            expect(data.aOffset.length).to.be(32);
            expect(data.aOffset[0]).to.be(10);
            expect(data.aOffset[1]).to.be(5);

            expect(data.aSize.length).to.be(32);
            expect(data.aSize.slice(0, 4)).to.be.eql([30, 30, 30, 30]);

            expect(result.glyphAtlas.image.data.length).to.be.above(0);
            expect(result.glyphAtlas.image.width).to.be(64);
            expect(result.glyphAtlas.image.height).to.be(32);
            expect(result.glyphAtlas.positions['30px monospace']).to.be.eql({
                '104': { rect: { x: 0, y: 0, w: 32, h: 32, id: 1 },
                    metrics: { width: 24, height: 24, left: 0, top: -8, advance: 24 }},
                '105': { rect: { x: 32, y: 0, w: 32, h: 32, id: 2 },
                    metrics: { width: 24, height: 24, left: 0, top: -8, advance: 24 }}});

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
            expect(data.aSize.length).to.be(32);
            expect(data.aSize[0]).to.be(5);
            expect(data.aSize[1]).to.be(200);
            expect(data.aSize[2]).to.be(5);
            expect(data.aSize[3]).to.be(200);

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
            expect(data.aShape.length).to.be(16);
            expect(data.aShape[0]).to.be(-1);
            expect(data.aShape[1]).to.be(-33);
            expect(data.aShape[2]).to.be(31);
            expect(data.aShape[3]).to.be(-33);
            expect(data.aShape[4]).to.be(-1);
            expect(data.aShape[5]).to.be(-1);
            expect(data.aShape[6]).to.be(31);
            expect(data.aShape[7]).to.be(-1);
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
            expect(data.aColor.length).to.be(24);
            expect(data.aColor[0]).to.be(17);
            expect(data.aColor[1]).to.be(34);
            expect(data.aColor[2]).to.be(51);
            expect(data.aColor[3]).to.be(17);
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
            expect(data.aRotation.length).to.be(8);
            expect(data.aRotation[0]).to.be(new Float32Array([60 * Math.PI / 180])[0]);
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
            expect(data.aOpacity.length).to.be(8);
            expect(data.aOpacity[0]).to.be(128);
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
            expect(data.aShape.length).to.be(48);
            expect(data.aShape[0]).to.be(-1);
            expect(data.aShape[1]).to.be(-28);
            expect(data.aShape[2]).to.be(31);

            expect(data.aTexCoord.length).to.be(48);
            expect(data.aTexCoord[0]).to.be(32);
            expect(data.aTexCoord[1]).to.be(64);
            expect(data.aTexCoord[2]).to.be(64);
            expect(data.aTexCoord[3]).to.be(64);

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });
});
