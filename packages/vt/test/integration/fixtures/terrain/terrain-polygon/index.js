const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[91.14478,29.658272], [91.14778,29.658272], [91.14778,29.652272], [91.14478,29.652272], [91.14478,29.658272]]] }, properties: { type: 1 } }
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
    }
];

module.exports = {
    style,
    data
};
