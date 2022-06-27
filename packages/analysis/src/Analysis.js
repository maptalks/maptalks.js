import { Class, Eventable, Handlerable } from 'maptalks';

export default class Analysis extends Eventable(Handlerable(Class)) {

    constructor(options) {
        super(options);
        this._enable = true;
    }

    addTo(layer) {
        this.layer = layer;
    }

    enable() {
        this._enable = true;
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    disable() {
        this._enable = false;
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    isEnable() {
        return this._enable;
    }

    remove() {
        delete this.layer;
    }

    update(name, value) {
        this.options[name] = value;
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    exportAnalysisMap(meshes) {
       let fbo = this._pass.render(meshes, this._renderOptions);
       fbo = fbo.meshesMap ? fbo.meshesMap : fbo;
       const renderer = this.layer.getRenderer();
       if (fbo && renderer) {
            const regl = renderer.regl;
            const width = fbo.width, height = fbo.height;
            const data = new Uint8Array(4 * width * height);
            regl.read({
                data,
                x: 0, y: 0,
                framebuffer : fbo,
                width,
                height
            });
            return data;
       }
       return null;
    }

    getAnalysisType() {
        return this.type;
    }
}
