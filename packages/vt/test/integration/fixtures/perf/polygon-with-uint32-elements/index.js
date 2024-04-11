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

const polygon = data.features[0];
for (let i = 0; i < 8000; i++) {
    data.features.push(polygon);
}

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
            polygonFill: '#f00',
            polygonOpacity: 1
        }
    }
];

module.exports = {
    style,
    data: data,
    renderingCount: 240,
    timeout: 5000
};
