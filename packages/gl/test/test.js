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
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp'
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    const altitude = group.queryTerrain(map.getCenter());
                    expect(altitude).to.be.eql(4442.0751953125);
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
                        enable: true,
                        taa: true
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
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp'
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
                        expect(pixel).to.be.eql({ data: { '0': 151, '1': 155, '2': 156, '3': 255 } });
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
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp',
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
                        expect(pixel).to.be.eql({ data: { '0': 150, '1': 154, '2': 158, '3': 63 } });
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
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp'
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers);
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = group.getRenderer().canvas;
                        const pixel = readPixel(canvas, canvas.width / 2, canvas.height / 2);
                        expect(pixel).to.be.eql({ data: { '0': 151, '1': 155, '2': 156, '3': 255 } });
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
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp'
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
                type: 'mapbox',
                tileSize: 512,
                spatialReference: 'preset-vt-3857',
                urlTemplate: '/fixtures/mapbox-terrain/{z}/{x}/{y}.webp'
            }
            const group = new maptalks.GroupGLLayer('group', skinLayers, { terrain });
            group.once('terrainlayercreated', () => {
                const terrainLayer = group.getTerrainLayer();
                terrainLayer.once('terrainreadyandrender', () => {
                    group.once('layerload', () => {
                        const canvas = map.getRenderer().canvas;
                        const ctx = canvas.getContext('2d');
                        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
                        expect(pixel).to.be.eql({ data: { '0': 151, '1': 155, '2': 156, '3': 255 } });
                        const altitude = group.queryTerrain(map.getCenter());
                        expect(altitude).to.be.eql(4442.0751953125);
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
