module.exports = {
    options: {
        dataConfig: {
            altitudeProperty: 'height',
            minHeightProperty: 'min_height',
            defaultAltitude: 20
        }
    },
    lights: {
        ambient: {
            color: [0.1, 0.1, 0.1]
        },
        directional: {
            color: [0.1, 0.1, 0.1],
            direction: [1, -1, -1],
        }
    },
    view: {
        center: [0, 0],
        zoom: 6,
        bearing: -120,
        pitch: 60
    }
};
