describe('setMask', () => {
    let map;
    beforeEach(function() {
        map = createMap();
    });

    afterEach(function() {
        removeMap(map);
    });

    const polygon1 = new maptalks.Polygon([
        [-0.0002, 0.0003], [0.0004, 0.0004], [0.0005, -0.0003], [-0.0003, -0.0003]
    ], {
        symbol: {
            polygonFill: "#f00",
            polygonOpacity: 0.5
        }
    });
    const polygon2 = new maptalks.Polygon([
        [-0.0008, -0.0001], [-0.0001, -0.0002], [-0.0001, -0.0008], [-0.001, -0.0008]
    ], {
        symbol: {
            polygonFill: "#0f0",
            polygonOpacity: 0.5
        }
    });

    //TODO 分成5个测试用例，做像素判断
    it('flat inside ', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([46, 58, 61, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltflayer.setMask([
            {
                polygons: [polygon1],
                mode: 'flat-inside',
                flatHeight: 0
            }
        ]);
    });

    it('flat outside', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        map.setPitch(45);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([47, 59, 62, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltflayer.setMask([
            {
                polygons: [polygon1],
                mode: 'flat-outside',
                flatHeight: 0
            }
        ]);
    });

    it('clip inside', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltflayer.setMask([
            {
                polygons: [polygon1],
                mode: 'clip-inside'
            }
        ]);
    });

    it('clip outside', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([47, 59, 62, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 150, map.height / 2, 1, 1);
                expect(pixel2).to.be.eql([0, 0, 0, 0]);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltflayer.setMask([
            {
                polygons: [polygon1],
                mode: 'clip-outside'
            }
        ]);
    });

    it('color', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([150, 30, 31, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([73, 73, 73, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltflayer.setMask([
            {
                polygons: [polygon1],
                mode: 'color'
            }
        ]);
    });

    it('clear mask', done => {//TODO 做像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);

        function clearMask() {
            gltflayer.setMask(null);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([47, 59, 62, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([29, 27, 24, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }

        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([47, 59, 62, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([33, 161, 33, 255], pixel2)).to.be.eql(true);
                clearMask();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltflayer.setMask([
            {
                polygons: [polygon1],
                mode: 'flat-outside',
                flatHeight: 0
            },
            {
                polygons: [polygon2],
                mode: 'color'
            }
        ]);
    });

    it('update mask', done => {//TODO 需要做像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);

        function updateMask() {
            gltflayer.setMask([
                {
                    polygons: [polygon2],
                    mode: 'flat-outside',
                    flatHeight: 0
                },
                {
                    polygons: [polygon1],
                    mode: 'color'
                }
            ]);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([150, 29, 31, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([29, 27, 24, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }

        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([47, 59, 62, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([33, 161, 33, 255], pixel2)).to.be.eql(true);
                updateMask();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        gltflayer.setMask([
            {
                polygons: [polygon1],
                mode: 'flat-outside',
                flatHeight: 0
            },
            {
                polygons: [polygon2],
                mode: 'color'
            }
        ]);
    });
});