describe('morph', () => {
    let map;
    beforeEach(function() {
        map = createMap();
    });

    afterEach(function() {
        removeMap(map);
    });

    // TODO,增加矩阵判断
    it('add gltf marker with morph', (done) => {
        const layer = new maptalks.GLTFLayer('layer').addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url2,
                animation: true,
                loop: true
            }
        }).addTo(layer);
        marker.on('load', () => {
            setTimeout(function() {
                const testMatrix0 = marker.getMeshes(null, null, 0)[0].localTransform;
                expect(testMatrix0).to.be.eql([1.037137862851273, 0, 0, 0, 0, 1.037137862851273, -6.35063782007669e-17, 0, 0, 6.35063782007669e-17, 1.037137862851273, 0, -0.025904590914820433, 9.272735074228322e-8, 3.6143824336558785e-17, 1]);
                const testMatrix1 = marker.getMeshes(null, null, 250)[0].localTransform;
                expect(testMatrix1).to.be.eql([1.037137862851273, 0, 0, 0, 0, 1.037137862851273, -6.35063782007669e-17, 0, 0, 6.35063782007669e-17, 1.037137862851273, 0, -0.025904590914820433, 9.272735074228322e-8, 3.6143824336558785e-17, 1]);
                const testMatrix2 = marker.getMeshes(null, null, 500)[0].localTransform;
                expect(testMatrix2).to.be.eql([1.037137862851273, 0, 0, 0, 0, 1.037137862851273, -6.35063782007669e-17, 0, 0, 6.35063782007669e-17, 1.037137862851273, 0, -0.025904590914820433, 9.272735074228322e-8, 3.6143824336558785e-17, 1]);
                const testMatrix3 = marker.getMeshes(null, null, 750)[0].localTransform;
                expect(testMatrix3).to.be.eql([1.037137862851273, 0, 0, 0, 0, 1.037137862851273, -6.35063782007669e-17, 0, 0, 6.35063782007669e-17, 1.037137862851273, 0, -0.025904590914820433, 9.272735074228322e-8, 3.6143824336558785e-17, 1]);
                done();
            }, 100);
        })
    });

    it('change shader for gltfmarker which has morph animations(fuzhenn/maptalks-studio#2242)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url10,
                animation: true,
                loop: true
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            marker.setShader('phong');
            marker.setUniform('materialShininess', 32);
            done();
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });
});
