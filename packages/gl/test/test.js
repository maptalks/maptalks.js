const resultCanvas = document.createElement('canvas');

describe('gl tests', () => {
    let container, map;
    beforeEach(() => {
        container = document.createElement('div');
        const width = 512, height = 512;
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        document.body.appendChild(container);
    });

    afterEach(() => {
        map.remove();
        document.body.removeChild(container);
    });

    context('ground color tests', () => {
        it('support css color in ground', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                ground: {
                    enable: true,
                    renderPlugin: {
                        type: 'fill'
                    },
                    symbol: {
                        polygonFill: '#f00'
                    }
                }
            };
            const group = new maptalks.GroupGLLayer('group', [], {
                sceneConfig
            });
            let count = 0;
            group.once('layerload', () => {
                if (count === 0) {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                    expect(pixel).to.be.eql({ data: { '0': 255, '1': 0, '2': 0, '3': 255 } });
                    done();
                }
                count++;
            });
            group.addTo(map);
        });
    });

    context('tilelayer tests', () => {
        it('GroupGLLayer.queryTerrain', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    const altitude = group.queryTerrain(map.getCenter());
                    expect(altitude).to.be.eql([3654.39990234375, 1]);
                    done();
                });
            });
            group.addTo(map);
        });

        it('support tilelayer in post process, maptalks/issues#148', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const tileLayer = new maptalks.TileLayer('base', {
                urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
            });
            const group = new maptalks.GroupGLLayer('group', [tileLayer], {
                sceneConfig
            });
            let count = 0;
            group.once('layerload', () => {
                if (count === 0) {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                    expect(pixel).to.be.eql({ data: { '0': 138, '1': 142, '2': 143, '3': 255 } });
                    done();
                }
                count++;
            });
            group.addTo(map);
        });

        it('support tilelayer in post process (taa off), maptalks/issues#148', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const tileLayer = new maptalks.TileLayer('base', {
                urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
            });
            const group = new maptalks.GroupGLLayer('group', [tileLayer], {
                sceneConfig
            });
            let count = 0;
            group.once('layerload', () => {
                if (count === 0) {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                    expect(pixel).to.be.eql({ data: { '0': 138, '1': 142, '2': 143, '3': 255 } });
                    done();
                }
                count++;
            });
            group.addTo(map);
        });

        it('tilelayer order in GroupGLLayer, maptalks/issues#300', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const sceneConfig = {
                postProcess: {
                    enable: true,
                    antialias: {
                        enable: true
                    }
                }
            };
            const greenLayer = new maptalks.TileLayer('black', {
                urlTemplate: './fixtures/tiles/tile-green-256.png',
                zIndex: 1,
                fadeAnimation: false
            });
            const redLayer = new maptalks.TileLayer('red', {
                urlTemplate: './fixtures/tiles/tile-red-256.png',
                zIndex: 0,
                fadeAnimation: false
            });
            const group = new maptalks.GroupGLLayer('group', [greenLayer, redLayer], {
                sceneConfig
            });
            group.addTo(map);
            setTimeout(() => {
                const canvas = map.getRenderer().canvas;
                const ctx = canvas.getContext('2d');
                const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                expect(pixel).to.be.eql({ data: { '0': 0, '1': 255, '2': 0, '3': 255 } });
                done();
            }, 500);
        });
    });

    context('terrain tests', () =>{
        it('terrain layer with 256 skin layer', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain
            });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 148, '1': 152, '2': 153, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain layer with opacity', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                opacity: 0.5
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, {
                terrain
            });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 149, '1': 153, '2': 155, '3': 127 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('GroupGLLayer.setTerrain', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers);
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = group.getRenderer().canvas;
                        const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2);
                        expect(pixel).to.be.eql({ data: { '0': 148, '1': 152, '2': 153, '3': 255 }});
                        done();
                    });
                });
            });
            group.addTo(map);
            group.setTerrain(terrain);
        });

        it('GroupGLLayer with skinLayers', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const group = new maptalks.GroupGLLayer('group', skinLayers);
            group.once('layerload', () => {
                done();
            });
            group.addTo(map);
        });

        it('GroupGLLayer set null terrain', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = group.getRenderer().canvas;
                        const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2);
                        expect(pixel).to.be.eql({ data: { '0': 138, '1': 142, '2': 143, '3': 255 } });
                        done();
                    });
                    group.setTerrain(null);
                });
            });
            group.addTo(map);
        });

        it('terrain with dpr of 2', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12,
                devicePixelRatio: 2
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 152, '1': 156, '2': 157, '3': 255 } });
                        const altitude = group.queryTerrain(map.getCenter());
                        expect(altitude).to.be.eql([3654.39990234375, 1]);
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain with lit shader', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                shader: 'lit',
                material: {
                    baseColorFactor: [1, 1, 1, 1],
                    roughnessFactor: 0.9,
                    metallicFactor: 0
                }
            }
            const group = new maptalks.GroupGLLayer('group', [], { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 125, '1': 125, '2': 125, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain with invalid terrain tiles', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/invalid.webp',
                tileStackDepth: 0,
                shader: 'lit',
                material: {
                    baseColorFactor: [1, 1, 1, 1],
                    roughnessFactor: 0.9,
                    metallicFactor: 0
                }
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 131, '1': 135, '2': 136, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it.only('switch shader for terrain', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                shader: 'lit',
                material: {
                    baseColorFactor: [1, 1, 1, 1],
                    roughnessFactor: 0.9,
                    metallicFactor: 0
                }
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            let count = 0;

            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.on('paintercreated', () => {
                    count++;
                });
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        group.once('layerload', () => {
                            expect(count).to.be.eql(2);
                            const canvas = map.getRenderer().canvas;
                            const ctx = canvas.getContext('2d');
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 154, '1': 158, '2': 159, '3': 255 } });
                            done();
                        });
                        expect(count).to.be.eql(1);
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 154, '1': 158, '2': 159, '3': 255 } });
                        group.getTerrainLayer().options.shader = 'default';
                    });
                });
            });
            group.addTo(map);
        });
    });

    context('skybox tests', () => {
        it('support skybox with 6 images', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const lights = {
                ambient: {
                    resource: {
                        // url: './resources/venice_sunset_2k.hdr',
                        url: {
                            front: '/resources/skybox_bridge/posx.jpg',
                            back: '/resources/skybox_bridge/negx.jpg',
                            right: '/resources/skybox_bridge/posy.jpg',
                            left: '/resources/skybox_bridge/negy.jpg',
                            top: '/resources/skybox_bridge/posz.jpg',
                            bottom: '/resources/skybox_bridge/negz.jpg'
                        },
                        prefilterCubeSize: 512,
                    },
                    exposure: 1.5,
                    orientation: 0
                },
                directional: {
                    color : [0.1, 0.1, 0.1],
                    direction : [1, 0, -1]
                }
            };
            map.setLights(lights);
            map.setPitch(80);
            const sceneConfig = {
                environment: {
                    enable: true,
                    mode: 1,
                    level: 0
                },
                ground: {
                    enable: true,
                    renderPlugin: {
                        type: 'lit'
                    },
                    symbol: {
                        material: {
                            'baseColorFactor': [1, 1, 1, 1],
                            'roughnessFactor': 0.,
                            'metalnessFactor': 1,
                            'outputSRGB': 0,
                            'hsv': [0, 0, 0],
                            'contrast': 1.5
                        },
                        polygonFill: [1, 1, 1, 1],
                        polygonOpacity: 1
                    }
                },
                postProcess: {
                    enable: true,
                }
            };
            map.on('updatelights', () => {
                setTimeout(() => {
                    const canvas = map.getRenderer().canvas;
                    const ctx = canvas.getContext('2d');
                    const data = ctx.getImageData(192, 128, 5, 5);
                    const expected = new Uint8ClampedArray([38, 79, 135, 255, 36, 78, 134, 255, 36, 78, 134, 255, 37, 79, 135, 255, 38, 79, 135, 255, 39, 80, 136, 255, 37, 79, 135, 255, 37, 79, 136, 255, 37, 79, 136, 255, 38, 80, 137, 255, 39, 80, 137, 255, 37, 79, 137, 255, 37, 79, 137, 255, 38, 80, 138, 255, 38, 80, 138, 255, 40, 81, 138, 255, 38, 79, 138, 255, 38, 80, 138, 255, 38, 80, 139, 255, 39, 81, 139, 255, 40, 81, 138, 255, 38, 80, 138, 255, 38, 80, 139, 255, 39, 80, 139, 255, 39, 81, 139, 255]);
                    expect(data.data).to.be.eql(expected);
                    done();
                }, 200)
            });
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);

        });
    });

});

function readPixel(canvas, x, y) {
    resultCanvas.width = canvas.width;
    resultCanvas.height = canvas.height;
    const ctx = resultCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    return ctx.getImageData(x, y, 1, 1);
}
