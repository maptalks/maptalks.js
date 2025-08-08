import GLTFMarker from './GLTFMarker';

const URL_PATTERN = /\{ *([\w_]+) *\}/g;

export default class EffectMarker extends GLTFMarker {

    constructor(coordinates, options) {
        super(coordinates, options);
        this._type = 'effectmarker';
    }

    static fromJSON(json) {
        return new EffectMarker(json.coordinates, json.options);
    }

    isAnimated() {
        return true;
    }

    setTexture(url) {
        const layerRenderer = this.getLayer() && this.getLayer().getRenderer();
        if (layerRenderer) {
            const textureUrl = this.getTextureUrl();
            layerRenderer._removeTexture(textureUrl);
            layerRenderer._linkTexture(url);
        }
        super.updateSymbol({ textureUrl: url });
        return this;
    }

    _getTextureFromLayer(time) {
        const textureUrl = this.getTextureUrl();
        const layerRenderer = this.getLayer() && this.getLayer().getRenderer();
        if (layerRenderer) {
            let url = textureUrl;
            const textureNames = this._getTextureNames();
            if (textureNames) {
                const loop = this.isAnimationLooped();
                const speed = this.getAnimationSpeed();
                const animaSpeed = speed || 1.0;
                const index = loop ? Math.floor(time * 0.01 * animaSpeed) % (textureNames.length) : Math.floor(time * 0.01);
                url = textureUrl.replace(URL_PATTERN, textureNames[index]);
                this.setUniform('width', 1);
                this.setUniform('height', 1);
                this.setUniform('uvOffset', [0, 0]);
            }
            const texture = layerRenderer._getTexture(url, this._getPickingId());
            return texture;
        }
        return null;
    }

    _getTextureNames() {
        const symbol = this._getInternalSymbol();
        return symbol && symbol.textureNames;
    }

    getTextureUrl() {
        const symbol = this._getInternalSymbol();
        return symbol && symbol.textureUrl || 'default';
    }

    getUrl() {
        return 'plane';
    }

    getShader() {
        return 'effect';
    }

    setTransparent(transparent) {
        this.options.symbol.transparent = transparent;
        return this;
    }

    isTransparent() {
        return this.options.symbol.transparent;
    }

    updateUV(time) {
        const loop = this.isAnimationLooped();
        const speed = this.getAnimationSpeed();
        const animaSpeed = speed || 1.0;
        const uniforms = this.getUniforms() || {};
        const width = uniforms.width || 1;
        const height = uniforms.height || 1;
        let index;
        const type = this.getEffectType();
        if (type === 'uv') {
            index = loop ? (time * 0.01 * animaSpeed) % (width * height) : time * 0.01;
        } else if (type === 'sequence') {
            index = loop ? Math.floor(time * 0.01 * animaSpeed) % (width * height) : Math.floor(time * 0.01);
        }
        const u = Math.floor(index % width);
        const v = Math.floor(index / width);
        const texture = this._getTextureFromLayer(time);
        if (this['_getSymbol']()) {
            this.setUniform('uvOffset', [u, v]);
            this.setUniform('width', width);
            this.setUniform('height', height);
            this.setUniform('texture', texture);
        } else {
            this._setPropInExternSymbol('uniforms', {
                uvOffset: [u, v],
                width,
                height,
                texture
            });
        }
    }

    _setExternSymbol(symbol) {
        super._setExternSymbol(symbol);
        const layerRenderer = this.getLayer() && this.getLayer().getRenderer();
        if (layerRenderer) {
            const textureUrl = this.getTextureUrl();
            layerRenderer._linkTexture(textureUrl);
        }
    }

    getEffectType() {
        const symbol = this._getInternalSymbol();
        return symbol && symbol.effect || 'uv';
    }

    setEffectType(effect) {
        const symbol = this._getInternalSymbol();
        symbol.effect = effect;
        return this;
    }

    remove() {
        const layerRenderer = this.getLayer() && this.getLayer().getRenderer();
        if (layerRenderer) {
            const textureUrl = this.getTextureUrl();
            layerRenderer._removeTexture(textureUrl);
        }
        super.remove();
    }
}
