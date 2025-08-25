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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80,
                url: url2,
                animation: true,
                loop: true
            }
        }).addTo(layer);
        marker.on('load', () => {
            setTimeout(function() {
                const testMatrix0 = marker.getMeshes(null, null, 0)[0].localTransform;
                expect(testMatrix0).to.be.eql([1.0466131638156042, 0, 0, 0, 0, 1.046613163724577, -8.366018023231138e-17, 0, 0, 6.40865730450394e-17, 1.366274427705341, 0, 0, 0, 0.1707822812928094, 1]);
                const testMatrix1 = marker.getMeshes(null, null, 250)[0].localTransform;
                expect(testMatrix1).to.be.eql([1.0466131638156042, 0, 0, 0, 0, 1.046613163724577, -8.366018023231138e-17, 0, 0, 6.40865730450394e-17, 1.366274427705341, 0, 0, 0, 0.1707822812928094, 1]);
                const testMatrix2 = marker.getMeshes(null, null, 500)[0].localTransform;
                expect(testMatrix2).to.be.eql([1.0466131638156042, 0, 0, 0, 0, 1.046613163724577, -8.366018023231138e-17, 0, 0, 6.40865730450394e-17, 1.366274427705341, 0, 0, 0, 0.1707822812928094, 1]);
                const testMatrix3 = marker.getMeshes(null, null, 750)[0].localTransform;
                expect(testMatrix3).to.be.eql([1.0466131638156042, 0, 0, 0, 0, 1.046613163724577, -8.366018023231138e-17, 0, 0, 6.40865730450394e-17, 1.366274427705341, 0, 0, 0, 0.1707822812928094, 1]);
                done();
            }, 100);
        })
    });

    it('change shader for gltfmarker which has morph animations(fuzhenn/maptalks-studio#2242)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
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
