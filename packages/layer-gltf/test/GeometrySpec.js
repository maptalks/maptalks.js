describe('sharing geometry', function () {
    let map;
    beforeEach(function() {
        map = createMap();
    });

    afterEach(function() {
        removeMap(map);
    });
    it('reuse geometry', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf12').addTo(map);
        new maptalks.GLTFGeometry(center, { symbol: { url: url2 }}).addTo(gltflayer);
        new maptalks.GLTFGeometry(center, { symbol: { url: url2 }}).addTo(gltflayer);
        gltflayer.on('modelload', () => {
            const renderer = gltflayer.getRenderer();
            const gltfmanager = renderer.regl.gltfManager;
            const resource = gltfmanager.getGLTF(url2);
            expect(resource.refCount).to.be.eql(2);
            done();
        });
    });

    it('will not reuse geometry', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf12').addTo(map);
        new maptalks.GLTFGeometry(center, { symbol: { url: url2 }}).addTo(gltflayer);
        new maptalks.GLTFGeometry(center, { symbol: { url: url1 }}).addTo(gltflayer);
        gltflayer.on('modelload', () => {
            const renderer = gltflayer.getRenderer();
            const gltfmanager = renderer.regl.gltfManager;
            const resource1 = gltfmanager.getGLTF(url1);
            const resource2 = gltfmanager.getGLTF(url2);
            expect(resource1.refCount).to.be.eql(1);
            expect(resource2.refCount).to.be.eql(1);
            done();
        });
    });

    it('remove geometry and needRetireFrames(maptalks-studio/issues/1930)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf12').addTo(map);
        const marker1 = new maptalks.GLTFGeometry(center, { symbol: { url: url1 }});
        const marker2 = new maptalks.GLTFGeometry(center, { symbol: { url: url2 }});
        const marker3 = marker1.copy();
        const marker4 = marker1.copy();
        gltflayer.on('modelload', () => {
            const renderer = gltflayer.getRenderer();
            const gltfmanager = renderer.regl.gltfManager;
            marker1.remove();
            expect(renderer.needRetireFrames()).to.be.eql(true);
            const resource1 = gltfmanager.getGLTF(url1);
            const resource2 = gltfmanager.getGLTF(url2);
            expect(resource1.refCount).to.be.eql(2);
            expect(resource2.refCount).to.be.eql(1);
            setTimeout(() => {
                marker2.remove();
                expect(renderer.needRetireFrames()).to.be.eql(true);
                const resource3 = gltfmanager.getGLTF(url2);
                expect(resource3).not.to.be.ok();
                marker3.remove();
                expect(renderer.needRetireFrames()).to.be.eql(true);
                const resource4 = gltfmanager.getGLTF(url1);
                expect(resource4.refCount).to.be.eql(1);
                marker4.remove();
                expect(renderer.needRetireFrames()).to.be.eql(true);
                const resource5 = gltfmanager.getGLTF(url1);
                expect(resource5).not.to.be.ok();
                done();
            }, 100);
        });
        gltflayer.addGeometry([marker1, marker2, marker3, marker4]);
    });

    it('clear', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf12').addTo(map);
        for (let i = 0; i < 5; i++) {
            new maptalks.GLTFGeometry(center, { symbol: { url: url1 }}).addTo(gltflayer);
        }
        for (let i = 0; i < 5; i++) {
            new maptalks.GLTFGeometry(center, { symbol: { url: url2 }}).addTo(gltflayer);
        }
        gltflayer.clear();
        const geometries = gltflayer.getGeometries();
        expect(geometries.length).to.be.eql(0);
    });

    it('load geometries in a geojson format in constructor', () => {
        const gltflayer = new maptalks.GLTFLayer('geojson_layer', geojson).addTo(map);
        const markers = gltflayer.getGeometries();
        for (let i = 0; i < markers.length; i++) {
            //默认为pbr shader
            expect(markers[i].getShader()).to.be.eql('pbr');
            expect(markers[i].getUrl()).to.be.eql('pyramid');
        }
        expect(markers.length).to.be.eql(5);
    });

    it('support geometries and geojson when constructed', () => {
        const layer1 = new maptalks.GLTFLayer('gltf1', geojson, { fitSize: 30 }).addTo(map);
        const markers = [];
        for (let i = 0; i < 10; i++) {
            const gltfmarker = new maptalks.GLTFGeometry(center.add(i * 0.01, -i * 0.01), {
                symbol: {
                    url: url1
                }
            });
            markers.push(gltfmarker);
        }
        const layer2 = new maptalks.GLTFLayer('gltf2', markers, { fitSize: 30 }).addTo(map);
        const layer3 = new maptalks.GLTFLayer('gltf3').addTo(map);
        expect(layer1.getGeometries().length).to.be.eql(5);
        expect(layer2.getGeometries().length).to.be.eql(10);
        expect(layer3.getGeometries().length).to.be.eql(0);
    });
});
