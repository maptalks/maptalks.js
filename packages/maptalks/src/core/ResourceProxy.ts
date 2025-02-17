import { getAbsoluteURL, isURL } from './util/util';
import { isObject, extend, isString, isNumber } from './util/common';
import { createEl } from './util/dom';
import Browser from './Browser';
import Ajax from './Ajax';

type ProxyItemType = {
    target: string,
    [propName: string]: any;
}

type ProxyConfig = {
    [key: string]: ProxyItemType
}

type SpriteOptionsType = {
    imgUrl: string;
    jsonUrl: string;
    sourceName?: string;
}

type SVGItemType = {
    name: string;
    paths: Array<any>;
    body: string
}

type SVGOptionsType = {
    url?: string,
    symbols?: Array<SVGSymbolElement>;
    sourceName?: string;
    fill?: string;
    stroke?: string;
}

const EMPTY_STRING: string = '';
const BASE64_REG = /data:image\/.*;base64,/;


function createCanvas(): HTMLCanvasElement | undefined {
    let canvas;
    if (Browser.IS_NODE) {
        console.error('Current environment does not support canvas dom');
    } else {
        canvas = createEl('canvas');
    }
    return canvas;
}

function createOffscreenCanvas(): OffscreenCanvas | undefined {
    let offscreenCanvas;
    if (Browser.decodeImageInWorker) {
        offscreenCanvas = new OffscreenCanvas(2, 2);
    }
    return offscreenCanvas;
}



function isBase64URL(path: string) {
    return BASE64_REG.test(path);
}

function isBlobURL(path: string) {
    return path.indexOf('blob:') === 0;
}

function strContains(str1: string, str2: string) {
    if (isNumber(str1)) {
        (str1 as string) += EMPTY_STRING;
    }
    if (isNumber(str2)) {
        (str2 as string) += EMPTY_STRING;
    }
    if (!str1 || !str2) {
        return false;
    }
    if (str1.includes) {
        return str1.includes(str2);
    }
    return str1.indexOf(str2) > -1;
}

function handlerURL(path: string, configs: ProxyConfig = {}) {
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

function loadSprite(options: SpriteOptionsType = { imgUrl: '', jsonUrl: '' }) {
    return new Promise((resolve, reject) => {
        const { imgUrl, jsonUrl } = options;
        if (!imgUrl || !jsonUrl) {
            reject(new Error('not find imgUrl/jsonUrl from options'));
            console.error(options);
            return;
        }

        function getCtx(canvas: HTMLCanvasElement, width: number, height: number) {
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            return ctx;
        }

        function parseSprite(json = {}, image: CanvasImageSource) {
            const canvas = createCanvas();
            if (!canvas) {
                reject(new Error('can not create canvas'));
                return;
            }
            const icons = [];
            for (const name in json) {
                const spriteItem = json[name];
                icons.push({
                    name,
                    spriteItem
                });
            }
            const offscreenCanvas = createOffscreenCanvas();
            const sourceName = options.sourceName || "";
            icons.forEach(icon => {
                const { name, spriteItem } = icon;
                const { x, y, width, height } = spriteItem;
                let resource;
                if (offscreenCanvas) {
                    const ctx = getCtx(offscreenCanvas as any, width, height);
                    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
                    resource = offscreenCanvas.transferToImageBitmap();
                } else {
                    const ctx = getCtx(canvas, width, height);
                    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
                    resource = canvas.toDataURL();
                }
                icon.resource = resource;
                ResourceProxy.addResource(sourceName + name, resource);
            });
            resolve(icons);
        }

        Ajax.getJSON(jsonUrl, {}, (err, json) => {
            if (err) {
                reject(err);
                return;
            }
            const img = new Image();
            img.onload = () => {
                parseSprite(json, img);
            };
            img.onerror = (err) => {
                reject(err);
                return;
            };
            Ajax.getImage(img, imgUrl, {});
        });
    });
}

function loadSvgs(svgs: string | Array<SVGSymbolElement> | SVGOptionsType) {
    return new Promise((resolve, reject) => {
        let url: string = '', symbols: Array<SVGSymbolElement> = [], fillColor: string = '', strokeColor: string = '', sourceName = '';
        if (Array.isArray(svgs) || ((svgs as any) instanceof NodeList)) {
            symbols = svgs as Array<SVGSVGElement>;
        } else if (isObject(svgs)) {
            const opts = svgs as SVGOptionsType;
            url = opts.url;
            symbols = opts.symbols;
            fillColor = opts.fill;
            strokeColor = opts.stroke;
            sourceName = opts.sourceName || '';
        } else if (isString(svgs)) {
            url = svgs;
        }
        if (!url && (symbols && symbols.length === 0)) {
            reject(new Error('not find svgs data'));
            return;
        }
        const result = [];
        const addToCache = (name: string, body: string) => {
            const paths = parseSVG(body);
            if (paths) {
                paths.forEach(path => {
                    if (fillColor) {
                        path.fill = fillColor;
                    }
                    if (strokeColor) {
                        path.stroke = strokeColor;
                    }
                });
                ResourceProxy.addResource(sourceName + name, paths as any);
            }
            const data: SVGItemType = {
                name,
                paths,
                body: body
            }
            result.push(data);
        };
        //svg json collection
        if (url && isString(url)) {
            fetch(url).then(res => res.json()).then(json => {
                json.forEach(svg => {
                    const { name, body } = svg;
                    addToCache(name, body);
                });
                resolve(result);
            }).catch(err => {
                console.log(err);
                reject(err);
            });
            return;
        }
        //support svg symbols
        // https://developer.mozilla.org/en-US/docs/web/svg/element/symbol
        if (symbols) {
            for (let i = 0, len = symbols.length; i < len; i++) {
                const symbolNode = symbols[i];
                const name = symbolNode.id;
                const html = symbolNode.innerHTML;
                const body = `<xml><svg>${html}</svg></xml>`;
                if (name) {
                    addToCache(name, body);
                }
            }
            resolve(result);
            return;
        }
        reject(new Error('not support svgs params type'))
    });
}
/**
 * simple Resouce Proxy implementation
 *
 * https://www.webpackjs.com/configuration/dev-server/#devserverproxy
 */

// const { ResourceProxy, formatResouceUrl } = maptalks;
// function test1() {
//     ResourceProxy.proxy = {
//         '/geojson/': {
//             target: 'https://geo.datav.aliyun.com/areas_v3/bound/'
//         }
//     }
//     const url = formatResouceUrl('/geojson/350000_full.json');
//     console.log(url);
// }

// function test2() {
//     ResourceProxy.origin = {
//         'https://www.maptalks.com/': {
//             target: 'https://geo.datav.aliyun.com/areas_v3/'
//         }
//     }
//     const url = formatResouceUrl('https://www.maptalks.com/bound/350000_full.json');
//     console.log(url);
// }

// function test3() {
//     ResourceProxy.host = 'https://geo.datav.aliyun.com/areas_v3/bound'
//     const url = formatResouceUrl('/350000_full.json');
//     console.log(url);
// }

// function test4() {
//     const url = formatResouceUrl('./苏州.geojson');
//     console.log(url);
// }

export const ResourceProxy = {

    host: EMPTY_STRING,
    resources: {} as { [key: string]: any },
    proxy: {
        // '/api/': {
        //     target: 'https://www.maptalks.com/api/'
        // },
        // '/doc/': {
        //     target: 'https://www.maptalks.com/doc/'
        // }
    } as ProxyConfig,
    origin: {
        // 'https://www.maptalks.com/api/': {
        //     target: 'https://www.deyihu.com/api/'
        // },
        // 'https://www.maptalks.com/doc/': {
        //     target: 'https://www.deyihu.com/doc/'
        // }
    } as ProxyConfig,

    fromJSON(json: string | object) {
        try {
            if (isString(json)) {
                json = JSON.parse(json);
            }
            if (isObject(json)) {
                extend(ResourceProxy, json);
            }
        } catch (error) {
            console.error(error);
        }
    },
    toJSON() {
        return {
            host: ResourceProxy.host,
            proxy: extend({}, ResourceProxy.proxy || {}),
            origin: extend({}, ResourceProxy.origin || {})
        };
    },

    getResource(name: string) {
        return ResourceProxy.resources[name];
    },

    /**
     * remove resource
     * @param {String} name
     */
    removeResource(name: string) {
        delete ResourceProxy.resources[name];
    },

    /**
     * add resource
     * @param {String} name
     * @param {Object} res
     */
    addResource(name: string, res: string | ImageBitmap) {
        if (ResourceProxy.resources[name]) {
            console.warn(`${name} resource Already exists,the ${name} Cannot be added,the resource name Cannot repeat `);
            return;
        }
        ResourceProxy.resources[name] = res;
    },

    /**
    * update  resource (remove and add)
     * @param {String} name
     * @param {Object} res
     */
    updateResource(name: string, res: string | ImageBitmap) {
        ResourceProxy.resources[name] = res;
    },

    /**
     * get all resource [key,value]
     * @returns {Object} source
     */
    allResource() {
        return ResourceProxy.resources;
    },
    loadSprite,
    loadSvgs
};

export function formatResourceUrl(path: string) {
    if (isNumber(path)) {
        (path as string) += EMPTY_STRING;
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
    if (path[0] === '$') {
        return ResourceProxy.getResource(path.substring(1, Infinity)) || '';
    }
    const origin = ResourceProxy.origin || {};
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
    const proxys = ResourceProxy.proxy || {};
    if (isObject(proxys)) {
        const url = handlerURL(path, proxys);
        if (url) {
            return url;
        }
    }
    const { host } = ResourceProxy;
    if (!isAbsoluteURL && host && isString(host)) {
        return `${host}${path}`;
    }
    return getAbsoluteURL(path);
}



const parser = new DOMParser();

function getAttr(attributes: NamedNodeMap, key: string) {
    if (!attributes) {
        return null;
    }
    return attributes[key] && attributes[key].value;
}

export function parseSVG(str: string) {
    const xmlDoc = parser.parseFromString(str, 'text/xml');
    const root = xmlDoc.querySelector('svg');
    if (!root) {
        return null;
    }
    //parse all node,not only path node
    const paths = root.childNodes;
    const data = [];
    const rootAttribute = root.attributes;
    const rootFill = getAttr(rootAttribute, 'fill');
    const rootFillOpacity = getAttr(rootAttribute, 'fill-opacity');
    const rootStroke = getAttr(rootAttribute, 'stroke');
    const rootStrokeOpacity = getAttr(rootAttribute, 'stroke-opacity');
    const rootStrokeWidth = getAttr(rootAttribute, 'stroke-width');
    for (let i = 0, len = paths.length; i < len; i++) {
        const dom = paths[i];
        const attributes = (dom as any).attributes;
        if (!attributes) {
            continue;
        }
        let d;
        const tagName = (dom as any).tagName || '';
        const isPath = tagName.toLowerCase() === 'path';
        //非path节点直接拿dom节点 作为path参数
        if (!isPath) {
            d = dom;
        } else {
            d = getAttr(attributes, 'd');
        }
        if (!d) {
            continue;
        }
        const fill = getAttr(attributes, 'fill') || rootFill;
        const stroke = getAttr(attributes, 'stroke') || rootStroke;
        const pathData: any = {
            path: d
        };
        if (fill) {
            pathData.fill = fill;
            pathData['fill-opacity'] = getAttr(attributes, 'fill-opacity') || rootFillOpacity || 1;
        }
        if (stroke) {
            pathData.stroke = stroke;
            pathData['stroke-opacity'] = getAttr(attributes, 'stroke-opacity') || rootStrokeOpacity || 1;
            pathData['stroke-width'] = getAttr(attributes, 'stroke-width') || rootStrokeWidth || 1;
        }
        data.push(pathData);
        if (!isPath) {
            for (const p in pathData) {
                if (p === 'path') {
                    continue;
                }
                if (pathData.hasOwnProperty(p)) {
                    (dom as any).setAttribute(p, pathData[p]);
                }
            }
        }
    }
    return data;
}
