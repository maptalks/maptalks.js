import GLTFLayerRenderer from './GLTFLayerRenderer';
import { reshader, MaskRendererMixin } from '@maptalks/gl';

const DEFAUL_TEXTURE = new reshader.Texture2D({
    url: undefined,
    mag: 'linear'
});
class EffectLayerRenderer extends MaskRendererMixin(GLTFLayerRenderer) {

    constructor(layer) {
        super(layer);
        this._textureMap = {};
    }

    _getTexture(textureUrl) {
        if (this.regl && this._textureMap[textureUrl]) {
            return this._textureMap[textureUrl].texture.getREGLTexture(this.regl);
        }
        return DEFAUL_TEXTURE;
    }

    //存储纹理资源,如果新加入的effectmarker引用的纹理资源不存在，则
    //重新生成，如果存在了，则重复利用
    _linkTexture(textureUrl) {
        if (this._textureMap[textureUrl]) {
            this._textureMap[textureUrl].count++;
        } else {
            this._loader = this._loader || new reshader.ResourceLoader();
            const url = textureUrl === 'default' ? undefined : textureUrl;
            const texture = new reshader.Texture2D({
                url,
                mag: 'linear'
            }, this._loader);
            texture.once('complete', () => {
                this.setToRedraw();
            }, this);
            this._textureMap[textureUrl] = {
                count : 1,
                texture
            };
        }
    }

    _removeTexture(textureUrl) {
        if (this._textureMap[textureUrl]) {
            this._textureMap[textureUrl].count--;
            //在没有marker引用该纹理资源时，需要销毁掉
            if (this._textureMap[textureUrl].count < 1) {
                this._textureMap[textureUrl].texture.dispose();
                delete this._textureMap[textureUrl];
            }
        }
    }
}
export default EffectLayerRenderer;
