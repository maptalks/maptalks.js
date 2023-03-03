import { getAbsoluteURL, isImageBitMap, isNil, isString, replaceVariable } from './util';
import Browser from './Browser';
import { createEl } from './util/dom';
import Ajax from './Ajax';
import promise from './Promise';

const parser = new DOMParser();

function parseSVG(str) {
    const xmlDoc = parser.parseFromString(str, 'text/xml');
    const root = xmlDoc.querySelector('svg');
    if (!root) {
        return null;
    }
    const paths = root.querySelectorAll('path');
    const data = [];
    for (let i = 0, len = paths.length; i < len; i++) {
        const path = paths[i];
        const attributes = path.attributes;
        if (!attributes) {
            continue;
        }
        const d = attributes.d.value;
        const fill = attributes.fill && attributes.fill.value;
        const stroke = attributes.stroke && attributes.stroke.value;
        const pathData = {
            path: d
        };
        if (fill) {
            pathData.fill = fill;
        }
        if (stroke) {
            pathData.stroke = stroke;
        }
        data.push(pathData);
    }
    return data;
}

function createCanvas() {
    let canvas;
    if (Browser.IS_NODE) {
        console.error('Current environment does not support canvas dom');
    } else {
        canvas = createEl('canvas');
    }
    return canvas;
}

function createOffscreenCanvas() {
    let offscreenCanvas;
    if (Browser.decodeImageInWorker) {
        offscreenCanvas = new OffscreenCanvas(2, 2);
    }
    return offscreenCanvas;
}

const PROTOCOLS = ['http', 'data:image/', 'blob:'];

function isAbsoluteURL(url) {
    for (let i = 0, len = PROTOCOLS.length; i < len; i++) {
        if (url.indexOf(PROTOCOLS[i]) === 0) {
            return true;
        }
    }
    return false;
}

/**
 * @classdesc
 * Global resource manager,It is static and should not be initiated
 * more info https://github.com/maptalks/maptalks.js/issues/1859
 * @class
 * @static
 * @category core
 * @example
 *   ResourceManager.setRootUrl('http://abc.com/images/');
 *  var img = ResourceManager.get('hello.png');
 *  //http://abc.com/images/hello.png
 *
 *  ResourceManager.add('dog','dog.png');
 *  var img = ResourceManager.get('dog');
 *  //http://abc.com/images/dog.png
 *
 *
 *
 *
 */
export const ResourceManager = {
    rootUrl: '',
    cache: {},

    /**
     * set resource root path
     * @param {String} url
     */
    setRootUrl(url) {
        ResourceManager.rootUrl = url;
    },

    /**
     * get resource
     * @param {String} name
     * @param {Boolean} imgBitMap
     * @returns {String} url/imgBitMap/Image
     */
    get(name, imgBitMap = false) {
        if (!ResourceManager.rootUrl) {
            ResourceManager.setRootUrl(getAbsoluteURL('/res/'));
        }
        const res = ResourceManager.cache[name];
        if (!res) {
            return `${ResourceManager.rootUrl}${name}`;
        }
        if (isString(res) && isAbsoluteURL(res)) {
            return res;
        }
        //imagebitmap or image
        if (isImageBitMap(res) || (res instanceof Image)) {
            return res;
        }
        //sprite icon
        if (res.isSprite) {
            if (res.imgBitMap && imgBitMap) {
                return res.imgBitMap;
            } else if (res.base64) {
                return res.base64;
            }
        }
        if (isString(res)) {
            return `${ResourceManager.rootUrl}${res}`;
        }
        //other data
        return res;

    },

    /**
     * remove resource
     * @param {String} name
     */
    remove(name) {
        delete ResourceManager.cache[name];
    },

    /**
     * add resource
     * @param {String} name
     * @param {String} res
     */
    add(name, res) {
        if (ResourceManager.cache[name]) {
            console.warn(`${name} resource Already exists,the ${name} Cannot be added,the resource name Cannot repeat `);
            return;
        }
        ResourceManager.cache[name] = res;
    },

    /**
    * update  resource (remove and add)
     * @param {String} name
     * @param {String} res
     */
    update(name, res) {
        ResourceManager.cache[name] = res;
    },

    /**
     * get all resource [key,value]
     * @returns {Object} source
     */
    all() {
        return ResourceManager.cache;
    },

    /**
    * load sprite resource,sprite icons auto add to ResourceManager cache
     * @param {Object} [options=null]      - sprite options
     * @param {String} [options.imgUrl]    - sprite image url
     * @param {String} [options.jsonUrl]  - sprite json url
    * @returns {Promise} promise
    * @example
    *  ResourceManager.loadSprite(
    * {imgUrl:'./sprite.png,jsonUrl:'./sprite.json'}).then(icons=>{}).catch(erro=>{})
    *
    */

    loadSprite(options = {}) {
        return new promise((resolve, reject) => {
            const { imgUrl, jsonUrl } = options;
            if (!imgUrl || !jsonUrl) {
                reject({
                    message: 'not find imgUrl/jsonUrl from options'
                });
                console.error(options);
                return;
            }

            function getCtx(canvas, width, height) {
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, width, height);
                return ctx;
            }

            function parseSprite(json = {}, image) {
                const canvas = createCanvas();
                if (!canvas) {
                    reject({
                        message: 'not create canvas'
                    });
                    return;
                }
                const ctx = getCtx(canvas, image.width, image.height);
                ctx.drawImage(image, 0, 0);
                const icons = [];
                for (const name in json) {
                    const spriteItem = json[name];
                    icons.push({
                        name,
                        spriteItem
                    });
                }
                let idx = 0;
                const tempCanvas = createCanvas();
                const offscreenCanvas = createOffscreenCanvas();
                function drawIcon() {
                    if (idx === icons.length) {
                        resolve(json);
                        return;
                    }
                    const { name, spriteItem } = icons[idx];
                    const { x, y, width, height } = spriteItem;
                    const ctx1 = getCtx(tempCanvas, width, height);
                    ctx1.drawImage(canvas, x, y, width, height, 0, 0, width, height);
                    const base64 = tempCanvas.toDataURL();
                    json[name].base64 = base64;
                    let imgBitMap;
                    if (offscreenCanvas) {
                        const ctx2 = getCtx(offscreenCanvas, width, height);
                        ctx2.drawImage(canvas, x, y, width, height, 0, 0, width, height);
                        imgBitMap = offscreenCanvas.transferToImageBitmap();
                        json[name].imgBitMap = imgBitMap;
                    }
                    ResourceManager.add(name, {
                        isSprite: true,
                        base64,
                        imgBitMap
                    });
                    idx++;
                    drawIcon();
                }
                drawIcon();
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
    },

    /**
    * load svgs resource,all svg auto add to ResourceManager ache,Note that all svg resources need to be placed in the rooturl directory
    * @param {Array|String} [svgs=[]]  - svgs names or svgs json url
    * @returns {Promise} promise
    * @example
    *  ResourceManager.loadSvgs(['dog.svg','cat.svg',.....]).then(svgs=>{}).catch(erro=>{})
    *  ResourceManager.loadSvgs('./svgs.json').then(svgs=>{}).catch(erro=>{})
    *
    */
    loadSvgs(svgs = []) {
        return new promise((resolve, reject) => {
            if (!svgs || svgs.length === 0) {
                reject('not find svgs');
                return;
            }
            const result = [];

            const addToCache = (name, body) => {
                const paths = parseSVG(body);
                if (paths) {
                    ResourceManager.add(name, paths);
                }
                result.push({
                    name,
                    paths,
                    body: body
                });
            };
            if (isString(svgs)) {
                fetch(svgs).then(res => res.json()).then(json => {
                    json.forEach(svg => {
                        const { name, body } = svg;
                        addToCache(name, body);
                    });
                    resolve(result);
                }).catch(err => {
                    console.log(err);
                    reject('request svgs json data error');
                });
                return;
            }
            let idx = 0;
            const loadSvg = () => {
                if (idx < svgs.length) {
                    const svgUrl = ResourceManager.get(svgs[idx]);
                    fetch(svgUrl).then(res => res.text()).then(body => {
                        const name = `${svgs[idx]}`;
                        addToCache(name, body);
                        idx++;
                        loadSvg();
                    }).catch(err => {
                        console.log(err);
                        idx++;
                        loadSvg();
                    });
                } else {
                    resolve(result);
                }
            };
            loadSvg();
        });
    }
};

export function checkResourceValue(url, properties) {
    const key = url[0];
    if (isNil(key) || !isString(key)) {
        return key;
    }
    if (key.indexOf('$') === 0) {
        const name = key.substring(1, key.length);
        return ResourceManager.get(name, Browser.decodeImageInWorker);
    } else if (resourceIsTemplate(key)) {
        if (!properties) {
            return key;
        }
        const name = replaceVariable(key, properties || {});
        url[0] = name;
        if (name.indexOf('$') === 0) {
            return ResourceManager.get(name.substring(1, name.length), Browser.decodeImageInWorker);
        }
        return name;
    }
    return key;
}

export function resourceIsTemplate(key) {
    if (isNil(key)) {
        return false;
    }
    key += '';
    return (key.indexOf('{') > -1 && key.indexOf('}') > -1);
}
