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
                        [13.413859783767066, 52.53186997132988],
                        [13.413568365032688, 52.53200847419052],
                        [13.413247887724538, 52.5317441323123],
                        [13.413859783767066, 52.53186997132988],
                    ]
                ]
            },
            properties: {
            }
        }
    ]
};
const plugin = {
    type: 'lit',
    dataConfig: {
        'type': '3d-extrusion',
        'altitudeProperty': 'height',
        'minHeightProperty': null,
        'altitudeScale': 1,
        'defaultAltitude': 20,
        'topThickness': 2,
        'top': true,
        'side': true
    },
    sceneConfig: {},
};
const material = {
    'baseColorFactor': [1, 1, 1, 1],
    'roughnessFactor': 0,
    'metalnessFactor': 1,
    'outputSRGB': 0
};
const style = [{
    renderPlugin: plugin,
    symbol: {
        polygonOpacity: 1,
        polygonFill: '#f00',
        material
    },
    filter: true,
}];
module.exports = {
    style,
    containerWidth: 512,
    containerHeight: 512,
    data: data,
    view: {
        pitch: 60,
        center: [13.413801423921086, 52.53200476527732],
        zoom: 17
    }
};
