const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [13.417135053741617, 52.52956625878565],
                    [13.417226248848124, 52.52954504632825],
                    [13.417290621864481, 52.52956625878565]
                ]
            }
        }
    ]
};

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            },
            sceneConfig: {
                // excludes : ['!has', 'levels']
            }
        },
        symbol: {
            lineOpacity: 1,
            lineWidth: 8,
            lineColor: '#f00'
        }
    },
    {
        filter: true,
        renderPlugin: {
            type: 'icon',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            markerType: 'ellipse',
            markerWidth: 6,
            markerHeight: 6,
            markerPlacement: 'vertex-last'
        }
    }
];

module.exports = {
    style,
    data,
    view: {
        center: [13.417215439878191, 52.52954768307015],
        zoom: 19,
        bearing: 90
    }
};
