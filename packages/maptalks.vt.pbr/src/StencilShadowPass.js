import * as reshader from 'reshader.gl';

export default class StencilShadowPass {
    constructor(sceneConfig, renderer) {
        this.renderer = renderer;
        this.sceneConfig = sceneConfig;
        this._init();
    }

    _init() {
    }

    createShadowVolume(data) {
        const capVertices = data.vertices.subarray(0, data.vertices.length / 2);
        const lightCap = new reshader.Geometry({
            aPosition : capVertices
        }, data.vertices.length / 2 / 4, {
            primitive : 'triangle strip'
        });
        lightCap.generateBuffers(this.renderer.regl);

        const sides = new reshader.Geometry({
            aPosition : data.vertices
        }, data.indices);
        sides.generateBuffers(this.renderer.regl);

        return [lightCap, sides];
    }

    getUniforms(numOfDirLights) {
        return [];
    }

    getDefines() {
        return {};
    }

    pass1({
        scene
    }) {
        // console.log(scene.getMeshes());
        return { fbo : null};
    }

    pass2() {}

    remove() {}
}
