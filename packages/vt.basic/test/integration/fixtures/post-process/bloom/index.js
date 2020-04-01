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
                        [-1., 1.0],
                        [1., 1.0],
                        [1., -1.0],
                        [-1., -1],
                        [-1., 1]
                    ],
                    [
                        [-0.5, 0.5],
                        [0.5, 0.5],
                        [0.5, -0.5],
                        [-0.5, -0.5],
                        [-0.5, 0.5]
                    ]
                ]
            },
            properties: {
                levels: 3000
            }
        }
    ]
};
const plugin = {
    type: 'fill',
    dataConfig: {
        type: 'fill'
    },
    sceneConfig: {
    },
};
const style = [{
    renderPlugin: plugin,
    symbol: {
        bloom: true,
        polygonOpacity: 1,
        polygonFill: '#0f0'
    },
    filter: true,
}];
module.exports = {
    style,
    data: data,
    view: {
        pitch: 70,
        bearing: 60,
        center: [0, 0],
        zoom: 6.5
    },
    sceneConfig: {
        postProcess: {
            enable: true,
            bloom: {
                enable: true
            }
        }
    }
};
