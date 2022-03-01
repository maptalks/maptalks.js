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
            polygonFill: '#f00'
        }
    },
    {
        filter: true,
        renderPlugin: {
            type: 'icon',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            markerType: 'ellipse',
            markerWidth: 6,
            markerHeight: 6,
            markerPlacement: 'vertex'
        }
    }
];

module.exports = {
    style,
    data
};
