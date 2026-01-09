const path = require('path');
const assert = require('assert');
const { readPixel } = require('../common/Util');
const maptalks = require('maptalks');
const { GeoJSONVectorTileLayer } = require('../../dist/maptalks.vt.gpu.js');
const { GroupGLLayer } = require('@maptalks/gpu');

const mapRenderer = window.mapRenderer;

maptalks.Map.mergeOptions({
    renderer: mapRenderer || 'gl',
    preserveGpuDrawingBuffer: true
});

const DEFAULT_VIEW = {
    center: [0, 0],
    zoom: 6,
    pitch: 0,
    bearing: 0,
    devicePixelRatio: 1,
    lights: {
        ambient: {
            color: [0.1, 0.1, 0.1],
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
                    // [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5]]
                ]
            }, properties: {
                levels: 3
            }
        }
    ]
};

describe('lights specs', () => {
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

    it('should can update ambient lights', done => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
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
                enable: false,
                antialias: {
                    enable: true
                },
                taa: {
                    enable: false
                }
            }
        };
        let groupLayer = new GroupGLLayer('group', [layer], { sceneConfig });
        function updateLights() {
            const lights = JSON.parse(JSON.stringify(DEFAULT_VIEW.lights));
            lights.ambient.resource = {
                url: path.resolve(__dirname, 'resources', 'hdr', 'Road_to_MonumentValley_Env.hdr'),
                sh: [0.6877259000099303, 0.8539329364623202, 1.4126619725648806, 0.00606148538698232, 0.017150573368753863, 0.030688680472048622, 0.010893808129897641, -0.09884309069236422, -0.18956184805724957, -0.0070474141192855555, -0.05189770079691109, -0.10617986665966885, -0.006447490508065165, -0.008773355457011078, -0.013252606985474272, 0.03660232269686761, 0.03243064039376016, 0.03708477097796142, -0.011488887494419585, -0.01683200847128199, -0.023906901987082382, -0.22997307901316236, -0.24825478442950713, -0.3598204464516659, -0.10771811663980735, -0.1079402777323572, -0.13788615659514636],
                prefilterCubeSize: 64
            };
            lights.ambient.hsv = [0.5, 0.5, 0.5];
            map.setLights(lights);
        }
        let count = 0;
        map.on('updatelights', () => {
            count++;
        });
        let renderCount = 0;
        let doneCalled = false;
        const readColor = () => {
            const renderer = map.getRenderer();
            const x = renderer.canvas.width;
            const y = renderer.canvas.height;
            const pixel = readPixel(layer.getRenderer().canvas, x / 2, y / 2);
            return pixel;
        }
        groupLayer.on('layerload', () => {
            if (count > 0) {
                renderCount++;
                const rendend = renderCount >= 2;

                if (count === 2 && rendend && !doneCalled) {
                    //第一次更新环境光的颜色

                    setTimeout(() => {
                        assert.deepEqual(readColor(), [161, 0, 110, 255]);
                        doneCalled = true;
                        done();
                    }, 2000);
                } else if (count === 1 && rendend) {
                    //更新环境光后的颜色
                    setTimeout(() => {
                        assert.deepEqual(readColor(), [105, 138, 181, 255]);
                        updateLights();
                    }, 2000);

                }
            }

        });
        groupLayer.addTo(map);
        const lights = JSON.parse(JSON.stringify(DEFAULT_VIEW.lights));
        lights.ambient.resource = {
            url: path.resolve(__dirname, 'resources', 'hdr', 'Etnies_Park_Center_Env.hdr'),
            sh: [0.7234542129672008, 0.9397862887230196, 1.22843655695912, 0.010534878879581985, 0.034769285791027706, 0.06448184999938876, -0.06759909480060484, -0.09869123898601936, -0.1398909805322744, 0.037917448127617104, 0.044145518950502574, 0.052161565224211004, -0.05540996219175423, -0.07519931911949429, -0.09441696517808086, -0.00327271018175432, -0.0023439780115424727, -0.002093085577643653, -0.00367912539071978, -0.008743319446932732, -0.016286010489517336, 0.03983347600932419, 0.05143911351768933, 0.07789561006349058, 0.0369636363584139, 0.04249575374608029, 0.046124531855322344],
            prefilterCubeSize: 64
        };
        map.setLights(lights);
    }).timeout(10000);


    it('should can compute sh correctly, maptalks/issues#777', done => {
        const layer = new GeoJSONVectorTileLayer('gvt', {
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
                enable: false,
                antialias: {
                    enable: true
                },
                taa: {
                    enable: false
                }
            }
        };
        const groupLayer = new GroupGLLayer('group', [layer], { sceneConfig });
        groupLayer.addTo(map);
        const lights = JSON.parse(JSON.stringify(DEFAULT_VIEW.lights));
        lights.ambient.resource = {
            url: path.resolve(__dirname, 'resources', 'hdr', 'Road_to_MonumentValley_Env.hdr'),
            prefilterCubeSize: 64
        };
        map.setLights(lights);
        setTimeout(() => {
            const sh = map.getLightManager().getAmbientResource().sh;
            const expected = [0.1857779438748162, 0.23044854317498942, 0.38067857279719863, 0.0016592956581294063, 0.004635294816261385, 0.008266099615065012, 0.002866590443799129, -0.026595988956341732, -0.05098371013061076, -0.001843063147042095, -0.014115347735452213, -0.029124911366335653, -0.0017593123065308114, -0.002385430378687236, -0.003594342249707362, 0.009928662170201576, 0.008795355067087753, 0.010057703612211824, -0.00311564826722009, -0.004547663806441884, -0.006448164974472681, -0.061724657767500676, -0.06658574345219256, -0.09639425342332608, -0.028892429870549245, -0.028934130470114977, -0.03693704859487598];
            assert.deepEqual(sh, expected);
            done();
        }, 3000);
    });
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
            'baseColorFactor': [1, 1, 1, 1],
            'metallicFactor': 1,
            'roughnessFactor': 0,
            // 'reflectance': 0.5,
            // 'clearCoat': 0,
            // // 'clearCoatNormalTexture': CLEAR_COAT_NORMAL_TEXTURE,
            // 'clearCoatRoughness': 0.5,
            // // 'clearCoatIorChange': false,
            // 'normalTexture': path.resolve(__dirname, 'resources', '609-normal.jpg'),
            // // 'metallicRoughnessTexture': ROUGHNESS_METALLIC_TEXTURE,
            // 'baseColorTexture': path.resolve(__dirname, 'resources', '609-normal.jpg'),
            // 'anisotropy': 0,
            // 'uvScale': [0.5, 0.5],  //纹理坐标的缩放比例
            // 'uvOffset': [0, 0]      //纹理坐标的偏移量
        };
    }
    return null;
}
