const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [0.0015, 0.0015],
                        [0.0015, 0.0015],
                        [0.0015, 0.0005],
                        [0.0005, 0.0005],
                        [0.0005, 0.0015]
                    ]
                ]
            },
            properties: {
                levels: 3
            }
        }
    ]
};
const plugin = {
    type: 'wireframe',
    dataConfig: {
        type: '3d-wireframe',
        altitudeProperty: 'levels',
        altitudeScale: 5,
        defaultAltitude: 0
    },
    sceneConfig: {
    },
};
const style = [
    {
        renderPlugin: plugin,
        symbol: {
            lineColor: '#000'
        }
    }

];
module.exports = {
    style,
    data,
    view: {
        'center': [0.0001774231847093688, 0.00028917934585592775],
        'zoom': 17.5,
        'pitch': 60,
        'bearing': 30.00000000000011
    },
};
