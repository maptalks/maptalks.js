const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        {
            type: 'Feature', geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]],
                    [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5]]
                ]
            }, properties: { type: 3 }
        }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'fill',
            dataConfig: {
                type: 'fill'
            },
            sceneConfig: {
            }
        },
        symbol: {
            polygonFill: {
                property: 'type',
                type: 'categorical',
                default: '#000',
                stops: [
                    [3, { type: 'interval', stops: [[5, '#f00'], [12, '#00f']] }]
                ]
            },
            polygonOpacity: {
                property: 'type',
                type: 'categorical',
                default: 1,
                stops: [
                    [3, { stops: [[1, 0], [20, 1]] }]
                ]
            }
        }
    }
];

module.exports = {
    style,
    data: data
};
