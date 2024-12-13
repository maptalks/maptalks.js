describe('GLTFLineString', () => {
    let map;
    beforeEach(function() {
        map = createMap();
        eventContainer = map._panels.canvasContainer;
    });

    afterEach(function() {
        removeMap(map);
    });

    const coordinates = [[-0.01, 0], [0, 0], [0, -0.01]];

    it('add GLTFLineString', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfline = new maptalks.GLTFLineString(coordinates, {
            direction: 2,
            symbol: {
                url: './models/fence/wooden_fence.glb',
                rotationZ: 90
            },
        }).addTo(gltflayer);
        map.setPitch(50);
        map.setBearing(45);
        gltfline.on('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([48, 40, 32, 128], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, 320, 220, 1, 1);
                expect(pixelMatch([51, 41, 32, 191], pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('update coordinates', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfline = new maptalks.GLTFLineString(coordinates, {
            direction: 2,
            symbol: {
                url: './models/fence/wooden_fence.glb',
                rotationZ: 90
            },
        }).addTo(gltflayer);
        map.setPitch(50);
        gltfline.on('load', () => {
            const newCoordinates = [
                [0, 0.01], [0, 0], [0.01, 0]
            ];
            gltfline.setCoordinates(newCoordinates);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, 295, 140, 1, 1);
                expect(pixelMatch([54, 44, 34, 207], pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('add GLTFLineString in map with identity spatial reference', done => {
        map.setSpatialReference(identitySpatialReference);
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const coords = [
            [0, 100], [0, 0], [100, 0]
        ];
        const gltfline = new maptalks.GLTFLineString(coords, {
            direction: 2,
            symbol: {
                url: './models/fence/wooden_fence.glb',
                rotationZ: 90
            },
        }).addTo(gltflayer);
        map.setPitch(50);
        gltfline.on('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, 295, 140, 1, 1);
                expect(pixelMatch([57, 48, 38, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('zoomTo', done => {
        map.setCenter([1, 1]);
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfline = new maptalks.GLTFLineString(coordinates, {
            direction: 2,
            symbol: {
                url: './models/fence/wooden_fence.glb',
                rotationZ: 90
            },
        }).addTo(gltflayer);
        gltfline.on('load', () => {
            gltfline.zoomTo();
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([62, 48, 37, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, 295, 140, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
                done();
            }, 600);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('toJSON', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gltfline = new maptalks.GLTFLineString(coordinates, {
            direction: 2,
            symbol: {
                url: './models/fence/wooden_fence.glb',
                rotationZ: 90
            },
        }).addTo(gltflayer);
        gltfline.on('load', () => {
            gltfline.zoomTo();
            setTimeout(function() {
               const json =  gltfline.toJSON();
               expect(json.coordinates.length).to.be.eql(3);
               done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });
});
