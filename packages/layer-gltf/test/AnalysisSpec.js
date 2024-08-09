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
                expect(vertexCoordinates[0].x.toFixed(7)).to.be.eql(0);
                expect(vertexCoordinates[0].y).to.be.eql(-0.0017632698068089827);
                expect(vertexCoordinates[0].z.toFixed(5)).to.be.eql(228.49549);
                expect(vertexCoordinates[1].x.toFixed(7)).to.be.eql(0);
                expect(vertexCoordinates[1].y).to.be.eql(0.0017632698068089827);
                expect(vertexCoordinates[1].z.toFixed(5)).to.be.eql(228.49549);
                expect(vertexCoordinates[2].x.toFixed(7)).to.be.eql(0);
                expect(vertexCoordinates[2].y).to.be.eql(0.0017632698068089827);
                expect(vertexCoordinates[2].z.toFixed(5)).to.be.eql(228.49549);
                expect(vertexCoordinates[3].x.toFixed(7)).to.be.eql(0);
                expect(vertexCoordinates[3].y).to.be.eql(-0.0017632698068089827);
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
                const pixel1 = pickPixel(map, 50, 60, 1, 1);
                expect(pixelMatch([143, 29, 0, 255], pixel1)).to.be.eql(true);//天际线颜色
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
                expect(pixelMatch([1, 1, 1, 25, 1, 1, 1, 25, 1, 1, 1, 25, 231, 231, 231, 255], arr)).to.be.eql(true);
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
                const expectedBase64 = 'data:image/png;base64,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JCAgEZshAgQIEBAQO0CAAAECkYCARGyGCBAgQEBA7AABAgQIRAICErEZIkCAAAEBsQMECBAgEAkISMRmiAABAgQExA4QIECAQCQgIBGbIQIECBAQEDtAgAABApGAgERshggQIEBAQOwAAQIECEQCAhKxGSJAgAABAbEDBAgQIBAJCEjEZogAAQIEBMQOECBAgEAkICARmyECBAgQEBA7QIAAAQKRgIBEbIYIECBAQEDsAAECBAhEAgISsRkiQIAAAQGxAwQIECAQCQhIxGaIAAECBATEDhAgQIBAJCAgEZshAgQIEBAQO0CAAAECkYCARGyGCBAgQEBA7AABAgQIRAICErEZIkCAAAEBsQMECBAgEAkISMRmiAABAgQExA4QIECAQCQgIBGbIQIECBAQEDtAgAABApGAgERshggQIEBAQOwAAQIECEQCAhKxGSJAgAABAbEDBAgQIBAJCEjEZogAAQIEBMQOECBAgEAkICARmyECBAgQEBA7QIAAAQKRgIBEbIYIECBAQEDsAAECBAhEAgISsRkiQIAAAQGxAwQIECAQCQhIxGaIAAECBATEDhAgQIBAJCAgEZshAgQIEBAQO0CAAAECkYCARGyGCBAgQEBA7AABAgQIRAICErEZIkCAAAEBsQMECBAgEAkISMRmiAABAgQExA4QIECAQCQgIBGbIQIECBAQEDtAgAABApGAgERshggQIEBAQOwAAQIECEQCAhKxGSJAgAABAbEDBAgQIBAJCEjEZogAAQIEBMQOECBAgEAkICARmyECBAgQEBA7QIAAAQKRgIBEbIYIECBAQEDsAAECBAhEAgISsRkiQIAAAQGxAwQIECAQCQhIxGaIAAECBATEDhAgQIBAJCAgEZshAgQIEBAQO0CAAAECkYCARGyGCBAgQEBA7AABAgQIRAICErEZIkCAAAEBsQMECBAgEAkISMRmiAABAgQExA4QIECAQCQgIBGbIQIECBAQEDtAgAABApGAgERshggQIEBAQOwAAQIECEQCAhKxGSJAgAABAbEDBAgQIBAJCEjEZogAAQIEBMQOECBAgEAkICARmyECBAgQEBA7QIAAAQKRgIBEbIYIECBAQEDsAAECBAhEAgISsRkiQIAAAQGxAwQIECAQCQhIxGaIAAECBATEDhAgQIBAJCAgEZshAgQIEBAQO0CAAAECkYCARGyGCBAgQEBA7AABAgQIRAICErEZIkCAAAEBsQMECBAgEAkISMRmiAABAgQExA4QIECAQCQgIBGbIQIECBAQEDtAgAABApGAgERshggQIEBAQOwAAQIECEQCAhKxGSJAgAABAbEDBAgQIBAJCEjEZogAAQIEBMQOECBAgEAkICARmyECBAgQEBA7QIAAAQKRgIBEbIYIECBAQEDsAAECBAhEAgISsRkiQIAAAQGxAwQIECAQCQhIxGaIAAECBATEDhAgQIBAJCAgEZshAgQIEBAQO0CAAAECkYCARGyGCBAgQEBA7AABAgQIRAICErEZIkCAAAEBsQMECBAgEAkISMRmiAABAgQExA4QIECAQCQgIBGbIQIECBAQEDtAgAABApGAgERshggQIEBAQOwAAQIECEQCAhKxGSJAgAABAbEDBAgQIBAJCEjEZogAAQIEBMQOECBAgEAkICARmyECBAgQEBA7QIAAAQKRgIBEbIYIECBAQEDsAAECBAhEAgISsRkiQIAAAQGxAwQIECAQCQhIxGaIAAECBATEDhAgQIBAJCAgEZshAgQIEBAQO0CAAAECkYCARGyGCBAgQEBA7AABAgQIRAICErEZIkCAAAEBsQMECBAgEAkISMRmiAABAgQExA4QIECAQCQgIBGbIQIECBAQEDtAgAABApGAgERshggQIEBAQOwAAQIECEQCAhKxGSJAgAABAbEDBAgQIBAJCEjEZogAAQIEBMQOECBAgEAkICARmyECBAgQEBA7QIAAAQKRgIBEbIYIECBAQEDsAAECBAhEAgISsRkiQIAAAQGxAwQIECAQCQhIxGaIAAECBATEDhAgQIBAJCAgEZshAgQIEBAQO0CAAAECkYCARGyGCBAgQEBA7AABAgQIRAICErEZIkCAAAEBsQMECBAgEAkISMRmiAABAgQExA4QIECAQCQgIBGbIQIECBAQEDtAgAABApGAgERshggQIEBAQOwAAQIECEQCAhKxGSJAgAABAbEDBAgQIBAJCEjEZogAAQIEBMQOECBAgEAkICARmyECBAgQEBA7QIAAAQKRgIBEbIYIECBAQEDsAAECBAhEAgISsRkiQIAAAQGxAwQIECAQCQhIxGaIAAECBATEDhAgQIBAJCAgEZshAgQIEBAQO0CAAAECkYCARGyGCBAgQEBA7AABAgQIRAICErEZIkCAAAEBsQMECBAgEAkISMRmiAABAgQExA4QIECAQCQgIBGbIQIECBAQEDtAgAABApGAgERshggQIEBAQOwAAQIECEQCAhKxGSJAgAABAbEDBAgQIBAJCEjEZogAAQIEBMQOECBAgEAkICARmyECBAgQEBA7QIAAAQKRgIBEbIYIECBAQEDsAAECBAhEAgISsRkiQIAAAQGxAwQIECAQCQhIxGaIAAECBATEDhAgQIBAJCAgEZshAgQIEBAQO0CAAAECkYCARGyGCBAgQEBA7AABAgQIRAICErEZIkCAAAEBsQMECBAgEAkISMRmiAABAgQExA4QIECAQCQgIBGbIQIECBAQEDtAgAABApGAgERshggQIEBAQOwAAQIECEQCAhKxGSJAgAABAbEDBAgQIBAJCEjEZogAAQIEBMQOECBAgEAkICARmyECBAgQEBA7QIAAAQKRgIBEbIYIECBAQEDsAAECBAhEAv8Ca8UqZaCWLA0AAAAASUVORK5CYII=';
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
                expect(intersects[0][0].coordinates[0].coordinate.x).to.be.eql(0.001662382672710473);
                expect(intersects[0][0].coordinates[0].coordinate.y).to.be.eql(-0.0007186522272667832);
                expect(intersects[0][0].coordinates[0].coordinate.z.toFixed(5)).to.be.eql(50.00033);
                expect(intersects[1][0].coordinates[0].coordinate.x).to.be.eql(0.0004623826730195796);
                expect(intersects[1][0].coordinates[0].coordinate.y).to.be.eql(0.0002813477725397769);
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
                expect(results[0].coordinates[0].coordinate.x).to.be.eql(0.001662382672710473);
                expect(results[0].coordinates[0].coordinate.y).to.be.eql(-0.0007186522272667832 );
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
                expect(intersects[0][0].coordinates[0].coordinate.x).to.be.eql(0.001662382672710473);
                expect(intersects[0][0].coordinates[0].coordinate.y).to.be.eql(-0.0007186522272667832);
                expect(intersects[0][0].coordinates[0].coordinate.z.toFixed(5)).to.be.eql(50.00033);
                expect(intersects[1][0].coordinates[0].coordinate.x).to.be.eql(0.0004623826730195796);
                expect(intersects[1][0].coordinates[0].coordinate.y).to.be.eql(0.0002813477725397769);
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
