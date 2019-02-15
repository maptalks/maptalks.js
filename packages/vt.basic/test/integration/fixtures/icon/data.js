// zoom     px      coordinate
//  6       300      3.29

module.exports = {
    'point' : {
        type : 'FeatureCollection',
        features : [
            { type : 'Feature', geometry : { type : 'Point', coordinates : [0, 0] }, properties : { type : 1 }}
        ]
    },
    'line' : {
        type : 'FeatureCollection',
        features : [
            { type : 'Feature', geometry : { type : 'LineString', coordinates : [[0, 0], [2, 0]] }, properties : { type : 1 }}
        ]
    }
};
