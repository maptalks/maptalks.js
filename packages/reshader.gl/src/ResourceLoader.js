import Eventable from './common/Eventable.js';
import Ajax from './common/Ajax.js';

class ResourceLoader {
    constructor(DEFAULT_TEXTURE) {
        this.defaultTexture = DEFAULT_TEXTURE;
        this.defaultCubeTexture = new Array(6);

        this.resources = {};
    }

    get(url, cb) {
        if (Array.isArray(url)) {
            return this._loadImages(url, cb);
        } else {
            return this._loadImage(url, cb);
        }
    }

    getArrayBuffer(url, cb) {
        if (!this._count || this._count < 0) {
            this._count = 0;
        }
        if (Array.isArray(url)) {
            const promises = url.map(u => new Promise((resolve, reject) => {
                Ajax.getArrayBuffer(u, (err, buffer) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(buffer.data);
                });
            }));
            Promise.all(promises).then(
                values => {
                    cb(null, values);
                    this._onComplete();
                },
                cb
            );
            return this._getBlankTextures(url.length);
        } else {
            Ajax.getArrayBuffer(url, (err, buffer) => {
                cb(err, buffer);
                this._onComplete();
            });
            return this.defaultTexture;
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

    _disposeOne(url) {
        const resources = this.resources;
        if (!resources[url]) {
            return;
        }
        resources[url].count--;
        if (resources[url.count] <= 0) {
            delete resources[url];
        }
    }

    _loadImage(url, cb, inGroup) {
        if (!this._count || this._count < 0) {
            this._count = 0;
        }
        this._count++;
        const resources = this.resources;
        if (resources[url]) {
            cb(null,  resources[url].image);
            this._onComplete();
            return resources[url].image;
        }
        const img = new Image();
        const self = this;
        img.onload = function () {
            resources[url] = {
                image : img,
                count : 1
            };
            cb(null, img);
            if (!inGroup) {
                self._onComplete();
            }
        };
        img.src = url;
        return this.defaultTexture;
    }

    _loadImages(urls, cb) {
        const promises = urls.map(url => new Promise((resolve, reject) => {
            this._loadImage(url, (err, image) => {
                if (err) {
                    reject(err);
                }
                resolve(image);
            }, true);
        }));
        Promise.all(promises).then(
            values => {
                cb(null, values);
                self._onComplete();
            },
            cb
        );
        return this._getBlankTextures(urls.length);
    }

    _onComplete() {
        this._count--;
        if (this._count <= 0) {
            this._count = 0;
            this.fire('complete');
        }
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
