const path = require('path');
const assert = require('assert');
const { readPixel, compareExpected } = require('../common/Util');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.js');
const { GroupGLLayer } = require('@maptalks/gl');


const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0,
    devicePixelRatio: 1,
    lights: {
        ambient: {
            // url: path.resolve(__dirname, 'resources', 'hall.hdr'),
            // luminance: 12000
            color: [0.1, 0.1, 0.1]
        },
        directional: {
            color: [1, 1, 1],
            direction: [0, 1, 1],
            intensity: 30000
        }
    }
};

const DATA = {
    type: 'FeatureCollection',
    features: [
        // { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties: { type: 3 }}
        {
            type: 'Feature', geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]],
                    [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5]]
                ]
            }, properties: {
                levels: 3
            }
        }
    ]
};

describe('postprocess specs', () => {
    let container, map;
    before(() => {
        container = document.createElement('div');
        container.style.width = '512px';
        container.style.height = '512px';
        document.body.appendChild(container);
    });

    beforeEach(() => {
        map = new maptalks.Map(container, DEFAULT_VIEW);
    });

    afterEach(() => {
        map.remove();
    });

    it.skip('should can turn on taa', done => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            tileLimitPerFrame: 0,
            data: DATA,
            style: [
                {
                    filter: true,
                    renderPlugin: getRenderPlugin('lit'),
                    symbol: {
                        material: getMaterial('lit')
                    }
                }
            ]
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                antialias: {
                    enable: true,
                    taa: false
                }
            }
        };
        let groupLayer = new GroupGLLayer('group', [layer], { sceneConfig });
        groupLayer.once('postprocessend', () => {
            sceneConfig.postProcess.antialias.taa = true;
            groupLayer.once('taaend', () => {
                done();
            });
            groupLayer.setSceneConfig(sceneConfig);
        });
        groupLayer.addTo(map);
    });

    it.skip('should can draw correctly with taa', done => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            tileLimitPerFrame: 0,
            data: DATA,
            style: [
                {
                    filter: true,
                    renderPlugin: getRenderPlugin('lit'),
                    symbol: {
                        material: getMaterial('lit')
                    }
                }
            ]
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
        let groupLayer = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        groupLayer.on('taaend', () => {
            count++;
            if (count === 1) {
                const canvas = map.getRenderer().canvas;
                const expectedPath = path.join(__dirname, 'fixtures', 'taa', 'beforeSetStyle', 'expected.png');
                compareExpected(canvas, { expectedPath });
                layer.setStyle([
                    {
                        renderPlugin: {
                            dataConfig: {
                                type: 'fill',
                            },
                            sceneConfig: {},
                            type: 'fill',
                        },
                        symbol: {
                            polygonFill: [1, 0, 0, 1],
                            polygonOpacity: 1
                        },
                        filter: true,
                    },
                ]);
            } else if (count === 2) {
                const canvas = map.getRenderer().canvas;
                const expectedPath = path.join(__dirname, 'fixtures', 'taa', 'setStyle', 'expected.png');
                compareExpected(canvas, { expectedPath }, done);
            }
        });
        groupLayer.addTo(map);
    });

    it.skip('fuzhenn/maptalks-ide#2793,  retire taa when switching ssr', done => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: DATA,
            style: [
                {
                    filter: true,
                    renderPlugin: getRenderPlugin('lit'),
                    symbol: {
                        ssr: true,
                        material: getMaterial('lit')
                    }
                }
            ]
        });
        const sceneConfig = {
            postProcess: {
                enable: true,
                antialias: {
                    enable: true,
                    taa: true
                },
                ssr: {
                    enable: true
                }
            }
        };
        let groupLayer = new GroupGLLayer('group', [layer], { sceneConfig });
        let count = 0;
        groupLayer.on('taaend', () => {
            count++;
            if (count === 1) {
                layer.updateSymbol(0, { ssr: false });
            } else if (count === 3) {
                const canvas = map.getRenderer().canvas;
                const expectedPath = path.join(__dirname, 'fixtures', 'taa', 'ssr', 'expected.png');
                compareExpected(canvas, { expectedPath }, done);
            }
        });
        groupLayer.addTo(map);
    });


    it.skip('should can update symbol', done => {
        assertStyle(layer => {
            layer.updateSymbol(0, {
                material: {
                    normalTexture: null
                }
            });
            done();
        }, [40, 0], [69, 64, 167, 255], [
            {
                filter: true,
                renderPlugin: getRenderPlugin('lit'),
                symbol: {
                    material: getMaterial('lit')
                }
            }
        ]);
    }).timeout(30000);

    function assertStyle(done, offset, expectedColor, style) {
        const layer = new GeoJSONVectorTileLayer('gvt', {
            data: DATA,
            style
        });
        let count = 0;
        const renderer = map.getRenderer();
        const x = renderer.canvas.width;
        const y = renderer.canvas.height;
        layer.on('layerload', () => {
            count++;
            if (count === 4) {
                const pixel = readPixel(layer.getRenderer().canvas, x / 2 + offset[0], y / 2 + offset[1]);
                //开始是红色
                assert.deepEqual(pixel, expectedColor);
                done(layer);
            }
        });
        layer.addTo(map);
    }
});

function getRenderPlugin(type) {
    return {
        type,
        dataConfig: {
            type: '3d-extrusion',
            altitudeProperty: 'levels',
            altitudeScale: 5,
            defaultAltitude: 1,
            normal: true,
            uv: true,
            uvSize: [128 / 50, 128 / 50],
            tangent: true
        },
        sceneConfig: {
            animation: false
        }
    };
}

function getMaterial(type) {
    if (type === 'lit') {
        return {
            'baseColorFactor': [0.560, 0.570, 0.580, 1],
            'metallicFactor': 0,
            'roughnessFactor': 0.7,
            'reflectance': 0.5,
            'clearCoat': 0,
            // 'clearCoatNormalTexture': CLEAR_COAT_NORMAL_TEXTURE,
            'clearCoatRoughness': 0.5,
            // 'clearCoatIorChange': false,
            'normalTexture': path.resolve(__dirname, 'resources', '609-normal.jpg'),
            // 'metallicRoughnessTexture': ROUGHNESS_METALLIC_TEXTURE,
            'baseColorTexture': path.resolve(__dirname, 'resources', '609-normal.jpg'),
            'anisotropy': 0,
            'uvScale': [0.5, 0.5],  //纹理坐标的缩放比例
            'uvOffset': [0, 0]      //纹理坐标的偏移量
        };
    }
    return null;
}
