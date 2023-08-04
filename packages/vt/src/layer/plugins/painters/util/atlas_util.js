import { reshader } from '@maptalks/gl';

export function createAtlasTexture(regl, atlas, flipY, mipmap) {
    if (mipmap) {
        const data = reshader.Util.resizeToPowerOfTwo(atlas.data, atlas.width, atlas.height);
        atlas.data = data;
    }
    const image = atlas;
    const config = {
        width: image.width,
        height: image.height,
        data: image.data,
        format: image.format,
        mag: 'linear', //very important
        min: mipmap ? 'linear mipmap linear' : 'linear', //very important
        flipY,
        // 设成true解决矢量marker边缘的“漏光”问题
        premultiplyAlpha: true
    };
    if (atlas.type === 'icon') {
        const wrapMode = (atlas.dataType !== 'point') ? 'repeat' : 'clamp';
        config['wrapS'] = wrapMode;
        config['wrapT'] = wrapMode;
    }
    return regl.texture(config);
}

const EMPTY_SIZE = [0, 0];
const DEFAULT_SIZE = [];
export function getDefaultMarkerSize(geometry) {
    if (!geometry.properties.iconPositions) {
        return EMPTY_SIZE;
    }
    let key;
    let count = 0;
    // 只有当iconPositions中只有一个markerFile时，才能读出默认尺寸
    for (const p in geometry.properties.iconPositions) {
        key = p;
        count++;
        if (count > 1) {
            return EMPTY_SIZE;
        }
    }
    if (!key) {
        return EMPTY_SIZE;
    }
    const iconPosition = geometry.properties.iconPositions[key];
    const defaultMarkerWidth = iconPosition.displaySize[0];
    const defaultMarkerHeight = iconPosition.displaySize[1];
    DEFAULT_SIZE[0] = defaultMarkerWidth;
    DEFAULT_SIZE[1] = defaultMarkerHeight
    return DEFAULT_SIZE;
}
