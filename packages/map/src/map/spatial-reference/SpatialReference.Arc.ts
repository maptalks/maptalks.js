import { isString, parseJSON } from '../../core/util';
import Ajax from '../../core/Ajax';
import { type SpatialReferenceType } from './SpatialReference';

export type ArcgisConfig = {
    tileInfo: {
        cols: number,
        rows: number,
        origin: {
            x: number
            y: number
        },
        lods: Array<{
            resolution: number
        }>
    }
    fullExtent: SpatialReferenceType['fullExtent']
}

/**
 * 解析Arcgis空间参考配置
 * @param arcConf
 * @returns
 */
function parse(arcConf: ArcgisConfig) {
    const tileInfo = arcConf['tileInfo'],
        tileSize = [tileInfo['cols'], tileInfo['rows']],
        resolutions: number[] = [],
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

/**
 * 加载Arcgis空间参考配置文件
 * @param url arcgis spatialreference json file url
 * @param cb
 * @param options
 * @returns
 */
const loadArcgis = (url: string, cb: (_, spatialRef?) => void, options: any = { 'jsonp': true }) => {
    if (isString(url) && url.substring(0, 1) !== '{') {
        Ajax.getJSON(url, (err, json) => {
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
        const spatialRef = parse(url as any);
        cb(null, spatialRef);
    }
    // return this;
};

export default loadArcgis;
