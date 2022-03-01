export function createAtlasTexture(regl, atlas, flipY) {
    const image = atlas;
    const config = {
        width: image.width,
        height: image.height,
        data: image.data,
        format: image.format,
        mag: 'linear', //very important
        min: 'linear', //very important
        flipY,
    };
    if (atlas.type === 'icon') {
        const wrapMode = (atlas.dataType !== 'point') ? 'repeat' : 'clamp';
        config['wrapS'] = wrapMode;
        config['wrapT'] = wrapMode;
    }
    return regl.texture(config);
}
