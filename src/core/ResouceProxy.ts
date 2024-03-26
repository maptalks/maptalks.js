import {
    extend, getAbsoluteURL, isNumber, isObject,
    isString, isURL
} from './util';

const EMPTY_STRING = '';
const BASE64_REG = /data:image\/.*;base64,/;

function isBase64URL(path) {
    return BASE64_REG.test(path);
}

function isBlobURL(path) {
    return path.indexOf('blob:') === 0;
}

function strContains(str1, str2) {
    if (isNumber(str1)) {
        str1 += EMPTY_STRING as any;
    }
    if (isNumber(str2)) {
        str2 += EMPTY_STRING as any;
    }
    if (!str1 || !str2) {
        return false;
    }
    if (str1.includes) {
        return str1.includes(str2);
    }
    return str1.indexOf(str2) > -1;
}

function handlerURL(path: string, configs = {}) {
    for (const local in configs) {
        const obj = configs[local];
        if (!obj || !obj.target) {
            continue;
        }
        if (strContains(path, local)) {
            const { target } = obj;
            return path.replace(local, target);
        }
    }
    return EMPTY_STRING;
}

/**
 * simple Resouce Proxy implementation
 *
 * https://www.webpackjs.com/configuration/dev-server/#devserverproxy
 */

// const { ResouceProxy, formatResouceUrl } = maptalks;
// function test1() {
//     ResouceProxy.proxy = {
//         '/geojson/': {
//             target: 'https://geo.datav.aliyun.com/areas_v3/bound/'
//         }
//     }
//     const url = formatResouceUrl('/geojson/350000_full.json');
//     console.log(url);
// }

// function test2() {
//     ResouceProxy.origin = {
//         'https://www.maptalks.com/': {
//             target: 'https://geo.datav.aliyun.com/areas_v3/'
//         }
//     }
//     const url = formatResouceUrl('https://www.maptalks.com/bound/350000_full.json');
//     console.log(url);
// }

// function test3() {
//     ResouceProxy.host = 'https://geo.datav.aliyun.com/areas_v3/bound'
//     const url = formatResouceUrl('/350000_full.json');
//     console.log(url);
// }

// function test4() {
//     const url = formatResouceUrl('./苏州.geojson');
//     console.log(url);
// }

export const ResouceProxy = {

    host: EMPTY_STRING,
    proxy: {
        // '/api/': {
        //     target: 'https://www.maptalks.com/api/'
        // },
        // '/doc/': {
        //     target: 'https://www.maptalks.com/doc/'
        // }
    },
    origin: {
        // 'https://www.maptalks.com/api/': {
        //     target: 'https://www.deyihu.com/api/'
        // },
        // 'https://www.maptalks.com/doc/': {
        //     target: 'https://www.deyihu.com/doc/'
        // }
    },

    fromJSON(json) {
        try {
            if (isString(json)) {
                json = JSON.parse(json);
            }
            if (isObject(json)) {
                extend(ResouceProxy, json);
            }
        } catch (error) {
            console.error(error);
        }
    },
    toJSON() {
        return {
            host: ResouceProxy.host,
            proxy: extend({}, ResouceProxy.proxy || {}),
            origin: extend({}, ResouceProxy.origin || {})
        };
    }
};

export function formatResouceUrl(path) {
    if (isNumber(path)) {
        path += EMPTY_STRING as any;
    }
    if (!path) {
        console.error('resouce path is null,path:', path);
        return path;
    }
    if (!isString(path)) {
        return path;
    }
    if (isBase64URL(path) || isBlobURL(path)) {
        return path;
    }
    const origin = ResouceProxy.origin || {};
    //is isAbsoluteURL
    const isAbsoluteURL = isURL(path);
    if (isAbsoluteURL && isObject(origin)) {
        const url = handlerURL(path, origin);
        if (url) {
            return url;
        }
        return path;
    }
    //relative URL
    const proxys = ResouceProxy.proxy || {};
    if (isObject(proxys)) {
        const url = handlerURL(path, proxys);
        if (url) {
            return url;
        }
    }
    const { host } = ResouceProxy;
    if (!isAbsoluteURL && host && isString(host)) {
        return `${host}${path}`;
    }
    return getAbsoluteURL(path);
}

