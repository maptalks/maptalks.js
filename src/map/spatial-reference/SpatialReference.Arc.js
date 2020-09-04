import { isString, parseJSON } from '../../core/util';
import Ajax from '../../core/Ajax';
import SpatialReference from './SpatialReference';

function parse(arcConf) {
    const tileInfo = arcConf['tileInfo'],
        tileSize = [tileInfo['cols'], tileInfo['rows']],
        resolutions = [],
        lods = tileInfo['lods'];
    for (let i = 0, len = lods.length; i < len; i++) {
        resolutions.push(lods[i]['resolution']);
    }
    const fullExtent = arcConf['fullExtent'],
        origin = tileInfo['origin'],
        tileSystem = [1, -1, origin['x'], origin['y']];
    delete fullExtent['spatialReference'];
    return {
        'spatialReference': {
            'resolutions': resolutions,
            'fullExtent': fullExtent
        },
        'tileSystem': tileSystem,
        'tileSize': tileSize
    };
}

SpatialReference.loadArcgis = function (url, cb, options = { 'jsonp': true }) {
    if (isString(url) && url.substring(0, 1) !== '{') {
        Ajax.getJSON(url, function (err, json) {
            if (err) {
                cb(err);
                return;
            }
            const spatialRef = parse(json);
            cb(null, spatialRef);
        }, options);
    } else {
        if (isString(url)) {
            url = parseJSON(url);
        }
        const spatialRef = parse(url);
        cb(null, spatialRef);

    }
    return this;
};
