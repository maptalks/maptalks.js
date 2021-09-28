/*!
 * Codes from mapbox-gl-js
 * github.com/mapbox/mapbox-gl-js
 * MIT License
 */

import ShelfPack from '@mapbox/shelf-pack';
import { RGBAImage } from '../../Image';

const PADDING = 1;

export class ImagePosition {
    //paddedRect : x, y, w, h
    constructor(paddedRect, { pixelRatio }) {
        this.paddedRect = paddedRect;
        this.pixelRatio = pixelRatio || 1;
    }

    get tl() {
        return [
            this.paddedRect.x + PADDING,
            this.paddedRect.y + PADDING
        ];
    }

    get br() {
        return [
            this.paddedRect.x + this.paddedRect.w - PADDING,
            this.paddedRect.y + this.paddedRect.h - PADDING
        ];
    }

    get displaySize() {
        return [
            (this.paddedRect.w - PADDING * 2) / this.pixelRatio,
            (this.paddedRect.h - PADDING * 2) / this.pixelRatio
        ];
    }
}

export default class IconAtlas {
    /**
     * glyphMap : { string : StyleImage }
     *  type StyleImage = {
            data: RGBAImage,
            pixelRatio: number,
            sdf: boolean
     *  };
     * @param {Object} glyphMap glyph map
     */
    constructor(glyphMap) {
        this.glyphMap = glyphMap;
        this.build();
    }

    build() {
        const images = this.glyphMap;
        const positions = {};
        const pack = new ShelfPack(0, 0, { autoResize: true });
        const bins = [];
        const padding = PADDING;
        for (const id in images) {
            const src = images[id];
            const bin = {
                x: 0,
                y: 0,
                w: src.data.width + 2 * padding,
                h: src.data.height + 2 * padding,
            };
            bins.push(bin);
            positions[id] = new ImagePosition(bin, src);
        }

        pack.pack(bins, { inPlace: true });
        if (!isPowerOfTwo(pack.w) || !isPowerOfTwo(pack.h)) {
            const w = ceilPowerOfTwo(pack.w);
            const h = ceilPowerOfTwo(pack.h);
            pack.resize(w, h);
        }

        const image = new RGBAImage({ width: pack.w, height: pack.h });

        for (const id in images) {
            const src = images[id];
            const bin = positions[id].paddedRect;
            RGBAImage.copy(src.data, image, { x: 0, y: 0 }, { x: bin.x + padding, y: bin.y + padding }, src.data);
        }

        this.image = image;
        this.positions = positions;
    }
}

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}


function ceilPowerOfTwo(value) {
    return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
}

