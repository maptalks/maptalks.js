const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        {
            type: 'Feature', geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]]
                ]
            }, properties: { levels: 3 }
        }
    ]
};

const plugin = {
    type: 'lit',
    dataConfig: {
        type: '3d-extrusion',
        altitudeProperty: 'levels',
        altitudeOffset: 50000,
        defaultAltitude: 0
    },
    sceneConfig: {},
};
const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 1,
    'outputSRGB': 0
};

// 因为修改 maptalks/issues#202 带来的一个连锁bug
// 复现条件是：必须叠加一个3d-extrusion，必须开启后处理，必须开启collision
// 这时文字就不会绘制了
// 该用例用于验证该bug
const style = [
    {
        renderPlugin: plugin,
        symbol: {
            polygonOpacity: 1,
            polygonFill: '#f00',
            material
        },
        filter: true,
    },
    {
        filter: true,
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: true,
                fading: false
            }
        },
        symbol: {
            textName: 'hellooooo',
            textSize: 24
        }
    }
];

module.exports = {
    style,
    data,
    view: {
        center: [0, 0],
        zoom: 5
    },
    // collisionScope: 'map',
    renderingCount: 3,
    groupSceneConfig: {
        postProcess: {
            enable: true,
            bloom: { enable: true }
        }
    }
};
