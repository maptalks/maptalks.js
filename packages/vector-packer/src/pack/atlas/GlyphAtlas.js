/*!
 * Codes from mapbox-gl-js
 * github.com/mapbox/mapbox-gl-js
 * MIT License
 * TODO 升级为potpack
 */

import ShelfPack from '@mapbox/shelf-pack';
import { AlphaImage } from '../../Image';

const padding = 1;

export default class GlyphAtlas {
    constructor(glyphMap) {
        this.glyphMap = glyphMap;
        this.build();
    }

    build() {
        const stacks = this.glyphMap;
        const positions = {};
        const pack = new ShelfPack(0, 0, { autoResize: true });
        const bins = [];

        for (const stack in stacks) {
            const glyphs = stacks[stack];
            const stackPositions = positions[stack] = {};

            for (const id in glyphs) {
                const src = glyphs[+id];
                if (!src || src.bitmap.width === 0 || src.bitmap.height === 0) continue;

                const bin = {
                    x: 0,
                    y: 0,
                    w: src.bitmap.width + 2 * padding,
                    h: src.bitmap.height + 2 * padding
                };
                bins.push(bin);
                stackPositions[id] = { rect: bin, metrics: src.metrics };
            }
        }

        pack.pack(bins, { inPlace: true });

        const image = new AlphaImage({ width: pack.w, height: pack.h });

        for (const stack in stacks) {
            const glyphs = stacks[stack];

            for (const id in glyphs) {
                const src = glyphs[+id];
                if (!src || src.bitmap.width === 0 || src.bitmap.height === 0) continue;
                const bin = positions[stack][id].rect;
                AlphaImage.copy(src.bitmap, image, { x: 0, y: 0 }, { x: bin.x + padding, y: bin.y + padding }, src.bitmap);
            }
        }
        this.image = image;
        this.positions = positions;
    }
}
