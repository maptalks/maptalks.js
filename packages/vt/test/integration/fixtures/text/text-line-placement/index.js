const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [13.41706531630723, 52.529564627058534],
                    [13.417135053741617, 52.52956625878565],
                    [13.417226248848124, 52.52954504632825],
                    [13.417290621864481, 52.52956625878565],
                    [13.417635229170008, 52.529564137540376]
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
            type: 'text',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            textName: 'a大秦帝国',
            textSize: 18,
            textFill: '#000',
            // textPitchAlignment: 'map',
            textPlacement: 'line',
            textMaxAngle: 190
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
