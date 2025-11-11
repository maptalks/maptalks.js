import * as maptalks from 'maptalks';
import * as reshader from '../reshader';

const TexturePoolable = function <T extends maptalks.MixinConstructor>(Base: T) {
    const poolable = class extends Base {
        _textures: reshader.Texture2D[] = [];

        /**
         * Get a texture from cache or create one if cache is empty
         */
        getTexture(): maptalks.WithNull<reshader.Texture2D> {
            if (!this._textures) {
                this._textures = [];
            }
            const textures = this._textures;
            return textures && textures.length > 0 ? textures.pop() : null;
        }

        /**
         * Save a texture to the cache
         */
        saveTexture(texture: reshader.Texture2D) {
            this._textures.push(texture);
        }

        disposeTexturePool() {
            const textures = this._textures;
            for (let i = 0; i < textures.length; i++) {
                textures[i].dispose();
            }
            this._textures = [];
        }
    };
    return poolable;
}

export default TexturePoolable;
