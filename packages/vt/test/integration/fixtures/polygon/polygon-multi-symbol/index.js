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
        symbol: [
            {
                polygonFill: '#f00',
                polygonOpacity: 0.5
            },
            // 为了解决z-fighting问题，tile stencil启用的第一次绘制后，stencil会被设置为0，所以下面这个样式不再起作用
            {
                polygonFill: '#0f0',
                polygonOpacity: 0.5
            }
        ]
    }
];

module.exports = {
    style,
    renderingCount: 2,
    data: data
};
