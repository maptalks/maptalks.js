const resultCanvas = document.createElement('canvas');

describe('gl tests', () => {
    let container, map;
    const maskCoordinate = [[91.09087832763669, 29.694663476850423],
        [91.08744510009763, 29.621270449579555],
        [91.18597873046872, 29.62216580885527],
        [91.18700869873044, 29.699733374620422]];
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
            let hit = false;
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.on('layerload', () => {
                        if (!hit) {
                            const altitude = group.queryTerrain(map.getCenter());
                            if (!altitude[0]) {
                                return;
                            }
                            hit = true;
                            expect(altitude).to.be.eql([3652.620361328125, 1]);
                            done();
                        }

                    });

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
        it('remove and add skinLayers', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: './fixtures/tiles/tile-green-256.png',
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
            const canvas = map.getRenderer().canvas;
            const ctx = canvas.getContext('2d');
            let count = 0;
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.on('layerload', () => {
                        count++;
                        if (count === 1) {
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 0, '1': 255, '2': 0, '3': 255 } });
                            group.removeLayer('base');
                        } else if (count === 2) {
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 0, '1': 255, '2': 0, '3': 255 } });
                            group.addLayer(skinLayers[0]);
                        } else if (count === 3) {
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 0, '1': 255, '2': 0, '3': 255 } });
                            done();
                        }
                    });
                });
            });
            group.addTo(map);
        });

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
                    group.on('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { 0: 136, 1: 140, 2: 141, 3: 255 } });
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
                        expect(pixel).to.be.eql({ data: { '0': 136, '1': 140, '2': 141, '3': 255 } });
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
                        expect(pixel).to.be.eql({ data: { '0': 136, '1': 140, '2': 141, '3': 255 }});
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
                        expect(pixel).to.be.eql({ data: { '0': 136, '1': 140, '2': 141, '3': 255 } });
                        const altitude = group.queryTerrain(map.getCenter());
                        expect(altitude).to.be.eql([3652.620361328125, 1]);
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
                    let hit = false;
                    group.on('layerload', () => {
                        if (!hit) {
                            const canvas = map.getRenderer().canvas;
                            const ctx = canvas.getContext('2d');
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                            if (pixel.data['0'] !== 127) {
                                return;
                            }
                            hit = true;
                            expect(pixel).to.be.eql({ data: { '0': 127, '1': 127, '2': 127, '3': 255 } });
                            done();
                        }

                    });
                });
            });
            group.addTo(map);
        });

        it('update terrain material by setTerrain', done => {
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
                    let count = 0;
                    group.on('layerload', () => {
                        count++;
                        if (count === 1) {
                            terrain.material.baseColorFactor = [1, 0, 0, 1];
                            group.setTerrain(terrain);
                        } else if (count === 2) {
                            const canvas = map.getRenderer().canvas;
                            const ctx = canvas.getContext('2d');
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 127, '1': 28, '2': 28, '3': 255 } });
                            done();
                        }
                    });
                });
            });
            group.addTo(map);
        });

        it('update terrain material by updateTerrainMaterial', done => {
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
                shader: 'lit'
            };
            const material = {
                baseColorFactor: [1, 0, 0, 1],
                roughnessFactor: 0.9,
                metallicFactor: 0
            };
            const group = new maptalks.GroupGLLayer('group', [], { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    let count = 0;
                    group.on('layerload', () => {
                        count++;
                        if (count === 1) {
                            group.updateTerrainMaterial(material);
                        } else if (count === 2) {
                            const canvas = map.getRenderer().canvas;
                            const ctx = canvas.getContext('2d');
                            const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                            expect(pixel).to.be.eql({ data: { '0': 127, '1': 28, '2': 28, '3': 255 } });
                            const exportMat = group.toJSON().options.terrain.material;
                            expect(material).to.be.eql(exportMat);
                            done();
                        }
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
                        expect(pixel).to.be.eql({ data: { '0': 121, '1': 125, '2': 126, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('switch shader for terrain', done => {
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
                        let count1 = 0;
                        group.on('layerload', () => {
                            count1++;
                            if (count1 === 3) {
                                expect(count).to.be.eql(2);
                                const canvas = map.getRenderer().canvas;
                                const ctx = canvas.getContext('2d');
                                const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                                expect(pixel).to.be.eql({ data: { '0': 136, '1': 140, '2': 141, '3': 255 } });
                                done();
                            }
                        });
                        expect(count).to.be.eql(1);
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 7, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 139, '1': 143, '2': 144, '3': 255 } });
                        group.getTerrainLayer().options.shader = 'default';
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain of cesium', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                spatialReference: {
                    projection: 'EPSG:4326'
                },
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    tileSystem : [1, -1, -180, 90],
                    fadeAnimation: false,
                    urlTemplate: '/fixtures/tianditu-terrain/{z}/{x}/{y}.jpg',
                })
            ];
            const terrain = {
                zoomOffset: -1,
                fadeAnimation: false,
                maxAvailableZoom: 14,
                type: 'cesium',
                urlTemplate: '/fixtures/cesium-terrain/{z}/{x}/{y}.terrain',
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
                        expect(pixel).to.be.eql({ data: { '0': 90, '1': 92, '2': 95, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        // function fetchTerrain(x, y, z) {
        //     const headers = {
        //         'Accept-Encoding': 'gzip, deflate, br'
        //     };
        //     const options = {
        //         method: 'GET',
        //         referrer: location.origin,
        //         headers
        //     };
        //     const url = `https://t4.tianditu.gov.cn/mapservice/swdx?T=elv_c&tk=8d01c39a7595da62e1a32a1e109584a3&x=${x}&y=${y}&l=${z}`;
        //     fetch(url, options)
        //     .then(resp => {
        //         return resp.blob();
        //     })
        //     .then(blob => {
        //         const elementA = document.createElement('a');
        //         document.body.appendChild(elementA);
        //         elementA.setAttribute('href', window.URL.createObjectURL(blob));
        //         elementA.setAttribute('download', y + '.terrain');
        //         elementA.click();
        //         document.body.removeChild(elementA);
        //     });
        // }

        it('terrain of tianditu', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                spatialReference: {
                    projection: 'EPSG:4326'
                },
                zoom: 11
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    tileSystem : [1, -1, -180, 90],
                    fadeAnimation: false,
                    urlTemplate: '/fixtures/tianditu-terrain/{z}/{x}/{y}.jpg',
                })
            ];
            const terrain = {
                // debug: true,
                maxAvailableZoom: 12,
                fadeAnimation: false,
                type: 'tianditu',
                urlTemplate: '/fixtures/tianditu-terrain/{z}/{x}/{y}.terrain',
                tileStackDepth: 0
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2 + 1, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 95, '1': 100, '2': 103, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('terrain with offset skin at zoom 12', done => {
            map = new maptalks.Map(container, {
                center: [94.50812103, 29.45595163],
                zoom: 14
            });
            const targetCoord = new maptalks.Coordinate(0, 0);
            const POINT0 = new maptalks.Coordinate(0, 0);
            const POINT1 = new maptalks.Coordinate(0, 0);
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    offset: function(z, center) {
                        center = center || map.getCenter();
                        const c = maptalks.CRSTransform.transform(center.toArray(), "GCJ02", "WGS84");
                        targetCoord.set(c[0], c[1]);
                        const offset = map
                            .coordToPoint(center, z, POINT0)
                            ._sub(map.coordToPoint(targetCoord, z, POINT1));
                        return offset._round().toArray();
                    },
                    urlTemplate: '/fixtures/tiles/tile-green-256.png',
                })
            ];
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.pngraw',
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
                        expect(pixel).to.be.eql({ data: { '0': 0, '1': 255, '2': 0, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });
    });

    context('skybox tests', () => {
        it('support only ambient, maptalks/issues#360', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12,
                lights: {
                    ambient: {
                        resource: {
                            url: './resources/env.hdr',
                            prefilterCubeSize: 32
                        }
                    }
                }
            });
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
                    done();
                }, 200)
            });
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);
        });
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
                    const expected = new Uint8ClampedArray([238, 237, 205, 255, 236, 235, 203, 255, 234, 234, 201, 255, 233, 232, 200, 255, 231, 231, 199, 255, 238, 239, 207, 255, 236, 237, 205, 255, 235, 236, 204, 255, 234, 235, 203, 255, 233, 234, 203, 255, 238, 241, 209, 255, 236, 239, 207, 255, 235, 238, 207, 255, 235, 238, 207, 255, 235, 238, 206, 255, 238, 243, 211, 255, 236, 241, 209, 255, 236, 241, 209, 255, 236, 241, 210, 255, 237, 241, 210, 255, 236, 244, 214, 255, 235, 243, 213, 255, 235, 242, 213, 255, 235, 242, 213, 255, 235, 242, 213, 255]);
                    expect(data.data).to.be.eql(expected);
                    done();
                }, 200)
            });
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);

        });

        it('support skybox with 6 images with negative and positive directions', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const lights = {
                ambient: {
                    resource: {
                        // url: './resources/venice_sunset_2k.hdr',
                        url: {
                            pz: '/resources/skybox_bridge/posx.jpg',
                            nz: '/resources/skybox_bridge/negx.jpg',
                            px: '/resources/skybox_bridge/posy.jpg',
                            nx: '/resources/skybox_bridge/negy.jpg',
                            py: '/resources/skybox_bridge/posz.jpg',
                            ny: '/resources/skybox_bridge/negz.jpg'
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
                    const expected = new Uint8ClampedArray([238, 237, 205, 255, 236, 235, 203, 255, 234, 234, 201, 255, 233, 232, 200, 255, 231, 231, 199, 255, 238, 239, 207, 255, 236, 237, 205, 255, 235, 236, 204, 255, 234, 235, 203, 255, 233, 234, 203, 255, 238, 241, 209, 255, 236, 239, 207, 255, 235, 238, 207, 255, 235, 238, 207, 255, 235, 238, 206, 255, 238, 243, 211, 255, 236, 241, 209, 255, 236, 241, 209, 255, 236, 241, 210, 255, 237, 241, 210, 255, 236, 244, 214, 255, 235, 243, 213, 255, 235, 242, 213, 255, 235, 242, 213, 255, 235, 242, 213, 255]);
                    expect(data.data).to.be.eql(expected);
                    done();
                }, 200)
            });
            const group = new maptalks.GroupGLLayer('group', [], { sceneConfig });
            group.addTo(map);

        });
    });


    context('mask', () => {
        it('ClipInsideMask', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const mask = new maptalks.ClipInsideMask(maskCoordinate);
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                masks: [mask]
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
                        expect(pixel).to.be.eql({ data: { '0': 0, '1': 0, '2': 0, '3': 0 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('ClipOutsideMask', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const mask = new maptalks.ClipOutsideMask(maskCoordinate);
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                masks: [mask]
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
                        expect(pixel).to.be.eql({ data: { '0': 136, '1': 140, '2': 141, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('FlatInsideMask', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            map.setPitch(45);
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const mask = new maptalks.FlatInsideMask(maskCoordinate, {
                flatHeight: 500
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                masks: [mask]
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
                        expect(pixel).to.be.eql({ data: { '0': 94, '1': 93, '2': 80, '3': 255 }});
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('FlatOutsideMask', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            map.setPitch(45);
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const mask = new maptalks.FlatOutsideMask(maskCoordinate, {
                flatHeight: 500
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                masks: [mask]
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
                        expect(pixel).to.be.eql({ data: { '0': 163, '1': 161, '2': 144, '3': 255 } });
                        done();
                    });
                });
            });
            group.addTo(map);
        });

        it('ColorMask', done => {
            map = new maptalks.Map(container, {
                center: [91.14478,29.658272],
                zoom: 12
            });
            map.setPitch(20);
            const skinLayers = [
                new maptalks.TileLayer('base', {
                    urlTemplate: '/fixtures/google-256/{z}/{x}/{y}.jpg'
                })
            ];
            const mask = new maptalks.ColorMask(maskCoordinate, {
                symbol: {
                    polygonFill: '#0f0',
                    polygonOpacity: 0.8
                }
            });
            const terrain = {
                fadeAnimation: false,
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
                tileStackDepth: 0,
                masks: [mask]
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
                        expect(pixel).to.be.eql({ data: { '0': 26, '1': 229, '2': 24, '3': 255 } });
                        done();
                    });
                });
            });
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
