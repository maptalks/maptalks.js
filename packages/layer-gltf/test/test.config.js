/*eslint-disable no-unused-vars */
const clickPoint = new maptalks.Coordinate([0, 0]);
const center = new maptalks.Coordinate([0, 0]);
const clickContainerPoint = new maptalks.Point([200, 150]);
const url1 = 'models/cube-animation/cube.gltf', url2 = 'models/CesiumMan/CesiumMan.gltf', url3 = 'models/Duck/Duck.glb', url4 = 'models/DamagedHelmet/glTF/DamagedHelmet.gltf';
const url5 = 'models/saturn_planet/scene.gltf', url6 = 'models/cloud/cloud.glb', url7 = 'models/space/scene.gltf', url8 = 'models/matilda/scene.gltf';
const url9 = 'models/board/scene.gltf', url10 = 'models/simple_flower_loop/scene.gltf', url11 = 'models/Fox/Fox.gltf', url12 = 'models/video_countdown/scene.gltf', url13 = 'models/assmbly-sign.glb';
//顶点着色器
const vert =  `attribute vec3 POSITION;
    uniform mat4 projectionViewModel;
    void main()
    {
        gl_Position = projectionViewModel * vec4(POSITION, 1.0);
    }`;
//片元着色器
const frag = `#ifdef GL_ES
    precision mediump float;
    #endif
    void main() {
        gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    }`;

const shader = {
    vert,
    frag,
    uniforms: [
        {
            name: 'projectionViewModel',
            type: 'function',
            fn: function (context, props) {
                return maptalksgl.mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
            }
        }
    ],
    defines: {
    },
    extraCommandProps: {
    }
};

const geojson = {"type":"FeatureCollection","features": [
    {"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{}},
    {"type":"Feature","geometry":{"type":"Point","coordinates":[0,0.1]},"properties":{}},
    {"type":"Feature","geometry":{"type":"Point","coordinates":[0.1,0]},"properties":{}},
    {"type":"Feature","geometry":{"type":"Point","coordinates":[0.1,0.1]},"properties":{}},
    {"type":"Feature","geometry":{"type":"Point","coordinates":[0.1,-0.1]},"properties":{}}
]};
const sceneConfig = {
    shadow: {
        enable: false,
        opacity: 0.8,
        color: [1, 0, 0]
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
        outline: {
            enable: true
        }
    }
};

const lightConfig = {
    ambient: {
        // resource: {
        //     url: 'resources/env.hdr',
        // },
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

const MAX_ZOOM = 25;
const identitySpatialReference = {
    projection: 'identity',
    coordType: {
        code: 'utm',
        zone: 17
    },
    resolutions: (function () {
        const resolutions = [];
        for (let i = 0; i < MAX_ZOOM; i++) {
            resolutions[MAX_ZOOM - 1 - i] = Math.pow(2, i - 8);
        }
        return resolutions;
    })(),
    fullExtent: {
        top: 1000,
        left: -1000,
        bottom: -1000,
        right: 1000,
    }
};

function createMap() {
    const container = document.createElement('div');
    container.style.width = '400px';
    container.style.height = '300px';
    container.style.backgroundColor = '#000';
    document.body.appendChild(container);
    const map = new maptalks.Map(container, {
        mousemoveThrottleTime: -1,
        center,
        zoom: 17,
        lights: lightConfig
    });
    return map;
}

function removeMap(map) {
    const mapRenderer = map.getRenderer();
    mapRenderer._resizeObserver.disconnect();
    map.remove();
    document.body.innerHTML = '';
}

function pickPixel(map, x, y, width, height) {
    const px = x || map.width / 2, py = y || map.height / 2;
    const w = width || 1, h = height || 1;
    const canvas = map.getRenderer().canvas;
    const ctx = canvas.getContext("2d");
    const pixel = ctx.getImageData(px, py, w, h).data;
    return pixel;
}

function pixelMatch(expectedValue, pixelValue) {
    for (let i = 0; i < expectedValue.length; i++) {
        if (Math.abs(pixelValue[i] - expectedValue[i]) > 10) {
            return false;
        }
    }
    return true;
}

function hasColor(color) {
    if (color[0] || color[1] || color[2] || color[3]) {
        return true;
    }
    return false;
}
/*eslint-enable no-unused-vars */
