const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [
            [[91.14478,29.696272], [91.14778,29.696272], [91.14778,29.690272], [91.14478,29.690272], [91.14478,29.696272]]]
        }, properties: { type: 1 } }
    ]

};

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'fill',
            dataConfig: {
                type: 'fill'
            }
        },
        symbol: {
            polygonFill: '#f00',
            polygonOpacity: 0.5
        }
    },
    {
        filter: true,
        renderPlugin: {
            type: 'terrain-flat-mask',
            dataConfig: {
                type: 'fill',
                altitudeOffset: 3500
            }
        },
        symbol: {}
    }
];

module.exports = {
    style,
    data,
    lit: true,
    renderingCount: 10,
    view: {
        center: [91.14478,29.708272],
        zoom: 12,
        pitch: 20,
        bearing: 0,
    }
};
