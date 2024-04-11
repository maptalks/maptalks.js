const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[91.14478,29.658272], [91.14778,29.658272], [91.14778,29.652272], [91.14478,29.652272], [91.14478,29.658272]]] }, properties: { type: 1 } },
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[91.14078,29.656272], [91.14378,29.656272], [91.14378,29.650272], [91.14078,29.650272], [91.14078,29.656272]]] }, properties: { type: 2 } }
    ]
};

const material = {
    'roughnessFactor': 0,
    'metalnessFactor': 1
};

const style = [
    {
        filter: ['==', 'type', 1],
        renderPlugin: {
            type: 'lit',
            dataConfig: {
                type: '3d-extrusion',
                altitudeScale: 1,
                defaultAltitude: 40,
            }
        },
        symbol: {
            polygonFill: '#f00',
            material
        }
    },
    {
        filter: ['==', 'type', 2],
        renderPlugin: {
            type: 'lit',
            dataConfig: {
                type: '3d-extrusion',
                altitudeScale: 1,
                defaultAltitude: 40,
            }
        },
        symbol: {
            polygonFill: '#0f0',
            material
        }
    }
];

module.exports = {
    style,
    data
};
