describe('Point Pack of markers specs', function () {
    let features;
    beforeEach(() => {
        features = [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }];
    });

    it('load atlas and layout', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    markerFile: 'resources/plane-min.png',
                    markerWidth: 30,
                    markerHeight: 30
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(() => {
            const iconImage = pack.iconAtlas.image;
            expect(iconImage.width).to.be.above(0);
            expect(iconImage.height).to.be.above(0);
            expect(iconImage.data.length).to.be.eql(iconImage.width * iconImage.height * 4);
            expect(pack.glyphAtlas).not.to.be.ok();
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
                    markerFile: 'resources/plane-min.png',
                    markerWidth: 40,
                    markerHeight: 30,
                    markerDx: 10,
                    markerDy: 5
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const p = result.data.packs[0];
            const data = p.data;

            expect(data.aPosition).to.be.a(Int8Array);

            expect(data.aDxDy.length).to.be(8);
            expect(data.aDxDy[0]).to.be(10);
            expect(data.aDxDy[1]).to.be(5);

            expect(data.aSize.length).to.be(8);
            expect(data.aSize[0]).to.be(40);
            expect(data.aSize[1]).to.be(30);
            expect(data.aSize[2]).to.be(40);
            expect(data.aSize[3]).to.be(30);

            expect(p.indices.length).to.be(6);
            // expect(p.segments).to.be.eql([{ offset : 0, count : 6 }]);

            expect(result.data.iconAtlas.image.data.length).to.be.eql(4096);
            expect(result.data.iconAtlas.image.width).to.be(32);
            expect(result.data.iconAtlas.image.height).to.be(32);
            expect(result.data.iconAtlas.positions['resources/plane-min.png']).to.be.eql({ tl: [1, 1], br: [31, 31], displaySize: [30, 30] });

            expect(result.buffers[result.buffers.length - 1].byteLength).to.be(4096); //32 * 32 * 4

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
                    markerFile: 'resources/plane-min.png',
                    'markerWidth': { stops: [[7, 5], [14, 200]] },
                    'markerHeight': { stops: [[7, 5], [14, 200]] },
                }, () => {

                })
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;
            expect(data.aDxDy.length).to.be(8);
            expect(data.aDxDy[0]).to.be(0);
            expect(data.aDxDy[1]).to.be(0);

            expect(data.aSize.length).to.be(8);
            expect(data.aSize.slice(0, 4)).to.be.eql([200, 200, 200, 200]);

            expect(data.aShape).to.be.eql([-16, -16, 16, -16, -16, 16, 16, 16]);

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
                    markerFile: 'resources/plane-min.png',
                    markerWidth: 400,
                    markerHeight: 300,
                    markerHorizontalAlignment: 'left',
                    markerVerticalAlignment: 'bottom',
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            const data = result.data.packs[0].data;
            expect(data.aShape.length).to.be(8);
            expect(data.aShape).to.be.eql([-1, -31, 31, -31, -1, 1, 31, 1]);
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
                    markerFile: 'resources/plane-min.png',
                    markerWidth: 400,
                    markerHeight: 300,
                    markerHorizontalAlignment: 'left',
                    markerVerticalAlignment: 'bottom',
                    markerRotation: 60
                }
            }
        ]);
        const pack = new packer.PointPack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;
            expect(data.aRotation.length).to.be(4);
            expect(data.aRotation).to.be.eql(new Int16Array([60, 60, 60, 60]));
            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    //markerOpacity不再保存在attribute中，而是用uniform设置
    // it('markerOpacity', function (done) {
    //     const styles = maptalks.MapboxUtil.compileStyle([
    //         {
    //             'filter': true,
    //             'symbol': {
    //                 markerFile : 'resources/plane-min.png',
    //                 markerWidth : 400,
    //                 markerHeight : 300,
    //                 markerHorizontalAlignment : 'left',
    //                 markerVerticalAlignment : 'bottom',
    //                 markerOpacity : 0.5
    //             }
    //         }
    //     ]);
    //     const pack = new packer.PointPack(features, styles, { minZoom : 1, maxZoom : 22, requestor : REQUESTOR });
    //     pack.load(1).then(result => {
    //         // const result = pack.pack(1);
    //         const data = result.data.packs[0].data;
    //         expect(data.aOpacity.length).to.be(4);
    //         expect(data.aOpacity[0]).to.be(128);
    //         done();
    //     }).catch(err => {
    //         console.error(err);
    //         done(new Error(err));
    //     });
    // });

    //TODO 6. vector 类型的 marker
});
