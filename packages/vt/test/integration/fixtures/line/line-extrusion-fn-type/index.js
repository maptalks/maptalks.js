const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-0.7, 0.5],
                    [-0.1, 0.5],
                    [0.3, 0]
                ]
            },
            properties: {
                type: 1
            }
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-1, 0.0],
                    [-0.4, 0.0],
                    [0, -0.5]
                ]
            },
            properties: {
                type: 2
            }
        }
    ]
};
const material = {
    'baseColor': [0.560 * 255, 0.570 * 255, 0.580 * 255],
    'baseColorFactor': [0.560, 0.570, 0.580, 1],
    'metallicFactor': 1,
    'roughnessFactor': 0.1,
    'reflectance': 0.5,
    'clearCoat': 0,
    // 'clearCoatNormalTexture': CLEAR_COAT_NORMAL_TEXTURE,
    'clearCoatRoughness': 0.5,
    // 'clearCoatIorChange': false,
    // 'normalTexture': 'http://localhost/maptalksgl-dev/debug/reshader/ibl/resources/rusted_iron/609-normal.jpg',
    // 'metallicRoughnessTexture': ROUGHNESS_METALLIC_TEXTURE,
    // 'baseColorTexture': 'http://localhost/maptalksgl-dev/debug/reshader/ibl/resources/not-power-of-2.jpg',
    'anisotropy': 0,
    'uvScale': [0.5, 0.5], //纹理坐标的缩放比例
    'uvOffset': [0, 0] //纹理坐标的偏移量
};
const style = [{
    filter: true,
    renderPlugin: {
        type: 'lit',
        dataConfig: {
            type: 'line-extrusion',
            altitudeScale: 1,
            defaultAltitude: 20000
        },
        sceneConfig: {}
    },
    symbol: {
        material,
        lineWidth: {
            property: 'type',
            type: 'categorical',
            stops: [
                [1, 16],
                [2, 8],
            ]
        },
        lineColor: {
            property: 'type',
            type: 'categorical',
            stops: [
                [1, '#f00'],
                [2, '#0f0'],
            ]
        },
        lineOpacity: 1
    }
}];
module.exports = {
    style,
    data: data,
    view: {
        pitch: 0,
        center: [0, 0],
        zoom: 6
    }
};
