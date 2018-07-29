/*!
 * Codes from mapbox-gl-js
 * github.com/mapbox/mapbox-gl-js
 * MIT License
 */

import ShelfPack from '@mapbox/shelf-pack';
import { RGBAImage } from '../../Image';

const padding = 1;

export class ImagePosition {
    //paddedRect : x, y, w, h
    constructor(paddedRect, { pixelRatio }) {
        this.paddedRect = paddedRect;
        this.pixelRatio = pixelRatio || 1;
    }

    get tl() {
        return [
            this.paddedRect.x + padding,
            this.paddedRect.y + padding
        ];
    }

    get br() {
        return [
            this.paddedRect.x + this.paddedRect.w - padding,
            this.paddedRect.y + this.paddedRect.h - padding
        ];
    }

    get displaySize() {
        return [
            (this.paddedRect.w - padding * 2) / this.pixelRatio,
            (this.paddedRect.h - padding * 2) / this.pixelRatio
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
        const image = new RGBAImage({ width: 0, height: 0 });
        const positions = {};

        const pack = new ShelfPack(0, 0, { autoResize: true });

        for (const id in this.glyphMap) {
            const src = this.glyphMap[id];

            const bin = pack.packOne(
                src.data.width + 2 * padding,
                src.data.height + 2 * padding);

            image.resize({
                width: pack.w,
                height: pack.h
            });

            RGBAImage.copy(
                src.data,
                image,
                { x: 0, y: 0 },
                {
                    x: bin.x + padding,
                    y: bin.y + padding
                },
                src.data);

            positions[id] = new ImagePosition(bin, src);
        }

        pack.shrink();
        image.resize({
            width: pack.w,
            height: pack.h
        });

        this.image = image;
        this.positions = positions;
    }
}
