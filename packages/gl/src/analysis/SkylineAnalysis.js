import * as reshader from '@maptalks/reshader.gl';
import GroundPainter from '../layer/GroundPainter';
import Analysis from './Analysis';

export default class SkylineAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'skyline';
    }

    addTo(layer) {
        super.addTo(layer);
        const renderer = this.layer.getRenderer();
        if (renderer) {
            this._setSkylinePass(renderer);
        } else {
            this.layer.once('renderercreate', e => {
                this._setSkylinePass(e.renderer);
            }, this);
        }
        return this;
    }

    _setSkylinePass(renderer) {
        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return renderer.canvas ? renderer.canvas.width : 1;
            },
            height : () => {
                return renderer.canvas ? renderer.canvas.height : 1;
            }
        };
        this._fbo = renderer.regl.framebuffer({
            color: renderer.regl.texture({
                width: viewport.width(),
                height: viewport.height(),
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this.renderer = new reshader.Renderer(renderer.regl);
        this._skylinePass = new reshader.OutlinePass(this.renderer, viewport) || this._skylinePass;
        this.layer.addAnalysis(this);
        this._ground = this._createGround(renderer.regl);
    }

    renderAnalysis(meshes) {
        this._ground = this._ground || this._createGround();
        const map = this.layer.getMap();
        this._transformGround(map);
        const uniforms = {};
        let skylineMeshes = meshes.concat([this._ground]);
        this.renderer.clear({
            color : [0, 0, 0, 1],
            depth : 1,
            framebuffer : this._fbo
        });
        this._skylinePass.render(skylineMeshes, this._fbo, {
            projViewMatrix: map.projViewMatrix,
            lineColor: this.options['lineColor'],
            lineWidth: this.options['lineWidth']
        });
       uniforms['skylineMap'] = this._fbo;
       return uniforms;
    }

    _createGround(regl) {
        const planeGeo = new reshader.Plane();
        planeGeo.generateBuffers(regl);
        planeGeo.data.aTexCoord = new Float32Array(8);
        //TODO 还需要构造 tangent
        return new reshader.Mesh(planeGeo);
    }

    _transformGround(map) {
        const localTransform = GroundPainter.getGroundTransform(this._ground.localTransform, map);
        this._ground.setLocalTransform(localTransform);
    }

    remove() {
        super.remove();
        if (this._fbo) {
            this._fbo.destroy();
        }
        if (this._skylinePass) {
            this._skylinePass.dispose();
        }
        if (this._ground) {
            this._ground.geometry.dispose();
            delete this._ground;
        }
    }

    getDefines() {
        return {
            HAS_SKYLINE:1
        };
    }
}
