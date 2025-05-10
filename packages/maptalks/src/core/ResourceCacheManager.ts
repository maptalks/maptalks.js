import Browser from './Browser';
import { isSVG, isImageBitMap, isString, hasOwn, isNumber } from './util';

type ResourceUrl = string | string[] | number;

type ResourceCacheItem = {
    image: ImageBitmap;
    width: number;
    height: number;
    refCnt: number;
}

/**
 * resouce key support ImageBitMap by Map
 * this.resources.set(imagebitmap,cache);
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map
 */


class ResourceCacheMap {
    resources: Map<string | ImageBitmap, ResourceCacheItem>;

    //@internal
    _errors: Map<string | ImageBitmap, number>;

    constructor() {
        this.resources = new Map();
        this._errors = new Map();
    }


    addResource(url: [string, number | string, number | string], img) {
        const imgUrl = this._getImgUrl(url as any);
        this.resources.set(imgUrl, {
            image: img,
            width: +url[1],
            height: +url[2],
            refCnt: 0
        })
        //is Image
        if (img && img.width && img.height && !img.close && Browser.imageBitMap && !Browser.safari && !Browser.iosWeixin) {
            if (img.src && isSVG(img.src)) {
                return;
            }
            createImageBitmap(img).then(imageBitmap => {
                if (!this.resources.has(imgUrl)) {
                    //removed
                    return;
                }
                this.resources.get(imgUrl).image = imageBitmap;
            });
        }
    }

    isResourceLoaded(url: ResourceUrl, checkSVG?: boolean) {
        if (!url) {
            return false;
        }
        const imgUrl = this._getImgUrl(url);
        if (this._errors.has(imgUrl)) {
            return true;
        }
        const img = this.resources.get(imgUrl);
        if (!img) {
            return false;
        }
        if (checkSVG && isSVG(url[0]) && (+url[1] > img.width || +url[2] > img.height)) {
            return false;
        }
        return true;
    }

    login(url: string) {
        const res = this.resources.get(url);
        if (res) {
            res.refCnt++;
        }
    }

    logout(url: string) {
        const res = this.resources.get(url);
        if (res && res.refCnt-- <= 0) {
            if (res.image && res.image.close) {
                res.image.close();
            }
            this.resources.delete(url);
        }
    }

    getImage(url: ResourceUrl) {
        const imgUrl = this._getImgUrl(url);
        if (!this.isResourceLoaded(url) || this._errors.has(imgUrl)) {
            return null;
        }
        return this.resources.get(imgUrl).image;
    }

    markErrorResource(url: ResourceUrl) {
        const imgUrl = this._getImgUrl(url);
        this._errors.set(imgUrl, 1);
    }

    merge(res: ResourceCacheMap) {
        if (!res) {
            return this;
        }
        const otherResource = res.resources;
        if (otherResource) {
            otherResource.forEach((value, key) => {
                const img = value;
                this.addResource([key as string, img.width, img.height], img.image);
            })
        }
        return this;
    }

    forEach(fn: (key: string | ImageBitmap, value: any) => void) {
        if (!this.resources) {
            return this;
        }
        this.resources.forEach((value, key) => {
            fn(key, value);
        })
        return this;
    }

    //@internal
    _getImgUrl(url: ResourceUrl) {
        if (isImageBitMap(url)) {
            return url;
        }
        let imgUrl;
        if (Array.isArray(url)) {
            imgUrl = url[0];
        } else if (isString(url)) {
            imgUrl = url;
        } else if (isNumber(url)) {
            imgUrl = url;
        }
        if (!imgUrl) {
            console.error(`get url key error,the url is:`, url);
        }
        return imgUrl;
    }

    remove() {
        if (!this.resources) {
            return this;
        }
        this.resources.forEach((value) => {
            if (value && value.image && value.image.close) {
                value.image.close();
            }
        })
        this.resources.clear();
        return this;
    }
}


export class ResourceCache {
    resources: any;

    //@internal
    _errors: any;

    constructor() {
        this.resources = {};
        this._errors = {};
    }

    addResource(url: [string, number | string, number | string], img) {
        this.resources[url[0]] = {
            image: img,
            width: +url[1],
            height: +url[2],
            refCnt: 0
        };
        if (img && img.width && img.height && !img.close && Browser.imageBitMap && !Browser.safari && !Browser.iosWeixin) {
            if (img.src && isSVG(img.src)) {
                return;
            }
            createImageBitmap(img).then(imageBitmap => {
                if (!this.resources[url[0]]) {
                    //removed
                    return;
                }
                this.resources[url[0]].image = imageBitmap;
            });
        }
    }

    isResourceLoaded(url: ResourceUrl, checkSVG?: boolean) {
        if (!url) {
            return false;
        }
        const imgUrl = this._getImgUrl(url);
        if (this._errors[imgUrl]) {
            return true;
        }
        const img = this.resources[imgUrl];
        if (!img) {
            return false;
        }
        if (checkSVG && isSVG(url[0]) && (+url[1] > img.width || +url[2] > img.height)) {
            return false;
        }
        return true;
    }

    login(url: string) {
        const res = this.resources[url];
        if (res) {
            res.refCnt++;
        }
    }

    logout(url: string) {
        const res = this.resources[url];
        if (res && res.refCnt-- <= 0) {
            if (res.image && res.image.close) {
                res.image.close();
            }
            delete this.resources[url];
        }
    }

    getImage(url: ResourceUrl) {
        const imgUrl = this._getImgUrl(url);
        if (!this.isResourceLoaded(url) || this._errors[imgUrl]) {
            return null;
        }
        return this.resources[imgUrl].image;
    }

    markErrorResource(url: ResourceUrl) {
        this._errors[this._getImgUrl(url)] = 1;
    }

    merge(res: any) {
        if (!res) {
            return this;
        }
        for (const p in res.resources) {
            const img = res.resources[p];
            this.addResource([p, img.width, img.height], img.image);
        }
        return this;
    }

    forEach(fn: (key: string, value: any) => void) {
        if (!this.resources) {
            return this;
        }
        for (const p in this.resources) {
            if (hasOwn(this.resources, p)) {
                fn(p, this.resources[p]);
            }
        }
        return this;
    }

    //@internal
    _getImgUrl(url: ResourceUrl) {
        if (!Array.isArray(url)) {
            return url;
        }
        return url[0];
    }

    remove() {
        for (const p in this.resources) {
            const res = this.resources[p];
            if (res && res.image && res.image.close) {
                // close bitmap
                res.image.close();
            }
        }
        this.resources = {};
    }
}

// Dynamically obtain resource cache instances
export function getResouceCacheInstance(): ResourceCache {
    if (Browser.decodeImageInWorker) {
        return new ResourceCacheMap() as ResourceCache;
    }
    return new ResourceCache();
}