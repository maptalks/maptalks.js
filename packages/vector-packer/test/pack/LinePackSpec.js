describe('Line Pack specs', function () {

    let features;
    beforeEach(() => {
        features = [{ type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [500, 0], [550, 50]] }, properties: {} }];
    });

    it('pack data', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    lineWidth: 2,
                    lineOpacity: 0.6,
                    lineColor: '#f00'
                }
            }
        ]);
        const pack = new packer.LinePack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;

            expect(data.aPosition.length).to.be.eql(18);
            expect(data.aPosition).to.be.a(Int16Array);
            expect(data.aPosition).to.be.eql(new Int16Array([0, 0, 0, 0, 0, 0, 500, 0, 0, 500, 0, 0, 550, 50, 0, 550, 50, 0]));

            expect(data.aLinesofar.length).to.be.eql(6);
            expect(data.aLinesofar).to.a(Uint16Array);
            expect(data.aLinesofar).to.be.eql(new Uint16Array([0, 0, 500, 500, 570, 570]));

            expect(data.aNormal.length).to.be.eql(6);
            expect(data.aNormal).to.a(Uint8Array);
            expect(data.aNormal).to.be.eql(new Uint8Array([0, 1, 0, 1, 0, 1]));

            expect(data.aExtrude.length).to.be.eql(12);
            expect(data.aExtrude).to.a(Int8Array);
            expect(data.aExtrude).to.be.eql(new Int8Array([0, 63, 0, -63, -26, 63, 26, -63, -44, 44, 44, -44]));

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('round line join', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    lineWidth: 2,
                    lineOpacity: 0.6,
                    lineColor: '#f00',
                    lineJoin: 'round'
                }
            }
        ]);
        const pack = new packer.LinePack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;

            expect(data.aPosition.length).to.be.eql(27);
            expect(data.aPosition).to.be.a(Int16Array);

            expect(data.aLinesofar.length).to.be.eql(9);
            expect(data.aLinesofar).to.a(Uint16Array);

            expect(data.aNormal.length).to.be.eql(9);
            expect(data.aNormal).to.a(Uint8Array);

            expect(data.aExtrude.length).to.be.eql(18);
            expect(data.aExtrude).to.a(Int8Array);
            expect(data.aExtrude).to.be.eql(new Int8Array([0, 63, 0, -63, -26, 63, 0, -63, 24, -58, -26, 63, 44, -44, -44, 44, 44, -44]));

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('bevel line join', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    lineWidth: 2,
                    lineOpacity: 0.6,
                    lineColor: '#f00',
                    lineJoin: 'bevel'
                }
            }
        ]);
        const pack = new packer.LinePack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            const pack = result.data.packs[0];
            const data = result.data.packs[0].data;

            expect(data.aPosition.length).to.be.eql(24);
            expect(data.aPosition).to.be.a(Int16Array);

            expect(data.aLinesofar.length).to.be.eql(8);
            expect(data.aLinesofar).to.a(Uint16Array);

            expect(data.aNormal.length).to.be.eql(8);
            expect(data.aNormal).to.a(Uint8Array);

            expect(pack.indices.length).to.be.eql(18);

            expect(data.featureIndexes.length).to.be.eql(8);
            expect(data.featureIndexes).to.be.a(Uint16Array);
            //18 zeros
            expect(data.featureIndexes).to.be.eql(new Uint16Array(8));

            expect(data.aExtrude.length).to.be.eql(16);
            expect(data.aExtrude).to.a(Int8Array);
            expect(data.aExtrude).to.be.eql(new Int8Array([0, 63, 0, -63, -26, 63, 0, -63, -26, 63, 44, -44, -44, 44, 44, -44]));

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('round line cap', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    lineWidth: 2,
                    lineOpacity: 0.6,
                    lineColor: '#f00',
                    lineCap: 'round'
                }
            }
        ]);
        const pack = new packer.LinePack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;

            expect(data.aPosition.length).to.be.eql(30);
            expect(data.aPosition).to.be.a(Int16Array);

            expect(data.aLinesofar.length).to.be.eql(10);
            expect(data.aLinesofar).to.a(Uint16Array);

            expect(data.aNormal.length).to.be.eql(10);
            expect(data.aNormal).to.a(Uint8Array);

            expect(data.aExtrude.length).to.be.eql(20);
            expect(data.aExtrude).to.a(Int8Array);

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    it('square line cap', function (done) {
        const styles = maptalks.MapboxUtil.compileStyle([
            {
                'filter': true,
                'symbol': {
                    lineWidth: 2,
                    lineOpacity: 0.6,
                    lineColor: '#f00',
                    lineCap: 'square'
                }
            }
        ]);
        const pack = new packer.LinePack(features, styles, { minZoom: 1, maxZoom: 22, requestor: REQUESTOR });
        pack.load(1).then(result => {
            // const result = pack.pack(1);
            const data = result.data.packs[0].data;

            expect(data.aPosition.length).to.be.eql(18);
            expect(data.aPosition).to.be.a(Int16Array);

            expect(data.aLinesofar.length).to.be.eql(6);
            expect(data.aLinesofar).to.a(Uint16Array);

            expect(data.aNormal.length).to.be.eql(6);
            expect(data.aNormal).to.a(Uint8Array);

            expect(data.aExtrude.length).to.be.eql(12);
            expect(data.aExtrude).to.a(Int8Array);

            done();
        }).catch(err => {
            console.error(err);
            done(new Error(err));
        });
    });

    //不同的lineJoin
    //不同的lineCap
});
