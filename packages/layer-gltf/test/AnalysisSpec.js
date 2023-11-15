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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 4,
                scaleY: 4,
                scaleZ: 4
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
                expect(vertexCoordinates[0].z.toFixed(5)).to.be.eql(228.49549);
                expect(vertexCoordinates[1].x).to.be.eql(0);
                expect(vertexCoordinates[1].y).to.be.eql(0.001763269806815515);
                expect(vertexCoordinates[1].z.toFixed(5)).to.be.eql(228.49549);
                expect(vertexCoordinates[2].x).to.be.eql(0);
                expect(vertexCoordinates[2].y).to.be.eql(0.001763269806815515);
                expect(vertexCoordinates[2].z.toFixed(5)).to.be.eql(228.49549);
                expect(vertexCoordinates[3].x).to.be.eql(0);
                expect(vertexCoordinates[3].y).to.be.eql(-0.001763269806815515);
                expect(vertexCoordinates[3].z.toFixed(5)).to.be.eql(228.49549);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('add FloodAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl, //TODO,模型改成小一点的模型
                scaleX: 4,
                scaleY: 4,
                scaleZ: 4
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
                expect(pixelMatch([75, 136, 152, 255, 76, 137, 152, 255, 76, 137, 152, 255, 76, 137, 152, 255], pixel1)).to.be.eql(true);//水淹区颜色
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 - 80, 2, 2);
                expect(pixelMatch([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], pixel2)).to.be.eql(true);//非水淹区颜色
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });


    it('add SkylineAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 4,
                scaleY: 4,
                scaleZ: 4
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
                const pixel1 = pickPixel(map, 50, 69, 1, 1);
                expect(pixelMatch([178, 36, 0, 255], pixel1)).to.be.eql(true);//天际线颜色
                const pixel2 = pickPixel(map, 200, 80, 1, 1);
                expect(pixelMatch([144, 144, 144, 255], pixel2)).to.be.eql(true);//无天际线颜色
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('add InSightAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 6,
                scaleY: 6,
                scaleZ: 6
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const inSightAnalysis = new maptalks.InSightAnalysis({
                lines: [{
                    from: [center.x, center.y, 10],
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
        const marker = new maptalks.GLTFGeometry(center, {
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
                expect(pixelMatch([1, 1, 1, 25, 1, 1, 1, 25, 1, 1, 1, 25, 1, 1, 1, 25], arr)).to.be.eql(true);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('add HeightLimitAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 4,
                scaleY: 4,
                scaleZ: 4
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const heightLimitAnalysis = new maptalks.HeightLimitAnalysis({
                limitHeight: 10,
                limitColor: [0.9, 0.2, 0.2]
            });
            heightLimitAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);//未超过高度阈值的颜色
                const pixel2 = pickPixel(map, 172, 148, 1, 1);//超过高度阈值颜色
                expect(pixelMatch([151, 151, 151, 255], pixel1)).to.be.eql(true);
                expect(pixelMatch([178, 107, 107, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('update', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        new maptalks.GLTFGeometry(center, {
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
            expect(pixelMatch([204, 204, 25, 255], pixel1)).to.be.eql(true);
            expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
            done();
        }
        gllayer.addTo(map);
    });

    it('export result image by skylineAanalysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 4,
                scaleY: 4,
                scaleZ: 4
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
                const expectedBase64 = 'data:image/png;base64,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';
                expect(base64).to.be.eql(expectedBase64);
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('remove skylineAnalysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 6,
                scaleY: 6,
                scaleZ: 6
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
                expect(pixelMatch([0, 0, 0, 0], pixel)).to.be.eql(true);//无天际线颜色
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('enable and disable analysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 4,
                scaleY: 4,
                scaleZ: 4
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

    it('update boundary for crosscut analysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFGeometry(center, {
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
        const marker = new maptalks.GLTFGeometry(center, {
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

    it('add more than one insight lines', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 4,
                scaleY: 4,
                scaleZ: 4
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
                expect(pixelMatch([0, 255, 0, 255], pixel3.slice(8, 12))).to.be.eql(true);//通视区颜色
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 4,
                scaleY: 4,
                scaleZ: 4
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
                expect(pixelMatch([0, 0, 0, 0], pixel3.slice(8, 12))).to.be.eql(true);
                const pixel4 = pickPixel(map, 167, 201, 4, 4);
                expect(pixelMatch([148, 148, 148, 255], pixel4.slice(8, 12))).to.be.eql(true);
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
                const result = insightAnalysis.getIntersetction()[0];
                const { inSightLine, intersects } = result;
                expect(inSightLine).to.be.ok();
                expect(intersects.length).to.be.eql(2);
                expect(intersects[0][0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                expect(intersects[1][0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                expect(intersects[0][0].coordinates[0].coordinate.x).to.be.eql(0.0016623826727482083);
                expect(intersects[0][0].coordinates[0].coordinate.y).to.be.eql(-0.0007186522272775164);
                expect(intersects[0][0].coordinates[0].coordinate.z.toFixed(5)).to.be.eql(50.00033);
                expect(intersects[1][0].coordinates[0].coordinate.x).to.be.eql(0.0004623826730494329);
                expect(intersects[1][0].coordinates[0].coordinate.y).to.be.eql(0.00028134777252830645);
                expect(intersects[1][0].coordinates[0].coordinate.z.toFixed(5)).to.be.eql(50.00033);
                done();
            }, 100);
        });
        gllayer.addTo(map);
        new maptalks.GLTFGeometry(center.add(-0.002, -0.002), { symbol: { url: 'cube', scaleX: 4 / 3, scaleY: 4 / 3, scaleZ: 4 / 3 }}).addTo(gltflayer);
        new maptalks.GLTFGeometry(center.add(0.001, 0), { symbol: { url: 'cube', scaleX: 4 / 3, scaleY: 4 / 3, scaleZ: 4 / 3 }}).addTo(gltflayer);
        new maptalks.GLTFGeometry(center.add(0, 0.001), { symbol: { url: 'cube', scaleX: 4 / 3, scaleY: 4 / 3, scaleZ: 4 / 3 }}).addTo(gltflayer);
    });

    it('raycaster\'s test method', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        new maptalks.GLTFGeometry(center.add(-0.002, -0.002), { symbol: { url: 'cube', scaleX: 4 / 3, scaleY: 4 / 3, scaleZ: 4 / 3 }}).addTo(gltflayer);
        new maptalks.GLTFGeometry(center.add(0.001, 0), { symbol: { url: 'cube', scaleX: 4 / 3, scaleY: 4 / 3, scaleZ: 4 / 3 }}).addTo(gltflayer);
        new maptalks.GLTFGeometry(center.add(0, 0.001), { symbol: { url: 'cube', scaleX: 4 / 3, scaleY: 4 / 3, scaleZ: 4 / 3 }}).addTo(gltflayer);
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
                expect(results[0].coordinates[0].indices).to.be.eql([0, 2, 3]);
                expect(results[0].coordinates[0].coordinate.x).to.be.eql(0.0016623826727482083);
                expect(results[0].coordinates[0].coordinate.y).to.be.eql(-0.0007186522272775164);
                expect(results[0].coordinates[0].coordinate.z.toFixed(5)).to.be.eql(50.00033);
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
                expect(intersects[0][0].coordinates[0].coordinate.x).to.be.eql(0.0016623826727482083);
                expect(intersects[0][0].coordinates[0].coordinate.y).to.be.eql(-0.0007186522272775164);
                expect(intersects[0][0].coordinates[0].coordinate.z.toFixed(5)).to.be.eql(50.00033);
                expect(intersects[1][0].coordinates[0].coordinate.x).to.be.eql(0.0004623826730494329);
                expect(intersects[1][0].coordinates[0].coordinate.y).to.be.eql(0.00028134777252830645);
                expect(intersects[1][0].coordinates[0].coordinate.z.toFixed(5)).to.be.eql(50.00033);
                done();
            }, 100);
        });
        gllayer.addTo(map);
        new maptalks.GLTFGeometry(center.add(-0.002, -0.002), { symbol: { url: 'cube', scaleX: 4 / 3, scaleY: 4 / 3, scaleZ: 4 / 3 }}).addTo(gltflayer);
        new maptalks.GLTFGeometry(center.add(0.001, 0), { symbol: { url: 'cube', scaleX: 4 / 3, scaleY: 4 / 3, scaleZ: 4 / 3 }}).addTo(gltflayer);
        new maptalks.GLTFGeometry(center.add(0, 0.001), { symbol: { url: 'cube', scaleX: 4 / 3, scaleY: 4 / 3, scaleZ: 4 / 3 }}).addTo(gltflayer);
    });

    it('add measure tool', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: modelUrl
            }
        }).addTo(gltflayer);
        let measuretool = null;
        function measure() {
            measuretool.fire('drawstart', { coordinate: center });
            measuretool.fire('mousemove', { coordinate: center.add(0.001, 0) });
            const result = measuretool.getMeasureResult();
            expect(result.toFixed(5)).to.be.eql(222.63898);
            measuretool.clear();
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


    it('ExcavateAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 4,
                scaleY: 4,
                scaleZ: 4
            }
        }).addTo(gltflayer);
        map.setPitch(45);
        marker.on('load', () => {
            const dataConfig = {
                type: "3d-extrusion",
                altitudeProperty: "height",
                altitudeScale: 1,
                defaultAltitude: 0,
                top: false,
                side: true
            };
            const material = {
                baseColorFactor: [0, 1, 1, 1],
            };
            const boundary = [[-0.0003325939178466797, 0.00039696693420410156],
                [-0.00039696693420410156, -0.0002574920654012658],
                [0.00037550926208496094, -0.00023603439328212517],
                [0.00037550926208496094, 0.00046133995053310173]];
            const mask = new maptalks.ClipInsideMask(boundary);
            gltflayer.setMask([mask]);
            const polygon = new maptalks.Polygon(boundary, {
                properties: {
                    height: 500
                }
            });
            const excavateAnalysis = new maptalks.ExcavateAnalysis('excavate', [polygon], {
                dataConfig,
                material
            });
            excavateAnalysis.excavate(gltflayer);
            excavateAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                const pixel2 = pickPixel(map, 200, 120, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel1)).to.be.eql(true);//挖方区域颜色
                expect(pixelMatch([29, 151, 151, 255], pixel2)).to.be.eql(true);//挖方测面颜色
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });
});
