describe('setMask', () => {
    let map, eventContainer;
    beforeEach(function() {
        map = createMap();
        eventContainer = map._panels.canvasContainer;
    });

    afterEach(function() {
        removeMap(map);
    });

    const coord1 = [
        [-0.0002, 0.0003], [0.0004, 0.0004], [0.0005, -0.0003], [-0.0003, -0.0003]
    ];
    const coord2 = [
        [-0.0008, -0.0001], [-0.0001, -0.0002], [-0.0001, -0.0008], [-0.001, -0.0008]
    ];
    const coord3 = [
        [-0.0011801719665527344, 0.001330375671273032],
        [0.0016629695892333984, 0.001298189163094321],
        [0.00171661376953125, -0.0015020370481693135],
        [-0.0016736984252929688, -0.0013196468351850399]
    ];

    const holes = [
        [
            [-0.0002, 0.0003], [0.0004, 0.0004], [0.0005, -0.0003], [-0.0003, -0.0003]
        ],
        [
            [-0.00008471313299196481, 0.00008523985158603864],
            [-0.00009211871702063945, -0.0001221165037748051],
            [0.00011523763828336087, -0.00014186472807864448],
            [0.0001621396710334011, 0.00012473630025056082]
        ]
    ];

    
    
    const symbol1 = {
        polygonFill: "#f00",
        polygonOpacity: 0.5
    };
    const symbol2 = {
        polygonFill: "#0f0",
        polygonOpacity: 0.5
    };
    // TODO 分成5个测试用例，做像素判断
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
        const mask = new maptalks.FlatInsideMask(coord1, {
            symbol: symbol1,
            flatHeight: 0
        });
        gltflayer.setMask(mask);
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
        const mask = new maptalks.FlatOutsideMask(coord1, {
            symbol: symbol1,
            flatHeight: 0
        });
        gltflayer.setMask(mask);
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
        const mask = new maptalks.ClipInsideMask(coord1);
        gltflayer.setMask(mask);
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
        const mask = new maptalks.ClipOutsideMask(coord1);
        gltflayer.setMask(mask);
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
        const mask = new maptalks.ColorMask(coord1, {
            symbol: symbol1
        });
        gltflayer.setMask(mask);
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
            gltflayer.removeMask();
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
                expect(pixelMatch([12, 139, 11, 255], pixel2)).to.be.eql(true);
                clearMask();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask1 = new maptalks.FlatOutsideMask(coord1, {
            flatHeight: 0
        });
        const mask2 = new maptalks.ColorMask(coord2, {
            symbol: symbol2
        });
        gltflayer.setMask([mask2, mask1]);
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
            const mask1 = new maptalks.FlatOutsideMask(coord2, {
                flatHeight: 0
            });
            const mask2 = new maptalks.ColorMask(coord1, {
                symbol: symbol1
            });
            gltflayer.setMask([mask2, mask1]);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([150, 29, 31, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([29, 27, 24, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }

        marker.once('load', () => {
            const mask1 = new maptalks.FlatOutsideMask(coord1, {
                flatHeight: 0
            });
            const mask2 = new maptalks.ColorMask(coord2, {
                symbol: symbol2
            });
            gltflayer.setMask([mask2, mask1]);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([46, 58, 61, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([12, 139, 11, 255], pixel2)).to.be.eql(true);
                updateMask();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('video mask', done => {
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
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([213, 216, 216, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([73, 73, 73, 255], pixel2)).to.be.eql(true);
                done();
            }, 500);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.VideoMask(coord1, {
            url: 'resources/video.mp4'
        });
        gltflayer.setMask(mask);
    });

    it('update symbol', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.ColorMask(coord1, {
            symbol: symbol1
        });
        gltflayer.setMask(mask);
        function updateSymbol() {
            mask.updateSymbol({
                polygonFill: [0, 0, 255, 1],
                polygonOpacity: 0.5
            });
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([23, 30, 158, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([73, 73, 73, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([150, 30, 31, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([73, 73, 73, 255], pixel2)).to.be.eql(true);
                updateSymbol()
            }, 100);
        });
    });

    it('show and hide mask', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        
        function hide() {
            mask.hide();
            setTimeout(function() {
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([47, 59, 62, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([73, 73, 73, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);  
        }
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([213, 216, 216, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([73, 73, 73, 255], pixel2)).to.be.eql(true);
                hide();
            }, 500);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.VideoMask(coord1, {
            url: 'resources/video.mp4'
        });
        gltflayer.setMask(mask);
    });

    it('stop and play videoMask', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        
        function pause() {
            mask.pause();
            setTimeout(function() {
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([213, 216, 216, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([73, 73, 73, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);  
        }
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([213, 216, 216, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([73, 73, 73, 255], pixel2)).to.be.eql(true);
                pause();
            }, 500);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.VideoMask(coord1, {
            url: 'resources/video.mp4'
        });
        gltflayer.setMask(mask);
    });

    it('setCoordinates for mask', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.ColorMask(coord1, {
            symbol: symbol1
        });
        gltflayer.setMask(mask);
        function setCoordinates() {
            mask.setCoordinates(coord2);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([47, 59, 62, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 70, map.height / 2 + 70, 1, 1);
                expect(pixelMatch([176, 52, 53, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([150, 30, 31, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 70, map.height / 2 + 70, 1, 1);
                expect(pixelMatch([98, 103, 103, 255], pixel2)).to.be.eql(true);
                setCoordinates()
            }, 100);
        });
    });

    it('set height range for color mask', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.ColorMask(coord3, {
            symbol: symbol1,
            heightRange: [100, 130]
        });
        gltflayer.setMask(mask);
        function updateHeightRange() {
            mask.setHeightRange([140, 180]);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([150, 30, 31, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 70, map.height / 2 + 70, 1, 1);
                expect(pixelMatch([176, 52, 53, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([47, 59, 62, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 - 100, 1, 1);
                expect(pixelMatch([160, 38, 41, 255], pixel2)).to.be.eql(true);
                updateHeightRange();
            }, 100);
        });
    });

    it('add mask with holes', done => {
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
                const pixel2 = pickPixel(map, map.width / 2 + 30, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.ClipInsideMask(holes);
        gltflayer.setMask(mask);
    });

    it('click event', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf', { geometryEvents: true });
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
                happen.click(eventContainer, {
                    'clientX':clickContainerPoint.x,
                    'clientY':clickContainerPoint.y
                });
            }, 500);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.ColorMask(coord1);
        mask.on('click', () => {
            done();
        });
        gltflayer.setMask(mask);
    });

    it('mousemove event', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf', { geometryEvents: true });
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: url4,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        let times = 0;
        marker.once('load', () => {
            setTimeout(function() {
                for (let i = 0; i < 5; i++) {
                    happen.mousemove(eventContainer, {
                        'clientX':clickContainerPoint.x - 100 + i * 50,
                        'clientY':clickContainerPoint.y
                    });
                }
            }, 500);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.ColorMask(coord1);
        mask.on('mouseenter', () => {
            times += 1;
            if (times > 1) {
                done();
            }
        });
        mask.on('mouseout', () => {
            times += 1;
            if (times > 1) {
                done();
            }
        });
        gltflayer.setMask(mask);
    });
});