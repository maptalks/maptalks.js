describe('add analysis', () => {
    const modelUrl = 'models/terrain/terrain.glb';
    let map;
    beforeEach(function() {
        map = createMap();
    });

    afterEach(function() {
        removeMap(map);
    });
    it('add ViewShedAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const eyePos = [center.x + 0.01, center.y, 0];
            const lookPoint = [center.x, center.y, 0];
            const verticalAngle = 30;
            const horizontalAngle = 20;
            const viewshedAnalysis = new maptalks.ViewshedAnalysis({
                eyePos,
                lookPoint,
                verticalAngle,
                horizontalAngle
            });
            viewshedAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 2, 2);
                expect(pixelMatch([224, 45, 45, 255, 224, 45, 45, 255, 224, 45, 45, 255, 224, 45, 45, 255], pixel1)).to.be.eql(true);//不可视区域颜色
                const pixel2 = pickPixel(map, 260, 115, 2, 2);
                expect(pixelMatch([45, 223, 45, 255, 45, 223, 45, 255, 45, 223, 45, 255, 45, 223, 45, 255], pixel2)).to.be.eql(true);//可视区域颜色
                const vertexCoordinates = viewshedAnalysis.getVertexCoordinates();
                expect(vertexCoordinates[0].x).to.be.eql(0);
                expect(vertexCoordinates[0].y).to.be.eql(-0.001763269806815515);
                expect(vertexCoordinates[0].z).to.be.eql(228.49549);
                expect(vertexCoordinates[1].x).to.be.eql(0);
                expect(vertexCoordinates[1].y).to.be.eql(0.001763269806815515);
                expect(vertexCoordinates[1].z).to.be.eql(228.49549);
                expect(vertexCoordinates[2].x).to.be.eql(0);
                expect(vertexCoordinates[2].y).to.be.eql(0.001763269806815515);
                expect(vertexCoordinates[2].z).to.be.eql(228.49549);
                expect(vertexCoordinates[3].x).to.be.eql(0);
                expect(vertexCoordinates[3].y).to.be.eql(-0.001763269806815515);
                expect(vertexCoordinates[3].z).to.be.eql(228.49549);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('add FloodAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl, //TODO,模型改成小一点的模型
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const floodAnalysis = new maptalks.FloodAnalysis({
                waterHeight: 10,
                waterColor: [0.1, 0.5, 0.6]
            });
            floodAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 2, 2);
                expect(pixelMatch([101, 142, 152, 255, 101, 142, 152, 255, 101, 142, 152, 255, 101, 142, 152, 255], pixel1)).to.be.eql(true);//水淹区颜色
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 - 80, 2, 2);
                expect(pixelMatch([158, 158, 158, 255, 157, 157, 157, 255, 157, 157, 157, 255, 157, 157, 157, 255], pixel2)).to.be.eql(true);//非水淹区颜色
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });


    it('add SkylineAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            map.setCenter([0.00007795844737756852, -0.002186416483624498]);
            map.setPitch(77.6);
            map.setZoom(18.9778);
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, 145, 36, 1, 1);
                expect(pixelMatch([143, 29, 0, 255], pixel1)).to.be.eql(true);//天际线颜色
                const pixel2 = pickPixel(map, 200, 80, 1, 1);
                expect(pixelMatch([153, 153, 153, 255], pixel2)).to.be.eql(true);//无天际线颜色
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('add InSightAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const inSightAnalysis = new maptalks.InSightAnalysis({
                lines: [{
                    from: [center.x, center.y, 0],
                    to: [center.x + 0.05, center.y + 0.05, 20]
                }],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            });
            inSightAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, 302, 47, 1, 1);
                expect(pixelMatch([255, 0, 0, 255], pixel1)).to.be.eql(true);//非通视区颜色
                const pixel2 = pickPixel(map, 249, 100, 1, 1);
                expect(pixelMatch([0, 255, 0, 255], pixel2)).to.be.eql(true);//通视区颜色
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('add CutAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const cutAnalysis = new maptalks.CutAnalysis({
                position: [center.x, center.y, 0],
                rotation: [45, 90, 45],
                scale: [1, 1, 1]
            });
            cutAnalysis.addTo(gllayer);
            setTimeout(function() {
                const renderer = gltflayer.getRenderer();
                const meshes = renderer.getAnalysisMeshes();
                const tempMap = cutAnalysis.exportAnalysisMap(meshes);
                const index = (map.height / 2) * map.width * 4 + (map.width / 2) * 4;
                const arr = tempMap.slice(index, index + 16);
                expect(pixelMatch([0, 0, 0, 25, 0, 0, 0, 25, 0, 0, 0, 25, 0, 0, 0, 25], arr)).to.be.eql(true);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('add ExcavateAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const boundary = [[ -0.0008475780487060547, 0.000815391540498922],
                [-0.0013518333435058594, 0.00009655952453613281],
                [-0.0004184246063232422, -0.0005686283111288049],
                [0.0005471706390380859, 0.00006437301638584358],
                [0.0005042552947998047, 0.0006651878356649377]];
            const excavateAnalysis = new maptalks.ExcavateAnalysis({
                boundary,
                textureUrl: './resources/ground.jpg'
            });
            excavateAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                const pixel2 = pickPixel(map, 270, 100, 1, 1);
                expect(pixelMatch([120, 98, 85, 255], pixel1)).to.be.eql(true);//挖方区颜色
                expect(pixelMatch([255, 255, 255, 255], pixel2)).to.be.eql(true);//非挖方区颜色
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('add HeightLimitAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const heightLimitAnalysis = new maptalks.HeightLimitAnalysis({
                limitHeight: 15,
                limitColor: [0.9, 0.2, 0.2]
            });
            heightLimitAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);//未超过高度阈值的颜色
                const pixel2 = pickPixel(map, 160, 150, 1, 1);//超过高度阈值颜色
                expect(pixelMatch([151, 151, 151, 255], pixel1)).to.be.eql(true);
                expect(pixelMatch([179, 107, 107, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('update', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        const eyePos = [center.x + 0.01, center.y, 0];
        const lookPoint = [center.x, center.y, 0];
        const verticalAngle = 30;
        const horizontalAngle = 20;
        const viewshedAnalysis = new maptalks.ViewshedAnalysis({
            eyePos,
            lookPoint,
            verticalAngle,
            horizontalAngle
        });
        viewshedAnalysis.addTo(gllayer);
        setTimeout(() => {
            viewshedAnalysis.update('eyePos', [center.x - 0.01, center.y + 0.01, 10]);
            viewshedAnalysis.update('lookPoint', [center.x + 0.01, center.y - 0.01, 0]);
            viewshedAnalysis.update('verticalAngle', 45);
            viewshedAnalysis.update('horizontalAngle', 30);
            setTimeout(function() {
                testColor();
            }, 100);
        }, 100);

        function testColor() {
            const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);//不可视区域的颜色
            const pixel2 = pickPixel(map, 120, 80, 1, 1);//可视区域颜色
            expect(pixelMatch([224, 45, 45, 255], pixel1)).to.be.eql(true);
            expect(pixelMatch([44, 222, 44, 255], pixel2)).to.be.eql(true);
            done();
        }
        gllayer.addTo(map);
    });

    it('export result image by skylineAanalysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            map.setCenter([0.00007795844737756852, -0.002186416483624498]);
            map.setPitch(77.6);
            map.setZoom(18.9778);
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            setTimeout(function() {
                const base64 = skylineAnalysis.exportSkylineMap({
                    save: false
                });
                const expectedBase64 = 'data:image/png;base64,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PwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoEBEgRvLIECBBIFxAg6RPUPwECBIoE/gXXzYODS1dxWgAAAABJRU5ErkJggg==';
                expect(base64).to.be.eql(expectedBase64);
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('remove skylineAnalysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            map.setCenter([0.00007795844737756852, -0.002186416483624498]);
            map.setPitch(77.6);
            map.setZoom(18.9778);
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            setTimeout(function() {
                skylineAnalysis.remove();
                const pixel = pickPixel(map, 145, 36, 1, 1);
                expect(pixelMatch([143, 29, 0, 255], pixel)).to.be.eql(false);//无天际线颜色
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('enable and disable analysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const eyePos = [center.x + 0.01, center.y, 0];
            const lookPoint = [center.x, center.y, 0];
            const verticalAngle = 30;
            const horizontalAngle = 20;
            const viewshedAnalysis = new maptalks.ViewshedAnalysis({
                eyePos,
                lookPoint,
                verticalAngle,
                horizontalAngle
            });
            viewshedAnalysis.addTo(gllayer);
            viewshedAnalysis.enable();
            setTimeout(() => {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);//enable后的颜色
                expect(pixelMatch([224, 45, 45, 255], pixel)).to.be.eql(true);
                viewshedAnalysis.disable();
                setTimeout(function() {
                    const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);//disable后的颜色
                    expect(pixelMatch([151, 151, 151, 255], pixel)).to.be.eql(true);
                    done();
                }, 100);
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('calculate volume for excavate analysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        map.on('click', e => {
            console.log([e.coordinate.x, e.coordinate.y]);
        });
        marker.on('load', () => {
            const boundary = [[-0.00021457672119140625, 0.00019311904907226562], [-0.0000858306884765625, 0.000171661376953125], [-0.00007510185241699219, 0.00007510185241699219], [-0.00021457672119140625, 0.00008583068850498421]];
            const excavateAnalysis = new maptalks.ExcavateAnalysis({
                boundary,
                textureUrl: './resources/ground.jpg',
                height: -10
            });
            excavateAnalysis.addTo(gllayer);
            setTimeout(function() {
                const volume = excavateAnalysis.getVolume();
                expect(volume).to.be.eql(137.16457420476468);
                done();
            }, 500);
        });
    });

    it('update boundary for crosscut analysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const crosscutAnalysis = new maptalks.CrossCutAnalysis({
                cutLine: [[ -0.000847, 0.000815],
                    [-0.001351, 0.0000965],
                    [-0.000418, -0.000568]],
                cutLineColor: [0.0, 1.0, 0.0, 1.0]
            }).addTo(gllayer);
            crosscutAnalysis.addTo(gllayer);
            setTimeout(function() {
                crosscutAnalysis.update('cutLine', [[ -0.00084, 0.00082],
                    [-0.001355, 0.0000960],
                    [-0.00042, -0.00057]]);
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('add more than one analysis task, and then disable one of this', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            //skyline analysis
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            //viewshed analysis
            const eyePos = [center.x + 0.01, center.y, 0];
            const lookPoint = [center.x, center.y, 0];
            const verticalAngle = 30;
            const horizontalAngle = 20;
            const viewshedAnalysis = new maptalks.ViewshedAnalysis({
                eyePos,
                lookPoint,
                verticalAngle,
                horizontalAngle
            });
            viewshedAnalysis.addTo(gllayer);
            skylineAnalysis.disable();
            done();
        });
        gllayer.addTo(map);
    });

    it('exclude layers', done => {
        const gltflayer1 = new maptalks.GLTFLayer('gltf1');
        const gltflayer2 = new maptalks.GLTFLayer('gltf2');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer1, gltflayer2], { sceneConfig });
        const marker1 = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer1);
        new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scale: [1, 1, 1]
            }
        }).addTo(gltflayer1);
        marker1.on('load', () => {
            const boundary = [[ -0.00084, 0.00081],
                [-0.00135, 0.00009],
                [-0.00041, -0.00056],
                [0.00054, 0.00006],
                [0.0005, 0.00066]];
            const excavateAnalysis = new maptalks.ExcavateAnalysis({
                boundary,
                textureUrl: './resources/ground.jpg',
                excludeLayers: ['gltf2'] //不参与被开挖图层的id
            });
            excavateAnalysis.addTo(gllayer);
            setTimeout(function() {
                const renderer = gltflayer1.getRenderer();
                const meshes = renderer.getAnalysisMeshes();
                const tempMap = excavateAnalysis.exportAnalysisMap(meshes);
                const index = (map.height / 2) * map.width * 4 + (map.width / 2) * 4;
                const arr = tempMap.slice(index, index + 16);
                expect(pixelMatch([122, 99, 83, 255, 157, 131, 114, 255, 134, 117, 101, 255, 122, 92, 81, 255], arr));
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('add more than one insight lines', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const inSightAnalysis = new maptalks.InSightAnalysis({
                lines: [{
                    from: [center.x, center.y, 0],
                    to: [center.x + 0.05, center.y + 0.05, 20]
                }],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            });
            inSightAnalysis.addTo(gllayer);
            inSightAnalysis.addLine({
                from: [center.x, center.y, 10],
                to: [center.x - 0.03, center.y - 0.05, 20],
            });
            setTimeout(function() {
                const pixel1 = pickPixel(map, 302, 47, 1, 1);
                expect(pixelMatch([255, 0, 0, 255], pixel1)).to.be.eql(true);//非通视区颜色
                const pixel2 = pickPixel(map, 249, 100, 1, 1);
                expect(pixelMatch([0, 255, 0, 255], pixel2)).to.be.eql(true);//通视区颜色
                //另一条通视线的颜色比对
                const pixel3 = pickPixel(map, 140, 246, 4, 4);
                expect(pixelMatch([255, 0, 0, 255], pixel3.slice(8, 12))).to.be.eql(true);//非通视区颜色
                const pixel4 = pickPixel(map, 167, 201, 4, 4);
                expect(pixelMatch([0, 255, 0, 255], pixel4.slice(8, 12))).to.be.eql(true);//通视区颜色
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('clear insight lines', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const inSightAnalysis = new maptalks.InSightAnalysis({
                lines: [{
                    from: [center.x, center.y, 0],
                    to: [center.x + 0.05, center.y + 0.05, 20],
                }],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            });
            inSightAnalysis.addTo(gllayer);
            inSightAnalysis.addLine({
                from: [center.x, center.y, 10],
                to: [center.x - 0.03, center.y - 0.05, 20]
            });
            inSightAnalysis.clearLines();
            setTimeout(function() {
                //清空后没有通视线了
                const pixel1 = pickPixel(map, 302, 47, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, 249, 100, 1, 1);
                expect(pixelMatch([146, 146, 146, 255], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, 140, 246, 4, 4);
                expect(pixelMatch([138, 138, 138, 255], pixel3.slice(8, 12))).to.be.eql(true);
                const pixel4 = pickPixel(map, 167, 201, 4, 4);
                expect(pixelMatch([152, 152, 152, 255], pixel4.slice(8, 12))).to.be.eql(true);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('get intersect data', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        gltflayer.on('modelload', () => {
            const insightAnalysis = new maptalks.InSightAnalysis({
                lines: [{
                    from: [center.x + 0.002, center.y - 0.001, 50],
                    to: [center.x - 0.001, center.y + 0.0015, 50]
                }],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            }).addTo(gllayer);
            setTimeout(function() {
                const { inSightLine, intersects } = insightAnalysis.getIntersetction()[0];
                expect(inSightLine).to.be.ok();
                expect(intersects.length).to.be.eql(2);
                expect(intersects[0][0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                expect(intersects[1][0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                expect(intersects[0][0].coordinates[0].coordinate.x).to.be.eql(0.0007622108088298774);
                expect(intersects[0][0].coordinates[0].coordinate.y).to.be.eql(0.00003149099268284772);
                expect(intersects[0][0].coordinates[0].coordinate.z).to.be.eql(50.00033);
                expect(intersects[1][0].coordinates[0].coordinate.x).to.be.eql(-0.0002377891911464758);
                expect(intersects[1][0].coordinates[0].coordinate.y).to.be.eql(0.0008648243260438448);
                expect(intersects[1][0].coordinates[0].coordinate.z).to.be.eql(50.00033);
                done();
            }, 100);
        });
        gllayer.addTo(map);
        new maptalks.GLTFMarker(center).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0.001, 0)).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0, 0.001)).addTo(gltflayer);
    });

    it('raycaster\'s test method', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        new maptalks.GLTFMarker(center).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0.001, 0)).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0, 0.001)).addTo(gltflayer);
        function getAllMeshes() {
            let meshes = [];
            const markers = gltflayer.getGeometries();
            for (let i = 0; i < markers.length; i++) {
                meshes = meshes.concat(markers[i].getMeshes());
            }
            return meshes;
        }
        gltflayer.on('modelload', () => {
            setTimeout(function() {
                const from = new maptalks.Coordinate(center.x + 0.002, center.y - 0.001, 50);
                const to = new maptalks.Coordinate(center.x - 0.001, center.y + 0.0015, 50);
                const raycaster = new maptalks.RayCaster(from, to);
                const meshes = getAllMeshes();
                const results = raycaster.test(meshes, map);
                expect(results.length).to.be.eql(2);
                expect(results[0].mesh).to.be.ok();
                expect(results[0].coordinates[0].indices).to.be.eql([0, 1, 2]);
                expect(results[0].coordinates[0].coordinate.x).to.be.eql(0.0007622108088298774);
                expect(results[0].coordinates[0].coordinate.y).to.be.eql(0.00003149099268284772);
                expect(results[0].coordinates[0].coordinate.z).to.be.eql(50.00033);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('set lines for insightAnalysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        gltflayer.on('modelload', () => {
            const insightAnalysis = new maptalks.InSightAnalysis({
                lines: [],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            }).addTo(gllayer);
            insightAnalysis.setLines([{
                from: [center.x + 0.002, center.y - 0.001, 50],
                to: [center.x - 0.001, center.y + 0.0015, 50]
            }
            ]);
            setTimeout(function() {
                const { inSightLine, intersects } = insightAnalysis.getIntersetction()[0];
                expect(inSightLine).to.be.ok();
                expect(intersects.length).to.be.eql(2);
                expect(intersects[0][0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                expect(intersects[1][0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                expect(intersects[0][0].coordinates[0].coordinate.x).to.be.eql(0.0007622108088298774);
                expect(intersects[0][0].coordinates[0].coordinate.y).to.be.eql(0.00003149099268284772);
                expect(intersects[0][0].coordinates[0].coordinate.z).to.be.eql(50.00033);
                expect(intersects[1][0].coordinates[0].coordinate.x).to.be.eql(-0.0002377891911464758);
                expect(intersects[1][0].coordinates[0].coordinate.y).to.be.eql(0.0008648243260438448);
                expect(intersects[1][0].coordinates[0].coordinate.z).to.be.eql(50.00033);
                done();
            }, 100);
        });
        gllayer.addTo(map);
        new maptalks.GLTFMarker(center).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0.001, 0)).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0, 0.001)).addTo(gltflayer);
    });

    it('add measure tool', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol: {
                url: modelUrl
            }
        }).addTo(gltflayer);
        let measuretool = null;
        function measure() {
            measuretool.fire('drawstart', { coordinate: center });
            measuretool.fire('mousemove', { coordinate: center.add(0.001, 0) });
            const result = measuretool.getMeasureResult();
            expect(result).to.be.eql(222.63898);
            done();
        }
        marker.on('load', () => {
            measuretool = new maptalks.Height3DTool({
                enable: true
            }).addTo(gllayer);
            setTimeout(function () {
                measure();
            }, 100);
        });
    });
});
