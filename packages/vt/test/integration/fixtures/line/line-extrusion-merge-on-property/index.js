const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [13.41706531630723, 52.529564627058534],
                    [13.417135053741617, 52.52956625878565],
                    [13.417226248848124, 52.52954504632825],
                ]
            },
            properties: {
                ref: 1
            }
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [13.417226248848124, 52.52954504632825],
                    [13.417290621864481, 52.52956625878565],
                    [13.417635229170008, 52.529564137540376]
                ]
            },
            properties: {
                ref: 1
            }
        }
    ]
};

const material = {
    'baseColorFactor': [0.560, 0, 0, 1],
    'metallicFactor': 1,
    'roughnessFactor': 0.1,
    'reflectance': 0.5,
    'clearCoat': 0,
    'clearCoatRoughness': 0.5,
    'anisotropy': 0,
    'uvScale': [0.5, 0.5],  //纹理坐标的缩放比例
    'uvOffset': [0, 0]      //纹理坐标的偏移量
};

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'lit',
            dataConfig: {
                type: 'line-extrusion',
                altitudeScale: 1,
                altitudeProperty: 'height'
            },
            sceneConfig: {
            }
        },
        symbol: {
            material,
            lineWidth: 16,
            lineOpacity: 0.5,
            mergeOnProperty: 'ref'
        }
    }
];

module.exports = {
    style,
    data,
    view: {
        center: [13.417215439878191, 52.52954768307015],
        zoom: 19,
        bearing: 90
    }
};
