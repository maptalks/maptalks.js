import { isString } from '../../core/util';
import Ajax from '../../core/Ajax';
import SpatialReference from './SpatialReference';


function getProjection(projection) {
    let prj = (projection.indexOf('EPSG') > -1 ? projection : 'EPSG:' + projection);
    prj = strReplace(prj, [
        ['4490', '4326'],
        ['102100', '3857'],
        ['900913', '3857']
    ]);
    return prj;
}

function strReplace(str, repArray = []) {
    repArray.forEach(rep => {
        const [template, value] = rep;
        str = str.replace(template, value);
    });
    return str;
}

function parseWMTSXML(str, requestUrl, options) {
    //IE test success
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(str, 'text/xml');
    const content = xmlDoc.querySelectorAll('Contents')[0];
    if (!content) {
        return [];
    }
    const layers = content.getElementsByTagName('Layer');
    if (!layers.length) {
        return [];
    }
    const TileMatrixSets = [];
    for (let i = 0, len = content.childNodes.length; i < len; i++) {
        if (content.childNodes[i].nodeName === 'TileMatrixSet') {
            TileMatrixSets.push(content.childNodes[i]);
        }
    }
    if (!TileMatrixSets.length) {
        return [];
    }
    const result = [];
    for (let i = 0, len = layers.length; i < len; i++) {
        const layer = layers[i];
        let style = layer.querySelectorAll('Style')[0];
        if (style) {
            style = style.getElementsByTagName('ows:Identifier')[0];
            if (style) {
                style = style.textContent;
            }
        }
        let layerName = layer.getElementsByTagName('ows:Identifier')[0];
        if (layerName) {
            layerName = layerName.textContent;
        }
        const resourceURL = layer.querySelectorAll('ResourceURL')[0];
        let url = '';
        if (resourceURL) {
            url = resourceURL.attributes.template.value;
        }
        const { resolutions, tileSize, tileSystem, projection, TileMatrixSet } = parseTileMatrixSet(TileMatrixSets, i, options);
        //not find ServerURL
        if (!url.length) {
            url = requestUrl.substr(0, requestUrl.lastIndexOf('?'));
            url += '?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER={LAYER}&STYLE={Style}&TILEMATRIXSET={TileMatrixSet}&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}';
        }
        const urlTemplate = strReplace(url, [
            ['{LAYER}', layerName],
            ['{Layer}', layerName],
            ['{layer}', layerName],
            ['{STYLE}', style],
            ['{Style}', style],
            ['{style}', style],
            ['{TileMatrixSet}', TileMatrixSet],
            ['{TileMatrix}', '{z}'],
            ['{TileRow}', '{y}'],
            ['{TileCol}', '{x}'],
        ]);
        result.push({
            tileSize,
            tileSystem,
            spatialReference: {
                resolutions,
                projection
            },
            urlTemplate,
            info: {
                layerName, TileMatrixSet, style, tileSize, tileSystem, resolutions, projection, urlTemplate
            }
        });
    }
    return result;
}

function parseTileMatrixSet(TileMatrixSets, index, options = {}) {
    const TileMatrixSet = TileMatrixSets[index];
    const TileMatrixs = TileMatrixSet.getElementsByTagName('TileMatrix');
    const resolutions = [], tileSystem = [], tileSize = [];
    let projection, tset;
    if (!projection) {
        const supportedCRS = TileMatrixSet.getElementsByTagName('ows:SupportedCRS')[0];
        if (supportedCRS) {
            projection = supportedCRS.textContent;
            projection = projection.split('EPSG')[1];
            while (projection.indexOf(':') > -1) {
                projection = projection.replace(':', '');
            }
            projection = getProjection(projection);
        }
    }
    if (!tset) {
        tset = TileMatrixSet.getElementsByTagName('ows:Identifier')[0];
        if (tset) {
            tset = tset.textContent;
        }
    }
    //transform value, ArcGIS is different from others
    let transformValue = 0.0002645833333333333;
    if (options.isArcgis) {
        transformValue = 0.00028;
    }
    if (projection && projection.indexOf('4326') > -1) {
        transformValue = 2.3767925226029154e-9;
        if (options.isArcgis) {
            transformValue = 2.518101729011901e-9;
        }
    }
    let minLevel = Infinity;
    for (let index = 0; index < TileMatrixs.length; index++) {
        const TileMatrix = TileMatrixs[index];
        let level = TileMatrix.getElementsByTagName('ows:Identifier')[0].textContent;
        level = parseInt(level);
        minLevel = Math.min(minLevel, level);
        const ScaleDenominator = TileMatrix.getElementsByTagName('ScaleDenominator')[0].textContent;
        const TopLeftCorner = TileMatrix.getElementsByTagName('TopLeftCorner')[0].textContent;
        const TileWidth = TileMatrix.getElementsByTagName('TileWidth')[0].textContent;
        const TileHeight = TileMatrix.getElementsByTagName('TileHeight')[0].textContent;
        if (tileSize.length === 0) {
            tileSize.push(parseInt(TileWidth), parseInt(TileHeight));
        }
        if (tileSystem.length === 0) {
            const [x, y] = TopLeftCorner.split(' ').filter(s => {
                return s !== '';
            }).map(v => {
                return parseFloat(v);
            });
            if (x > 0) {
                tileSystem.push(1, -1, y, x);
            } else {
                tileSystem.push(1, -1, x, y);
            }
        }
        const res = parseFloat(ScaleDenominator) * transformValue;
        resolutions.push(res);
    }
    //Missing LOD completion
    // such as http://t0.tianditu.gov.cn/img_w/wmts?request=GetCapabilities&service=wmts&tk=de0dc270a51aaca3dd4e64d4f8c81ff6
    if (minLevel > 0) {
        let res = resolutions[0];
        for (let i = minLevel - 1; i >= 0; i--) {
            res = res * 2;
            resolutions.splice(0, 0, res);
        }
    }
    return {
        resolutions, tileSize, tileSystem, projection, TileMatrixSet: tset
    };
}

SpatialReference.loadWMTS = function (url, cb, options = { 'jsonp': true }) {
    if (isString(url)) {
        Ajax.get(url, function (err, xml) {
            if (err) {
                cb(err);
                return;
            }
            const layers = parseWMTSXML(xml, url, options);
            cb(null, layers);
        }, options);
    }
    return this;
};
