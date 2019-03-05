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
        const count = urls.length;
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
            console.warn(`failed loading icon (${this.index}) at (${this.url})`);
            if (self.options.errorUrl) {
                this.src = self.options.errorUrl;
            } else {
                current++;
                if (current === count) {
                    cb(null, { icons: images, buffers });
                }
            }
        }
        for (let i = 0; i < urls.length; i++) {
            const img = new Image();
            img.index = i;
            img.onload = onload;
            img.onerror = onerror;
            img.onabort = onerror;
            img.url = urls[i];
            img.src = urls[i];
        }
    }
}
