const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        // {
        //     type: 'Feature', geometry: {
        //         type: 'Polygon', coordinates: [
        //             [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]],
        //             [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5]]
        //         ]
        //     }, properties: { type: 3 }
        // },
        {
            type: 'Feature', geometry: {
                type: 'Polygon', coordinates: [
                    [[-1.2, 0.8], [0.8, 0.8], [0.8, -1.2], [-1.2, -1.2], [-1.2, 0.8]],
                    [[-0.7, 0.3], [0.3, 0.3], [0.3, -0.7], [-0.7, -0.7], [-0.7, 0.3]]
                ]
            }, properties: { type: 4 }
        }
    ]
};

const style = {
    background: {
        enable: true,
        color: [0, 1, 0, 1],
        opacity: 0.5
    },
    style: [
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
                visible: {
                    type: 'categorical',
                    property: 'type',
                    stops: [
                        [3, {
                            type: 'interval',
                            stops: [
                                [3, false],
                                [5, false],
                                [7, false]
                            ]
                        }],
                        [4, {
                            type: 'interval',
                            stops: [
                                [3, false],
                                [5, true],
                                [9, false]
                            ]
                        }]
                    ]
                },
                polygonFill: {
                    type: 'categorical',
                    property: 'type',
                    stops: [
                        [3, '#f00'],
                        [4, '#00f']
                    ]
                }
            }
        }
    ]
};

module.exports = {
    style,
    data: data
};
