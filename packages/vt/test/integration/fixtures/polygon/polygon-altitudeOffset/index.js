const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        {
            type: 'Feature', geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0, 2000], [1., 1.0, 2000], [1., -1.0, 2000], [-1., -1, 2000], [-1., 1, 2000]],
                    [[-0.5, 0.5, 2000], [0.5, 0.5, 2000], [0.5, -0.5, 2000], [-0.5, -0.5, 2000], [-0.5, 0.5, 2000]]
                ]
            }, properties: { type: 3 }
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
                    type: 'fill',
                    altitudeOffset: 0
                },
                sceneConfig: {
                }
            },
            symbol: {
                polygonFill: '#f00'
            }
        }
    ]
};

module.exports = {
    style,
    data: data,
    view: {
        center: [0, 0],
        pitch: 50,
        zoom: 6
    }
};
