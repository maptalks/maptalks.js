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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 60,
                scaleY: 60,
                scaleZ: 60
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([8, 12, 13, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const vlayer = new maptalks.VectorLayer('v').addTo(map);
        new maptalks.Polygon(coord1, {
            symbol: {
                polygonOpacity: 0.1,
                lineWidth: 2,
                lineColor: '#f00'
            }
        }).addTo(vlayer);
        const mask = new maptalks.FlatInsideMask(coord1, {
            symbol: symbol1,
            flatHeight: 0
        });
        gltflayer.setMask(mask);
    });

    it('flat outside', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 60,
                scaleY: 60,
                scaleZ: 60
            }
        }).addTo(gltflayer);
        map.setPitch(45);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([5, 5, 5, 255], pixel)).to.be.eql(true);
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 60,
                scaleY: 60,
                scaleZ: 60
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 60,
                scaleY: 60,
                scaleZ: 60
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([7, 12, 13, 255], pixel1)).to.be.eql(true);
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 60,
                scaleY: 60,
                scaleZ: 60
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([133, 7, 7, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.ColorMask(coord1, {
            symbol: symbol1
        });
        gltflayer.setMask(mask);
    });

    it('transparent color mask(issues/791)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 60,
                scaleY: 60,
                scaleZ: 60
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([9, 14, 15, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
        const symbol = {
            polygonFill: "#0f0",
            polygonOpacity: 0
        }
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.ColorMask(coord1, {
            symbol
        });
        gltflayer.setMask(mask);
    });

    it('clear mask', done => {//TODO 做像素判断
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 60,
                scaleY: 60,
                scaleZ: 60
            }
        }).addTo(gltflayer);

        function clearMask() {
            gltflayer.removeMask();
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([7, 12, 13, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }

        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([7, 12, 13, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 50, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 60,
                scaleY: 60,
                scaleZ: 60
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
                expect(pixelMatch([132, 7, 7, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 30, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
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
                expect(pixelMatch([7, 11, 12, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 30, map.height / 2 + 50, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
                updateMask();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('video mask', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([28, 57, 97, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 100, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
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
                expect(pixelMatch([5, 7, 136, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([35, 37, 37, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([133, 7, 8, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([35, 37, 37, 255], pixel2)).to.be.eql(true);
                updateSymbol();
            }, 100);
        });
    });

    it('show and hide mask', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);

        function hide() {
            mask.hide();
            setTimeout(function() {
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([4, 7, 7, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([35, 37, 37, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([28, 57, 97, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([35, 37, 37, 255], pixel2)).to.be.eql(true);
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);

        function pause() {
            mask.pause();
            setTimeout(function() {
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([28, 57, 97, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([35, 37, 37, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([28, 57, 97, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([35, 37, 37, 255], pixel2)).to.be.eql(true);
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
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
                expect(pixelMatch([133, 7, 8, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 70, map.height / 2 + 70, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, 179, 129, 1, 1);
                expect(pixelMatch([130, 3, 4, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 + 50, map.height / 2, 1, 1);
                expect(pixelMatch([35, 37, 37, 255], pixel2)).to.be.eql(true);
                setCoordinates();
            }, 100);
        });
    });

    it('set height range for color mask', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
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
                expect(pixelMatch([10, 14, 16, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2 - 70, map.height / 2 + 70, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
                done();
            }, 100);
        }
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([10, 14, 16, 255], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 - 50, 1, 1);
                expect(pixelMatch([41, 82, 38, 255], pixel2)).to.be.eql(true);
                updateHeightRange();
            }, 100);
        });
    });

    it('add mask with holes', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([10, 14, 16, 255], pixel1)).to.be.eql(true);
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
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

    it('identify mask with holes', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            setTimeout(function() {
                const resultsInHole = gltflayer.identify(center);
                expect(resultsInHole.length).to.be.eql(1);
                expect(resultsInHole[0].data instanceof maptalks.GLTFMarker).to.be.eql(true);

                const resultsOutHole = gltflayer.identify(center.add(0.00043980278442308, 0));
                expect(resultsOutHole.length).to.be.eql(1);
                expect(resultsOutHole[0] instanceof maptalks.ColorMask).to.be.eql(false);
                expect(resultsOutHole[0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.ColorMask(holes);
        gltflayer.setMask(mask);
    });

    it('flv video', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        const videoElement = document.createElement('video');
        document.body.appendChild(videoElement);
        videoElement.id = 'video';
        videoElement.style.display = 'none';
        const flvUrl = 'resources/test.flv';
        const flvPlayer = window.flvjs.createPlayer({
            type: "flv",
            url: flvUrl
        });
        flvPlayer.attachMediaElement(videoElement);
        flvPlayer.load();
        flvPlayer.play();
        marker.once('load', () => {
            setTimeout(function() {
                const mask = new maptalks.VideoMask(coord1, {
                    elementId: 'video'
                });
                gltflayer.setMask(mask);
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([10, 14, 16, 255], pixel)).to.be.eql(true);
                done();
            }, 100);
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('box clip', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf', { geometryEvents: true });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        marker.once('load', () => {
            const mask = new maptalks.BoxInsideClipMask(center, {
                width: 100,
                length: 100,
                height: 100,
                rotation: 45
            });
            gltflayer.setMask(mask);
            setTimeout(function() {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel));//has been clipped
                done();
            })
        });
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    });

    it('setInfoWindow for mask(#597、#598)', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf', { geometryEvents: true });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url4,
                scaleX: 80,
                scaleY: 80,
                scaleZ: 80
            }
        }).addTo(gltflayer);
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const mask = new maptalks.ColorMask(coord1);
        const infoWindow = {
            title: 'info',
            content: 'maptalks',
            'autoPan': false,
            autoOpenOn: null
        };
        marker.once('load', () => {
            mask.setInfoWindow(infoWindow);
            mask.getInfoWindow().show();
            setTimeout(function() {
                for (let i = 0; i < 5; i++) {
                    happen.mousemove(eventContainer, {
                        'clientX':clickContainerPoint.x - 100 + i * 50,
                        'clientY':clickContainerPoint.y
                    });
                }
            }, 500);
        });
        mask.on('mousemove', () => {
            const infoWindowStyle = mask.getInfoWindow().__uiDOM.style;
            expect(infoWindowStyle.display).not.to.be.eql('none');
            expect(infoWindowStyle.cssText).to.be.eql('width: auto; bottom: 0px; position: absolute; left: 0px; transform: translate3d(170.703px, 135.67px, 0px) scale(1); transform-origin: 34.6172px bottom; z-index: 0;');
            done();
        });
        gltflayer.setMask(mask);
    })
});
