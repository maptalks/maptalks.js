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
    }
];

module.exports = {
    style,
    data,
    renderingCount: 10,
    view: {
        center: [91.14478,29.708272],
        zoom: 12,
        pitch: 20,
        bearing: 0,
    },
    colors: [
        [0, "#F0F9E9"],
        [200, "#D7EFD1"],
        [400, "#A6DCB6"],
        [650, "#8FD4BD"],
        [880, "#67C1CB"],
        [1100, "#3C9FC8"],
        [1300, "#1171B1"],
        [1450, "#085799"],
        [1600, "#084586"],
    ]
};
