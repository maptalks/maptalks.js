import Eventable from './common/Eventable.js';
import Ajax from './common/Ajax.js';

class ResourceLoader {
    constructor(DEFAULT_TEXTURE, urlModifier) {
        this.defaultTexture = DEFAULT_TEXTURE;
        this.defaultCubeTexture = new Array(6);
        this.urlModifier = urlModifier;

        //TODO 把this.resources换成LRU队列，控制缓存的资源数量
        this.resources = {};
    }

    setURLModifier(urlModifier) {
        this.urlModifier = urlModifier;
    }

    get(url) {
        if (Array.isArray(url)) {
            return this._loadImages(url);
        } else {
            return this._loadImage(url);
        }
    }

    getArrayBuffer(url) {
        if (Array.isArray(url)) {
            const promises = url.map(u => this.getArrayBuffer(u));
            return Promise.all(promises);
        } else {
            return new Promise((resolve, reject) => {
                let realUrl = url;
                if (this.urlModifier) {
                    realUrl = this.urlModifier(url);
                }
                Ajax.getArrayBuffer(realUrl, (err, buffer) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ url, data: buffer });
                    }
                });
            });
        }
    }

    disposeRes(url) {
        if (Array.isArray(url)) {
            url.forEach(u => this._disposeOne(u));
        } else {
            this._disposeOne(url);
        }
        return this;
    }

    isLoading() {
        return this._count && this._count > 0;
    }

    getDefaultTexture(url) {
        if (!Array.isArray(url)) {
            return this.defaultTexture;
        } else {
            return this._getBlankTextures(url.length);
        }
    }

    _disposeOne(url) {
        const resources = this.resources;
        if (!resources[url]) {
            return;
        }
        resources[url].count--;
        if (resources[url].count <= 0) {
            delete resources[url];
        }
    }

    _loadImage(url) {
        const resources = this.resources;
        if (resources[url]) {
            return Promise.resolve({ url, data: resources[url].image });
        }
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () {
                resources[url] = {
                    image : img,
                    count : 1
                };
                resolve({ url, data: img });
            };
            img.onerror = function (err) {
                reject(err);
            };
            img.onabort = function () {
                reject(`image(${url}) loading aborted.`);
            };
            if (this.urlModifier) {
                img.src = this.urlModifier(url);
            } else {
                img.src = url;
            }

        });
        return promise;
    }

    _loadImages(urls) {
        const promises = urls.map(url => this._loadImage(url, true));
        const promise = Promise.all(promises);
        return promise;
    }

    _getBlankTextures(count) {
        const t = new Array(count);
        for (let i = 0; i < 6; i++) {
            t.push(this.defaultTexture);
        }
        return t;
    }
}

export default Eventable(ResourceLoader);
