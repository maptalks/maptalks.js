import { reshader } from '@maptalks/gl';
import { defined } from './common/Util';
import Analysis from './Analysis';
import ExcavatePass from './pass/ExcavatePass';

export default class ExcavateAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'excavate';
    }

    addTo(layer) {
        super.addTo(layer);
        const renderer = this.layer.getRenderer();
        this.regl = renderer.regl;
        if (renderer) {
            this._setExcavatePass(renderer);
        } else {
            this.layer.once('renderercreate', e => {
                this._setExcavatePass(e.renderer);
            }, this);
        }
        const map = this.layer.getMap();
        const { extentMap, extentInWorld, extentPolygon } = this._calExtent(this.options.boundary);
        this._renderOptions = {};
        this._renderOptions['height'] = map.altitudeToPoint(this.options['height'] || 0, map.getGLRes());
        this._renderOptions['extent'] = extentInWorld;
        this._renderOptions['extentPolygon'] = extentPolygon;
        this._renderOptions['extentMap'] = extentMap;
        this._renderOptions['groundTexture'] = this._createGroundTexture(this.options['textureUrl']);
        this._renderOptions['hasTexture'] = defined(this.options['textureUrl']) ? 1 : 0;
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
        return this;
    }

    _createGroundTexture(textureUrl) {
        const regl = this.regl;
        const texture = regl.texture({width: 2, height: 2});
        if (textureUrl) {
            const image = new Image();
            image.src = textureUrl;
            image.onload = function() {
                this._renderOptions['groundTexture'] = regl.texture(image);
                const renderer = this.layer.getRenderer();
                renderer.setToRedraw();
            }.bind(this);
        }
        return texture;
    }

    update(name, value) {
        if (name === 'boundary') {
            const { extentMap, extentInWorld, extentPolygon } = this._calExtent(value);
            this._renderOptions['extent'] = extentInWorld;
            this._renderOptions['extentPolygon'] = extentPolygon;
            this._renderOptions['extentMap'] = extentMap;
        } else if (name === 'textureUrl') {
            this._renderOptions['groundTexture'] = this._createGroundTexture(value);
            this._renderOptions['hasTexture'] = defined(value) ? 1 : 0;
        } else if (name === 'height') {
            const map = this.layer.getMap();
            this._renderOptions['height'] = map.altitudeToPoint(value || 0, map.getGLRes());
        } else {
            this._renderOptions[name] = value;
        }
        super.update(name, value);
    }

    getVolume() {}

    _setExcavatePass(renderer) {
        const viewport = this._viewport = {
            x : 0,
            y : 0,
            width : () => {
                return renderer.canvas ? renderer.canvas.width : 1;
            },
            height : () => {
                return renderer.canvas ? renderer.canvas.height : 1;
            }
        };
        const excavateRenderer = new reshader.Renderer(renderer.regl);
        this._pass = this._pass || new ExcavatePass(excavateRenderer, viewport);
        this.layer.addAnalysis(this);
        renderer.setToRedraw();
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        this._extentPass.render(this._extentMeshes, this._pvMatrix);
        const excavateMap =  this._pass.render(meshes, this._renderOptions);
        uniforms['excavateMap'] = excavateMap;
        return uniforms;
    }

    getDefines() {
        return {
            HAS_EXCAVATE: 1
        };
    }

    remove() {
        super.remove();
        if (this._pass) {
            this._pass.dispose();
        }
    }
}
