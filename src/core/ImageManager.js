import { getAbsoluteURL, isString, replaceVariable } from './util';
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
 * Global image source manager,It is static and should not be initiated
 * more info https://github.com/maptalks/maptalks.js/issues/1859
 * @class
 * @static
 * @category core
 * @example
 *  ImageManager.setSourceUrl('http://abc.com/images/');
 *  var img = ImageManager.get('hello.png');//http://abc.com/hello.png
 *
 *  ImageManager.add('test','dog.png');
 *  var img = ImageManager.get('test');//http://abc.com/images/dog.png
 *
 *
 *
 *
 */
export const ImageManager = {
    sourceUrl: '',
    images: {},

    /**
     * set image source root path
     * @param {String} url
     */
    setSourceUrl(url) {
        ImageManager.sourceUrl = url;
    },

    /**
     * get image source
     * @param {stStringring} name
     * @returns {String} imageUrl
     */
    get(name) {
        if (!ImageManager.sourceUrl) {
            ImageManager.setSourceUrl(getAbsoluteURL('/'));
        }
        const img = ImageManager.images[name];
        if (!img) {
            return `${ImageManager.sourceUrl}${name}`;
        }
        if (!isString(img)) {
            return img;
        }
        if (isAbsoluteURL(img)) {
            return img;
        }
        return `${ImageManager.sourceUrl}${img}`;
    },

    /**
     * remove image source
     * @param {String} name
     */
    remove(name) {
        delete ImageManager.images[name];
    },

    /**
     * add image source
     * @param {String} name
     * @param {String} imageUrl
     */
    add(name, imgUrl) {
        if (ImageManager.images[name]) {
            console.warn(`${name} img Already exists,the ${name} Cannot be added`);
            return;
        }
        ImageManager.images[name] = imgUrl;
    },

    /**
    * update image source
     * @param {String} name
     * @param {String} imageUrl
     */
    update(name, imageUrl) {
        ImageManager.images[name] = imageUrl;
    },

    /**
     * get all images [key,value]
     * @returns {Object} images
     */
    all() {
        return ImageManager.images;
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

            function parseSprite(json = {}, image) {
                const canvas = createCanvas();
                if (!canvas) {
                    reject({
                        message: 'not create canvas'
                    });
                    return;
                }
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                const tempCanvas = createCanvas();
                const icons = [];
                for (const name in json) {
                    const spriteItem = json[name];
                    icons.push({
                        name,
                        spriteItem
                    });
                }
                let idx = 0;
                function drawIcon() {
                    if (idx === icons.length) {
                        resolve();
                        return;
                    }
                    const { name, spriteItem } = icons[idx];
                    const { x, y, width, height } = spriteItem;
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const ctx1 = tempCanvas.getContext('2d');
                    ctx1.clearRect(0, 0, width, height);
                    ctx1.drawImage(canvas, x, y, width, height, 0, 0, width, height);
                    if (tempCanvas.toDataURL) {
                        ImageManager.add(name, tempCanvas.toDataURL());
                        idx++;
                        drawIcon();
                    } else if (tempCanvas.transferToImageBitmap) {
                        ImageManager.add(name, tempCanvas.transferToImageBitmap());
                        idx++;
                        drawIcon();
                    } else {
                        idx++;
                        drawIcon();
                    }
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

export function checkResourceTemplate(key, geo) {
    if (!key) {
        return key;
    }
    if (key.indexOf('$') === 0) {
        const name = key.substring(1, key.length);
        return ImageManager.get(name);
    } else if (key.indexOf('{') > -1 && key.indexOf('}') > -1) {
        if (!geo) {
            return key;
        }
        const properties = geo.getProperties();
        const name = replaceVariable(key, properties || {});
        return ImageManager.get(name);
    }
    return key;
}
