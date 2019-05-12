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
            const width = this.width, height = this.height;
            const ctx = self.ctx;
            ctx.canvas.width = width;
            ctx.canvas.height = height;
            try {
                ctx.drawImage(this, 0, 0);
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
                const sprite = marker._getSprite();
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
                img.url = url;
                img.src = url;
                hasAsyn = true;
                count++;
            }
        }
        if (!hasAsyn) {
            cb(null, { icons: images, buffers });
        }
    }
}
