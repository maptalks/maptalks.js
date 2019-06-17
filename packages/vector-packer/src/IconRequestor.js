import { Marker } from 'maptalks';

export default class IconRequestor {
    //options.errorUrl : alt image when failing loading the icon
    constructor(options) {
        this.options = options || {};
        const canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d');
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
        function onload() {
            current++;
            const ctx = self.ctx;
            let width, height;
            try {
                if (this.resize) {
                    resize(this, ctx.canvas);
                    width = ctx.canvas.width;
                    height = ctx.canvas.height;
                    if (document.getElementById('DEBUG')) {
                        const debug = document.getElementById('DEBUG');
                        debug.width = width;
                        debug.height = height;
                        debug.style.width = width + 'px';
                        debug.style.height = height + 'px';
                        debug.getContext('2d').drawImage(ctx.canvas, 0, 0);
                    }
                } else {
                    width = ctx.canvas.width = this.width;
                    height = ctx.canvas.height = this.height;
                    ctx.drawImage(this, 0, 0);
                }
                const data = ctx.getImageData(0, 0, width, height).data;
                buffers.push(data.buffer);
                images[this.url] = { data: { data, width, height }, url: this.src };
            } catch (err) {
                //tainted canvas
                console.warn(err);
            }
            if (current === count) {
                cb(null, { icons: images, buffers });
            }
        }
        function onerror() {
            console.warn(`failed loading icon(${this.index}) at "${this.url}"`);
            if (self.options.iconErrorUrl) {
                this.src = self.options.iconErrorUrl;
            } else {
                current++;
                if (current === count) {
                    cb(null, { icons: images, buffers });
                }
            }
        }
        let hasAsyn = false;
        let marker;
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            if (url.indexOf('vector://') === 0) {
                marker = marker ||  new Marker([0, 0]);
                const symbol = JSON.parse(url.substring('vector://'.length));
                delete symbol.markerHorizontalAlignment;
                delete symbol.markerVerticalAlignment;
                delete symbol.markerDx;
                delete symbol.markerDy;
                marker.setSymbol(symbol);
                const sprite = marker['_getSprite']();
                if (sprite) {
                    const canvas = sprite.canvas;
                    const width = canvas.width;
                    const height = canvas.height;
                    const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
                    images[url] = { data: { data, width, height }, url };
                    buffers.push(data.buffer);
                }

            } else {
                const img = new Image();
                img.index = i;
                img.onload = onload;
                img.onerror = onerror;
                img.onabort = onerror;
                img.resize = icons[url] === 'resize';
                img.url = url;
                img.crossOrigin = 'Anonymous';
                hasAsyn = true;
                count++;
                img.src = url;
            }
        }
        if (!hasAsyn) {
            cb(null, { icons: images, buffers });
        }
    }
}



function resize(image, canvas) {
    if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
        return image;
    }
    let width = image.width;
    let height = image.height;
    if (!isPowerOfTwo(width)) {
        width = ceilPowerOfTwo(width);
    }
    if (!isPowerOfTwo(height)) {
        height = ceilPowerOfTwo(height);
    }
    // const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
    const url = image.src;
    const idx = url.lastIndexOf('/') + 1;
    const filename = url.substring(idx);
    console.warn(`Texture(${filename})'s size is not power of two, resize from (${image.width}, ${image.height}) to (${width}, ${height})`);
    return canvas;
}

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}


function ceilPowerOfTwo(value) {
    return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
}
