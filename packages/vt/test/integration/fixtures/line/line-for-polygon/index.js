const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        {
            type: 'Feature', geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]]
                ]
            }, properties: { type: 3 }
        }
    ]
};

const style = {
    style: [
        {
            filter: true,
            renderPlugin: {
                type: 'line',
                dataConfig: {
                    type: 'line'
                },
                sceneConfig: {
                }
            },
            symbol: {
                lineColor: '#f00',
                lineWidth: 4
            }
        },
        {
            filter: true,
            renderPlugin: {
                type: 'text',
                dataConfig: {
                    type: 'point'
                },
                sceneConfig: {
                }
            },
            symbol: {
                textName: 'hello',
                textSize: 20
            }
        }
    ]
};

module.exports = {
    style,
    data: data
};
