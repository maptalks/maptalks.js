const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [-1., 1.0],
                        [1., 1.0],
                        [1., -1.0],
                        [-1., -1],
                        [-1., 1]
                    ]
                ]
            },
            properties: {
                color: '#f00',
                levels: 3000
            }
        }
    ]
};
const plugin = {
    type: 'phong',
    dataConfig: {
        type: '3d-extrusion',
        altitudeProperty: 'levels',
        altitudeScale: 5,
        defaultAltitude: 0
    },
    sceneConfig: {
    },
};
const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'materialShininess': 32.0,
    'ambientStrength': 1,
    'specularStrength': 1,
    'opacity': 1.0,
    'extrusionOpacity': 0,
    'extrusionOpacityRange': [0, 1.8]
};
const style = [{
    renderPlugin: plugin,
    symbol: {
        polygonOpacity: 1,
        polygonFill: {
            type: 'identity',
            property: 'color'
        },
        material
    },
    filter: true,
}];
module.exports = {
    style,
    data: data,
    view: {
        pitch: 80,
        center: [0, 0],
        zoom: 6
    }
};
