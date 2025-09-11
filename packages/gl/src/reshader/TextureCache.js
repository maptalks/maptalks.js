const DEFAULT_VALUE = {
    width: 0,
    height: 0,
    shape: [0, 0],
    radius: 0,
    mag: 'nearest',
    min: 'nearest',
    wrapS: 'clamp',
    wrapT: 'clamp',
    aniso: 0,
    format: 'rgba',
    type: 'uint8',
    mipmap: false,
    flipY: false,
    alignment: 1,
    premultiplyAlpha: false,
    colorSpace: 'none',
    channels: null
};

const keys = [];
function getKey(url, config) {
    if (!url) {
        return null;
    }
    keys[0] = url;
    let index = 1;
    for (const p in DEFAULT_VALUE) {
        if (p === 'shape') {
            keys[index++] = config[p] && config[p].join() || DEFAULT_VALUE[p].join();
        } else {
            keys[index++] = config[p] || DEFAULT_VALUE[p];
        }
    }
    return keys.join('/');
}

export default class TextureCache {
    constructor(regl) {
        this.regl = regl;
        this._cache = {};
    }

    getCachedTexture(url, config) {
        const key = getKey(url, config);
        const cached = this._cache[key];
        return cached && cached.data;
    }

    addCachedTexture(target, url, config) {
        const key = getKey(url, config);
        const cached = this._cache[key];
        if (!cached) {
            this._cache = {
                data: this.regl.texture(config),
                count: 0
            };
        }
        if (!this._myTextures) {
            this._myTextures = {};
        }
        if (!cached.data.then && !this._myTextures[url]) {
            //不是promise时才计数，painter内部不管引用多少次，计数器只+1
            cached.count++;
            this._myTextures[url] = 1;
        }
    }

    disposeCachedTexture(texture) {
        let url;
        if (typeof texture === 'string') {
            url = texture;
        } else {
            url = texture.url;
        }
        if (!this._myTextures || !this._myTextures[url]) {
            return;
        }
        //删除texture时，同时回收cache上的纹理，尽量保证不出现内存泄漏
        //最常见场景： 更新material时，回收原有的texture
        delete this._myTextures[url];
        // const map = this.getMap();
        // if (map[TEX_CACHE_KEY][url]) {
        //     map[TEX_CACHE_KEY][url].count--;
        //     if (map[TEX_CACHE_KEY][url].count <= 0) {
        //         delete map[TEX_CACHE_KEY][url];
        //     }
        // }
    }
}
