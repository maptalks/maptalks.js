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
                expect(pixelMatch([150, 150, 150, 255, 151, 151, 151, 255, 151, 151, 151, 255, 151, 151, 151, 255], pixel1)).to.be.eql(true);//不可视区域颜色
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

        function updateFloodAnalysis(floodAnalysis) {
            const boundary =  [[-0.0002477077744060807,0.00020472131322435416],
                [-8.199026524380315e-7,-0.00019097568653592134],
                [0.00031709050745121203,0.00001532787743485642]];
            floodAnalysis.update('boundary', boundary);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 2, 2);
                expect(pixelMatch([75, 136, 152, 255, 76, 137, 152, 255, 76, 137, 152, 255, 76, 137, 152, 255], pixel1)).to.be.eql(true);//水淹区颜色
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 - 45, 2, 2);
                expect(pixelMatch([147, 147, 147, 255, 148, 148, 148, 255, 146, 146, 146, 255, 146, 146, 146, 255], pixel2)).to.be.eql(true);//非水淹区颜色
                done();
            }, 100);
        }
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
                updateFloodAnalysis(floodAnalysis);
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
        const marker = new maptalks.GLTFGeometry(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        const eyePos = [center.x + 0.0005, center.y, 0];
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
        marker.on('load', () => {
            setTimeout(() => {
                testColorBefore();
                viewshedAnalysis.update('eyePos', [center.x - 0.0005, center.y + 0.0005, 10]);
                viewshedAnalysis.update('lookPoint', [center.x + 0.0005, center.y - 0.0005, 0]);
                viewshedAnalysis.update('verticalAngle', 60);
                viewshedAnalysis.update('horizontalAngle', 30);
                setTimeout(function() {
                    testColorAfter();
                }, 100);
            }, 100);
        })

        function testColorBefore() {
            const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);//不可视区域的颜色
            const pixel2 = pickPixel(map, 120, 80, 1, 1);//可视区域颜色
            expect(pixelMatch([45, 224, 45, 255], pixel1)).to.be.eql(true);
            expect(pixelMatch([0, 0, 0, 0], pixel2)).to.be.eql(true);
        }

        function testColorAfter() {
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
                const expectedBase64 = 'data:image/png;base64,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5enrnQABAoGAAAnwlBIgQKCygACpPH29EyBAIBAQIAGeUgIECFQWECCVp693AgQIBAICJMBTSoAAgcoCAqTy9PVOgACBQECABHhKCRAgUFlAgFSevt4JECAQCAiQAE8pAQIEKgsIkMrT1zsBAgQCAQES4CklQIBAZQEBUnn6eidAgEAgIEACPKUECBCoLCBAKk9f7wQIEAgEBEiAp5QAAQKVBQRI5enrnQABAoGAAAnwlBIgQKCygACpPH29EyBAIBAQIAGeUgIECFQWECCVp693AgQIBAICJMBTSoAAgcoCAqTy9PVOgACBQECABHhKCRAgUFlAgFSevt4JECAQCAiQAE8pAQIEKgsIkMrT1zsBAgQCAQES4CklQIBAZQEBUnn6eidAgEAgIEACPKUECBCoLCBAKk9f7wQIEAgEBEiAp5QAAQKVBQRI5enrnQABAoGAAAnwlBIgQKCygACpPH29EyBAIBAQIAGeUgIECFQWECCVp693AgQIBAICJMBTSoAAgcoCAqTy9PVOgACBQECABHhKCRAgUFlAgFSevt4JECAQCAiQAE8pAQIEKgsIkMrT1zsBAgQCAQES4CklQIBAZQEBUnn6eidAgEAgIEACPKUECBCoLCBAKk9f7wQIEAgEBEiAp5QAAQKVBQRI5enrnQABAoGAAAnwlBIgQKCygACpPH29EyBAIBAQIAGeUgIECFQWECCVp693AgQIBAICJMBTSoAAgcoCAqTy9PVOgACBQECABHhKCRAgUFlAgFSevt4JECAQCAiQAE8pAQIEKgsIkMrT1zsBAgQCAQES4CklQIBAZQEBUnn6eidAgEAgIEACPKUECBCoLCBAKk9f7wQIEAgEBEiAp5QAAQKVBQRI5enrnQABAoGAAAnwlBIgQKCygACpPH29EyBAIBAQIAGeUgIECFQWECCVp693AgQIBAICJMBTSoAAgcoCAqTy9PVOgACBQECABHhKCRAgUFlAgFSevt4JECAQCAiQAE8pAQIEKgsIkMrT1zsBAgQCAQES4CklQIBAZQEBUnn6eidAgEAgIEACPKUECBCoLCBAKk9f7wQIEAgEBEiAp5QAAQKVBQRI5enrnQABAoGAAAnwlBIgQKCygACpPH29EyBAIBAQIAGeUgIECFQWECCVp693AgQIBAICJMBTSoAAgcoCAqTy9PVOgACBQECABHhKCRAgUFlAgFSevt4JECAQCAiQAE8pAQIEKgsIkMrT1zsBAgQCAQES4CklQIBAZQEBUnn6eidAgEAgIEACPKUECBCoLCBAKk9f7wQIEAgEBEiAp5QAAQKVBQRI5enrnQABAoGAAAnwlBIgQKCygACpPH29EyBAIBAQIAGeUgIECFQWECCVp693AgQIBAICJMBTSoAAgcoCAqTy9PVOgACBQECABHhKCRAgUFlAgFSevt4JECAQCAiQAE8pAQIEKgsIkMrT1zsBAgQCgf8CiNRzdN5vzz8AAAAASUVORK5CYII=';
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
                const pixel = pickPixel(map, map.width / 2 + 10, map.height / 2, 1, 1);//enable后的颜色
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
                const coords =  [[-0.0002477077744060807,0.00020472131322435416],
                    [-8.199026524380315e-7,-0.00019097568653592134],
                    [0.00031709050745121203,0.00001532787743485642]];
                crosscutAnalysis.update('cutLine', coords);
                const results = crosscutAnalysis.getAltitudes(10);
                expect(results.length).to.be.eql(10);
                for (let i = 0; i < results.length; i++) {
                    expect(results[i].coordinate).to.be.ok();
                    expect(results[i].distance !== undefined).to.be.ok();
                }
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
                expect(results[0].coordinates[0].indices).to.be.eql([0, 1, 2]);
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
        new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
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
            }).addTo(map);
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
                material,
                castShadow: false
            });
            excavateAnalysis.excavate(gltflayer);
            excavateAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                const pixel2 = pickPixel(map, 200, 120, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel1)).to.be.eql(true);//挖方区域颜色
                expect(pixelMatch([75, 181, 181, 255], pixel2)).to.be.eql(true);//挖方测面颜色
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });
});
