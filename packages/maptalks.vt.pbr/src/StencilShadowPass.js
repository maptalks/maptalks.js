export default class StencilShadowPass {
    constructor(sceneConfig, renderer) {
        this.renderer = renderer;
        this.sceneConfig = sceneConfig;
        this._init();
    }

    _init() {
    }

    getUniforms(numOfDirLights) {
        return [];
    }

    pass1() {
        return { fbo : null};
    }

    pass2() {}

    remove() {}
}
