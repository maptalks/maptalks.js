import { Marker, Util } from 'maptalks';
import LRUCache from './LRUCache';

export default class IconRequestor {
    //options.errorUrl : alt image when failing loading the icon
    constructor(options) {
        this.options = options || {};
        this._requesting = {};
        this._cache = new LRUCache(256, function () {});
        const canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    }

    getIcons(icons, cb) {
        if (!icons || !Object.keys(icons).length) {
            cb(null, { icons: null });
            return;
        }
        const urls = Object.keys(icons);
        const images = {}, buffers = [];
        let count = 0;
        let current = 0;
        const self = this;
        function callback(url, size) {
            images[url] = self._getCache(url, size);
            if (images[url] && images[url] !== 'error') {
                buffers.push(images[url].data.data.buffer);
            } else {
                delete images[url];
            }
            current++;
            if (current === count) {
                cb(null, { icons: images, buffers });
            }
        }
        function complete(img) {
            const requests = self._requesting[img.url];
            for (let i = 0; i < requests.length; i++) {
                requests[i].call(img, img.url, img.size);
            }
            delete self._requesting[img.url];
        }
        function onload() {
            const ctx = self.ctx;
            let width, height;
            try {
                width = this.width;
                height = this.height;
                this.size[0] = width;
                this.size[1] = height;
                self._ensureMaxSize(null, this.size);
                width = this.size[0];
                height = this.size[1];
                const canvas = ctx.canvas;
                canvas.width = width;
                canvas.height = height;
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(this, 0, 0, width, height);

                // ctx.imageSmoothingEnabled = false;
                // const canvas = ctx.canvas;
                // resize(this, ctx);

                const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                self._addCache(this.url, data, canvas.width, canvas.height);
            } catch (err) {
                //tainted canvas
                console.warn(err);
            }
            complete(this);
        }
        function onerror(err) {
            console.warn(`failed loading icon(${this.index}) at "${this.url}"`);
            console.warn(err);
            if (self.options.iconErrorUrl) {
                this.src = self.options.iconErrorUrl;
            } else {
                self._addCache(this.url);
                complete(this);
            }
        }
        const urlModifier = this.options.urlModifier;
        let hasRequests = false;
        let marker;
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const size = icons[url];
            this._ensureMaxSize(url, size);
            const icon = this._getCache(url, size);
            if (icon && icon !== 'error') {
                images[url] = this._getCache(url, size);
                continue;
            } else if (icon === 'error') {
                continue;
            }
            let symbol, realUrl = url;
            if (url.indexOf('vector://') === 0) {
                symbol = JSON.parse(url.substring('vector://'.length));
                if (symbol.markerType === 'path') {
                    realUrl = Util.getMarkerPathBase64(symbol, symbol['markerWidth'], symbol['markerHeight']);
                }
            }
            if (url.indexOf('vector://') === 0 && symbol.markerType !== 'path') {
                marker = marker ||  new Marker([0, 0]);
                const { markerFill, markerLineColor } = symbol;
                if (markerFill && Array.isArray(markerFill)) {
                    symbol.markerFill = convertColorArray(markerFill);
                }
                if (markerLineColor && Array.isArray(markerLineColor)) {
                    symbol.markerLineColor = convertColorArray(markerLineColor);
                }
                delete symbol.markerHorizontalAlignment;
                delete symbol.markerVerticalAlignment;
                delete symbol.markerDx;
                delete symbol.markerDy;
                delete symbol.markerPlacement;
                delete symbol.markerFile;
                symbol.markerWidth = size[0];
                symbol.markerHeight = size[1];
                marker.setSymbol(symbol);
                const methodName = '_getSprite'.trim();
                const sprite = marker[methodName]();
                if (sprite) {
                    const canvas = sprite.canvas;
                    const width = canvas.width;
                    const height = canvas.height;
                    const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
                    images[url] = { data: { data: new Uint8ClampedArray(data), width, height }, url };
                    buffers.push(images[url].data.data.buffer);
                    this._addCache(url, data, width, height);
                }
            } else {
                // fuzhenn/maptalks-designer#439
                // canvas + svg存在bug: https://bugs.chromium.org/p/chromium/issues/detail?id=1142375
                // 在canvas上绘制svg，调用getImageData时，data会发生变化
                // 解决方法
                // * 在requestor上增加cache缓存，保证同一个svg图片只会加载一次
                // * Image 载入过程中的请求，先缓存在requesting，onload中集中处理
                if (!this._requesting[url]) {
                    this._requesting[url] = [];
                } else {
                    hasRequests = true;
                    count++;
                    this._requesting[url].push(callback);
                    continue;
                }
                this._requesting[url].push(callback);
                const img = new Image();
                img.index = i;
                img.size = size;
                img.onload = onload;
                img.onerror = onerror;
                img.onabort = onerror;
                img.url = url;
                img.crossOrigin = 'Anonymous';
                hasRequests = true;
                count++;
                img.src = urlModifier && urlModifier(realUrl) || realUrl;
            }
        }
        if (!hasRequests) {
            cb(null, { icons: images, buffers });
        }
    }

    _hasCache(url, width, height) {
        const icon = this._cache.get(url);
        return icon && icon !== 'error' && icon.data.width >= width && icon.data.height >= height;
    }

    _addCache(url, data, width, height) {
        if (!this._hasCache(url, width, height)) {
            if (data) {
                this._cache.add(url, { data: { data, width, height }, url });
            } else {
                this._cache.add(url, 'error');
            }

        }
    }

    _getCache(url, size) {
        if (!this._hasCache(url, size[0], size[1])) {
            return null;
        }
        const iconAtlas = this._cache.get(url);
        if (!iconAtlas) {
            return null;
        }
        if (iconAtlas === 'error') {
            return iconAtlas;
        }
        return {
            data: { data: new Uint8ClampedArray(iconAtlas.data.data), width: iconAtlas.data.width, height: iconAtlas.data.height },
            url: iconAtlas.url
        };
    }

    _ensureMaxSize(url, size) {
        if (!size[0] || !size[1]) {
            return;
        }
        const maxSize = this.options['maxSize'] || 2048;
        let [width, height] = size;
        const ratio = width / height;

        if (url) {
            const cached = this._cache.get(url);
            if (cached && cached !== 'error') {
                // 缓存中width或height更大时，则取更大的值
                const { width: cachedWidth, height: cachedHeight } = cached.data;
                if (cachedWidth > width) {
                    width = cachedWidth;
                }
                if (cachedHeight > height) {
                    height = cachedHeight;
                }
            }
        }

        if (width > maxSize) {
            height = maxSize / ratio;
            width = maxSize;
        }
        if (height > maxSize) {
            width = maxSize * ratio;
            height = maxSize;
        }
        size[0] = Math.floor(width);
        size[1] = Math.floor(height);

    }
}



// function resize(image, ctx) {
//     const canvas = ctx.canvas;
//     if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
//         canvas.width = image.width;
//         canvas.height = image.height;
//         ctx.drawImage(image, 0, 0, image.width, image.height);
//         return image;
//     }
//     let width = image.width;
//     let height = image.height;
//     if (!isPowerOfTwo(width)) {
//         width = ceilPowerOfTwo(width);
//     }
//     if (!isPowerOfTwo(height)) {
//         height = ceilPowerOfTwo(height);
//     }
//     // const canvas = document.createElement('canvas');
//     canvas.width = width;
//     canvas.height = height;
//     ctx.drawImage(image, 0, 0, width, height);
//     const url = image.src;
//     const idx = url.lastIndexOf('/') + 1;
//     const filename = url.substring(idx);
//     console.warn(`Texture(${filename})'s size is not power of two, resize from (${image.width}, ${image.height}) to (${width}, ${height})`);
//     return canvas;
// }

// function isPowerOfTwo(value) {
//     return (value & (value - 1)) === 0 && value !== 0;
// }


// function ceilPowerOfTwo(value) {
//     return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
// }

function convertColorArray(color) {
    if (color.length === 3) {
        color.push(1);
    }
    return color.reduce((accumulator, v, idx) => {
        if (idx < 3) {
            accumulator += v * 255 + ',';
        } else {
            accumulator += v + ')';
        }
        return accumulator;
    }, 'rgba(');
}
