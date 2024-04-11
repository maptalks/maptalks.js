const style = [
    {
        filter: [
            'step',
            ['zoom'],
            true,
            12,
            false,
            15,
            true
        ],
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            textName: ['string', ['get', 'name']],
            textSize: 12
        }
    }
];

module.exports = {
    view: {
        zoom: 6,
        center: [0, 0]
    },
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { name: 'data 0' } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.3] }, properties: { name: 'data 1' } }
        ]
    }
};
