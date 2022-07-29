const center = new maptalks.Coordinate([0, 0]);
const sceneConfig = {
    shadow: {
        type: 'esm',
        enable: true,
        quality: 'high',
        opacity: 1.0,
        color: [0, 0, 0],
        blurOffset: 1,
        lightDirection: [0, 1, -1],
    },
    postProcess: {
        enable: true,
        antialias: {
            enable: true,
            taa: true
        },
        bloom: {
            enable: true,
            threshold: 0,
            factor: 1,
            radius: 0.4,
        },
    },
    outline: {
        enable: true
    }
};

const lightConfig = {
    ambient: {
        resource: {
            url: 'resources/env.hdr',
        },
        // 没有resource时或者不支持hdr的shader的环境光值
        color: [0.2, 0.2, 0.2],
        exposure: 1.5
    },
    directional: {
        color: [0.1, 0.1, 0.1],
        specular: [0.8, 0.8, 0.8],
        direction: [-1, -1, -1],
    }
};
const modelUrl = 'models/manhattan/scene.gltf';
const container = document.createElement('div');
const width = 400, height = 300;
container.style.width = width + 'px';
container.style.height = height + 'px';
document.body.appendChild(container);
const map = new maptalks.Map(container, {
    center,
    zoom: 17,
    lights: lightConfig
});

afterEach(function () {
    const layers = map.getLayers();
    layers.forEach(layer => {
        if (layer.clearAnalysis) {
            layer.clearAnalysis();
        }
        layer.remove();
    });
});

function uint8ArrayEqual(a, b) {
    for (let i = 0; i < b.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

describe('add analysis', () => {
    it('add ViewShedAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scale: [5, 5, 5]
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
                const renderer = gltflayer.getRenderer();
                const meshes = renderer.getAnalysisMeshes();
                const tempMap = viewshedAnalysis.exportAnalysisMap(meshes);
                const index = (height / 2) * width * 4 + (width / 2) * 4;
                const arr = tempMap.slice(index, index + 16);
                expect(uint8ArrayEqual(arr, [255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]));
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
                url : modelUrl,
                scale: [5, 5, 5]
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const floodAnalysis = new maptalks.FloodAnalysis({
                waterHeight: 20,
                waterColor: [0.1, 0.5, 0.6]
            });
            floodAnalysis.addTo(gllayer);
            setTimeout(function() {
                const renderer = gltflayer.getRenderer();
                const meshes = renderer.getAnalysisMeshes();
                const tempMap = floodAnalysis.exportAnalysisMap(meshes);
                const index = (height / 2) * width * 4 + (width / 2) * 4;
                const arr = tempMap.slice(index, index + 16);
                expect(uint8ArrayEqual(arr, [0, 0, 0, 0, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]));
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
                scale: [5, 5, 5]
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            setTimeout(function() {
                const renderer = gltflayer.getRenderer();
                const meshes = renderer.getAnalysisMeshes();
                const tempMap = skylineAnalysis.exportAnalysisMap(meshes);
                const index = (height / 2) * width * 4 + (width / 2) * 4;
                const arr = tempMap.slice(index, index + 16);
                expect(uint8ArrayEqual(arr, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('add InSightAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scale: [5, 5, 5]
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const inSightAnalysis = new maptalks.InSightAnalysis({
                eyePos: [center.x, center.y, 0],
                lookPoint: [center.x + 0.05, center.y + 0.05, 20],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            });
            inSightAnalysis.addTo(gllayer);
            setTimeout(function() {
                const renderer = gltflayer.getRenderer();
                const meshes = renderer.getAnalysisMeshes();
                const tempMap = inSightAnalysis.exportAnalysisMap(meshes);
                const index = (height / 2) * width * 4 + (width / 2) * 4;
                const arr = tempMap.slice(index, index + 16);
                expect(uint8ArrayEqual(arr, [0, 255, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255]));
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
                scale: [5, 5, 5]
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
                const index = (height / 2) * width * 4 + (width / 2) * 4;
                const arr = tempMap.slice(index, index + 16);
                expect(uint8ArrayEqual(arr, [0, 2, 2, 53, 0, 2, 2, 53, 0, 2, 2, 53, 0, 2, 2, 53]));
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
                scale: [5, 5, 5]
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
                const renderer = gltflayer.getRenderer();
                const meshes = renderer.getAnalysisMeshes();
                const tempMap = excavateAnalysis.exportAnalysisMap(meshes);
                const index = (height / 2) * width * 4 + (width / 2) * 4;
                const arr = tempMap.slice(index, index + 16);
                expect(uint8ArrayEqual(arr, [122, 95, 84, 255, 123, 104, 90, 255, 112, 93, 79, 255, 125, 107, 93, 255]));
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });
});

describe('api of analysis', () => {
    it('update', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scale: [5, 5, 5]
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
        gllayer.addTo(map);
        setTimeout(() => {
            viewshedAnalysis.update('eyePos', [center.x - 0.01, center.y + 0.01, 10]);
            viewshedAnalysis.update('lookPoint', [center.x + 0.01, center.y - 0.01, 0]);
            viewshedAnalysis.update('verticalAngle', 45);
            viewshedAnalysis.update('horizontalAngle', 30);
            done();
        }, 500);

    });

    it('export result image by skylineAanalysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scale: [5, 5, 5]
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            setTimeout(function() {
                skylineAnalysis.exportSkylineMap({
                    save: true
                });
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('remove skylineAnalysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scale: [5, 5, 5]
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            setTimeout(function() {
                skylineAnalysis.remove();
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
                scale: [5, 5, 5]
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            skylineAnalysis.disable();
            setTimeout(function() {
                skylineAnalysis.enable();
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    //依赖maptalks核心库的map.pointToAltitude方法
    // it('calculate volume for excavate analysis', (done) => {
    //     const gltflayer = new maptalks.GLTFLayer('gltf');
    //     const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
    //     const marker = new maptalks.GLTFMarker(center, {
    //         symbol : {
    //             url : modelUrl,
    //             scale: [5, 5, 5]
    //         }
    //     }).addTo(gltflayer);
    //     marker.on('load', () => {
    //         const boundary = [[ -0.0008475780487060547, 0.000815391540498922],
    //             [-0.0013518333435058594, 0.00009655952453613281],
    //             [-0.0004184246063232422, -0.0005686283111288049],
    //             [0.0005471706390380859, 0.00006437301638584358],
    //             [0.0005042552947998047, 0.0006651878356649377]];
    //         const excavateAnalysis = new maptalks.ExcavateAnalysis({
    //             boundary,
    //             textureUrl: './resources/ground.jpg'
    //         });
    //         excavateAnalysis.addTo(gllayer);
    //         setTimeout(function() {
    //             const volume = excavateAnalysis.getVolume();
    //             done();
    //         }, 500);
    //     });
    // });
});
