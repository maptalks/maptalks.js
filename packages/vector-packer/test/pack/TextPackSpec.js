describe('Point Pack of texts specs', function () {
    let features;
    beforeEach(() => {
        features = [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }];
    });

    it('load atlas and layout', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    textName: 'hihi',
                    textSize: 30
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(() => {
            const glyphImage = pack.glyphAtlas.image;
            expect(pack.iconAltlas).not.to.be.ok();
            expect(glyphImage.width).to.be.eql(64);
            expect(glyphImage.height).to.be.eql(32);
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
                    textName: 'hihi',
                    textSize: 30,
                    textDx: 10,
                    textDy: 5
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;

            expect(data.aDxDy.length).to.be(32);
            expect(data.aDxDy[0]).to.be(10);
            expect(data.aDxDy[1]).to.be(5);

            expect(data.aSize.length).to.be(16);
            expect(data.aSize.slice(0, 4)).to.be.eql([30, 30, 30, 30]);

            expect(result.data.glyphAtlas.image.data.length).to.be.above(0);
            expect(result.data.glyphAtlas.image.width).to.be(64);
            expect(result.data.glyphAtlas.image.height).to.be(32);
            expect(result.data.glyphAtlas.positions['normal normal 30px  monospace']).to.be.eql({
                '104': { rect: { x: 0, y: 0, w: 32, h: 32, id: 1 },
                    metrics: { width: 24, height: 24, left: 0, top: -8, advance: 26 } },
                '105': { rect: { x: 32, y: 0, w: 32, h: 32, id: 2 },
                    metrics: { width: 24, height: 24, left: 0, top: -8, advance: 26 } } });

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
                    textName: 'hihi',
                    textSize: { stops: [[7, 5], [14, 200]] }
                }, () => {

                })
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;
            expect(data.aSize.length).to.be(16);
            expect(data.aSize[0]).to.be(200);
            expect(data.aSize[1]).to.be(200);
            expect(data.aSize[2]).to.be(200);
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
                    textName: 'hi',
                    textSize: 40,
                    textHorizontalAlignment: 'left',
                    textVerticalAlignment: 'bottom',
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;
            expect(data.aShape0.length).to.be(16);
            expect(data.aShape0).to.be.eql(new Int16Array([-4, -27, 28, -27, -4, 4, 28, 4, 22, -27, 54, -27, 22, 4, 54, 4]));
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
                    textName: 'hi',
                    textSize: 40,
                    textFill: '#123'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;
            expect(data.aColor.length).to.be(24);
            expect(data.aColor).to.be.eql(new Uint8Array([17, 34, 51, 17, 34, 51, 17, 34, 51, 17, 34, 51, 17, 34, 51, 17, 34, 51, 17, 34, 51, 17, 34, 51]));
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
                    textName: 'hi',
                    textSize: 40,
                    textHorizontalAlignment: 'left',
                    textVerticalAlignment: 'bottom',
                    textRotation: 60
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;
            expect(data.aRotation.length).to.be(8);
            expect(data.aRotation).to.be.eql(new Int16Array([60, 60, 60, 60, 60, 60, 60, 60]));
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    // it('textOpacity', function (done) {
    //     const styles = maptalks.MapboxUtil.compileStyle([
    //         {
    //             'filter': true,
    //             'symbol': {
    //                 textName : 'hi',
    //                 textSize : 40,
    //                 textHorizontalAlignment : 'left',
    //                 textVerticalAlignment : 'bottom',
    //                 textOpacity : 0.5
    //             }
    //         }
    //     ]);
    //     const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
    //     pack.load(1).then(result => {
    //         // const result = pack.pack(1);
    //         const data = result.data.packs[0].data;
    //         expect(data.aOpacity.length).to.be(8);
    //         expect(data.aOpacity[0]).to.be(128);
    //         done();
    //     }).catch(err => {
    //         console.error(err);
    //         done(new Error(err));
    //     });
    // });

    it('english mixed with chinese', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    textName: '中yin混合',
                    textSize: 30,
                    textHorizontalAlignment: 'left',
                    textVerticalAlignment: 'bottom'
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);

            const data = result.data.packs[0].data;
            expect(data.aShape0.length).to.be(48);
            expect(data.aShape0).to.be.eql(new Int16Array([-4, -27, 28, -27, -4, 4, 28, 4, 22, -27, 54, -27, 22, 4, 54, 4, 48, -27, 80, -27, 48, 4, 80, 4, 74, -27, 106, -27, 74, 4, 106, 4, 100, -27, 132, -27, 100, 4, 132, 4, 126, -27, 158, -27, 126, 4, 158, 4]));

            expect(data.aTexCoord0.length).to.be(48);
            expect(data.aTexCoord0).to.be.eql(new Uint16Array([32, 64, 64, 64, 32, 32, 64, 32, 0, 64, 32, 64, 0, 32, 32, 32, 0, 32, 32, 32, 0, 0, 32, 0, 32, 32, 64, 32, 32, 0, 64, 0, 96, 32, 128, 32, 96, 0, 128, 0, 64, 32, 96, 32, 64, 0, 96, 0]));

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });
});
