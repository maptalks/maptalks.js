import { getAbsoluteURL, isNil, isObject, isString, replaceVariable } from './util';
import Browser from './Browser';
import { createEl } from './util/dom';
import Ajax from './Ajax';
import promise from './Promise';

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
 *  ResourceManager.setRootUrl('http://abc.com/images/');
 *  var img = ResourceManager.get('hello.png');//http://abc.com/images/hello.png
 *
 *  ResourceManager.add('test','dog.png');
 *  var img = ResourceManager.get('test');//http://abc.com/images/dog.png
 *
 *
 *
 *
 */
export const ResourceManager = {
    rootUrl: '',
    cache: {},

    /**
     * set image source root path
     * @param {String} url
     */
    setRootUrl(url) {
        ResourceManager.rootUrl = url;
    },

    /**
     * get image source
     * @param {String} name
     * @param {Boolean} imgBitMap
     * @returns {String} url/imgBitMap
     */
    get(name, imgBitMap = false) {
        if (!ResourceManager.rootUrl) {
            ResourceManager.setRootUrl(getAbsoluteURL('/res/'));
        }
        const img = ResourceManager.cache[name];
        if (!img) {
            return `${ResourceManager.rootUrl}${name}`;
        }
        if (isString(img) && isAbsoluteURL(img)) {
            return img;
        }
        if (img.imgBitMap && imgBitMap) {
            return img.imgBitMap;
        } else if (img.base64) {
            return img.base64;
        }
        if (isObject(img)) {
            return img;
        }
        return `${ResourceManager.rootUrl}${img}`;
    },

    /**
     * remove image source
     * @param {String} name
     */
    remove(name) {
        delete ResourceManager.cache[name];
    },

    /**
     * add image source
     * @param {String} name
     * @param {String} imageUrl
     */
    add(name, imgUrl) {
        if (ResourceManager.cache[name]) {
            console.warn(`${name} img Already exists,the ${name} Cannot be added`);
            return;
        }
        ResourceManager.cache[name] = imgUrl;
    },

    /**
    * update image source
     * @param {String} name
     * @param {String} imageUrl
     */
    update(name, imageUrl) {
        ResourceManager.cache[name] = imageUrl;
    },

    /**
     * get all images [key,value]
     * @returns {Object} images
     */
    all() {
        return ResourceManager.cache;
    },

    /**
    * load sprite source
     * @param {Object} [options=null]      - sprite options
     * @param {String} [options.imgUrl]    - sprite image url
     * @param {String} [options.jsonUrl]  - sprite json url
    * @returns {Promise} promise
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
};

export function checkResourceValue(url, geo) {
    let key = url[0];
    if (isNil(key)) {
        return key;
    }
    key += '';
    if (key.indexOf('$') === 0) {
        const name = key.substring(1, key.length);
        return ResourceManager.get(name, Browser.decodeImageInWorker);
    } else if (resourceIsTemplate(key)) {
        if (!geo) {
            return key;
        }
        const properties = geo.getProperties();
        const name = replaceVariable(key, properties || {});
        url[0] = name;
        if (name.indexOf('$') === 0) {
            return ResourceManager.get(name.substring(1, key.length), Browser.decodeImageInWorker);
        }
    }
    return key;
}

export function resourceIsTemplate(key) {
    if (isNil(key)) {
        return key;
    }
    key += '';
    return (key.indexOf('{') > -1 && key.indexOf('}') > -1);
}
