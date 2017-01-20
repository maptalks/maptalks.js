maptalks.TileInfo = {
    //谷歌, 必应,高德, 腾讯等地图服务采用的瓦片系统
    'web-mercator': {
        'tileSystem': [1, -1, -20037508.34, 20037508.34],
        'tileSize': {
            'width': 256,
            'height': 256
        }
    },
    //TMS瓦片系统的参考资料:
    //http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification
    //OSGEO组织的TMS瓦片系统, profile为global-mercator, mbtiles等tms标准瓦片服务采用该标准
    'tms-global-mercator': {
        'tileSystem': [1, 1, -20037508.34, -20037508.34],
        'tileSize': {
            'width': 256,
            'height': 256
        }
    },

    'tms-global-geodetic': {
        'tileSystem': [1, 1, -180, -90],
        'tileSize': {
            'width': 256,
            'height': 256
        }
    },

    'baidu': {
        'tileSystem': [1, 1, 0, 0],
        'tileSize': {
            'width': 256,
            'height': 256
        }
    }
};

maptalks['TileInfo'] = {
    'web-mercator': {
        'projection': 'EPSG:3857', //4326 | 3857 | bd09
        'tileSystem': 'web-mercator',
        'maxZoom': 18,
        'minZoom': 1,
        'resolutions': [
            156543.0339,
            78271.51695,
            39135.758475,
            19567.8792375,
            9783.93961875,
            4891.969809375,
            2445.9849046875,
            1222.99245234375,
            611.496226171875,
            305.7481130859375,
            152.87405654296876,
            76.43702827148438,
            38.21851413574219,
            19.109257067871095,
            9.554628533935547,
            4.777314266967774,
            2.388657133483887,
            1.1943285667419434,
            0.5971642833709717
        ],
        'fullExtent': {
            'top': 20037508.34,
            'left': -20037508.34,
            'bottom': -20037508.34,
            'right': 20037508.34
        },
        'tileSize': {
            'width': 256,
            'height': 256
        }
    },
    'tms-global-mercator': {
        'projection': 'EPSG:3857', // 4326 | 3857 | bd09 | pixel
        'tileSystem': 'TMS-GLOBAL-MERCATOR',
        // 'transformation' : [1, 0, 0, 1, -20037508.34, -20037508.34],
        'maxZoom': 21,
        'minZoom': 0,
        'resolutions': [
            156543.0339,
            78271.51695,
            39135.758475,
            19567.8792375,
            9783.93961875,
            4891.969809375,
            2445.9849046875,
            1222.99245234375,
            611.496226171875,
            305.7481130859375,
            152.87405654296876,
            76.43702827148438,
            38.21851413574219,
            19.109257067871095,
            9.554628533935547,
            4.777314266967774,
            2.388657133483887,
            1.1943285667419434,
            0.5971642833709717
        ],
        'fullExtent': {
            'top': 20037508.34,
            'left': -20037508.34,
            'bottom': -20037508.34,
            'right': 20037508.34
        },
        'tileSize': {
            'width': 256,
            'height': 256
        }
    },
    'baidu': {
        'projection': 'BAIDU',
        'tileSystem': [1, 1, 0, 0],
        'maxZoom': 19,
        'minZoom': 1,
        'resolutions': (function () {
            var res = Math.pow(2, 18);
            var resolutions = [];
            for (var i = 0; i < 20; i++) {
                resolutions[i] = res;
                res *= 0.5;
            }
            return resolutions;
        })(),
        'fullExtent': {
            'top': 33554432,
            'left': -33554432,
            'bottom': -33554432,
            'right': 33554432
        },
        'tileSize': {
            'width': 256,
            'height': 256
        }
    }
};
