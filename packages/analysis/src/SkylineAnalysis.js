import { reshader, GroundPainter } from '@maptalks/gl';
import OutlinePass from './pass/OutlinePass';
import Analysis from './Analysis';

const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');
export default class SkylineAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'skyline';
    }

    _prepareRenderOptions() {
        const map = this.layer.getMap();
        this._renderOptions = {};
        this._renderOptions['lineColor'] = this.options.lineColor;
        this._renderOptions['lineWidth'] = this.options.lineWidth;
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
        this._renderOptions['minAltitude'] = 0;
    }

    _setPass(renderer) {
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
        this._prepareRenderOptions();
        this.renderer = new reshader.Renderer(renderer.device);
        this._pass = new OutlinePass(this.renderer, viewport) || this._pass;
        this.layer.addAnalysis(this);
        this._ground = this._createGround(renderer.device);
    }

    renderAnalysis(meshes) {
        this._ground = this._ground || this._createGround(this.renderer.device);
        const map = this.layer.getMap();
        this._transformGround(map);
        const uniforms = {};
        const skylineMeshes = meshes.concat([this._ground]);
        this.renderer.clear({
            color : [0, 0, 0, 1],
            depth : 1,
            framebuffer : this._fbo
        });
        this._fbo = this._pass.render(skylineMeshes, this._renderOptions);
        uniforms['skylineMap'] = this._fbo;
        return uniforms;
    }

    exportSkylineMap(options) {
        if (!canvas || !this.isEnable()) {
            return null;
        }
        if (!options) {
            options = {};
        }
        const meshes = this._pass.getRenderMeshes();
        const data = this.exportAnalysisMap(meshes)
        const width = this._fbo.width, height = this._fbo.height;
        const pixels = new Uint8ClampedArray(data.length);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                pixels[(j * width + i) * 4] = data[((height - j) * width + i) * 4];
                pixels[(j * width + i) * 4 + 1] = data[((height - j) * width + i) * 4 + 1];
                pixels[(j * width + i) * 4 + 2] = data[((height - j) * width + i) * 4 + 2];
                pixels[(j * width + i) * 4 + 3] = data[((height - j) * width + i) * 4 + 3];
                if (pixels[(j * width + i) * 4] === 0 && pixels[(j * width + i) * 4 + 1] === 0 && pixels[(j * width + i) * 4 + 2] === 0) {
                    pixels[(j * width + i) * 4 + 3] = 0;
                }
            }
        }
        canvas.width = width;
        canvas.height = height;
        const imageData = new ImageData(pixels, width, height);
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        const url = canvas.toDataURL();
        if (options.save) {
            const dlLink = document.createElement('a');
            dlLink.download = options.filename || 'export';
            dlLink.href = url;
            document.body.appendChild(dlLink);
            dlLink.click();
            document.body.removeChild(dlLink);
        }
        return url;
    }
    update(name, value) {
        this._renderOptions[name] = value;
        super.update(name, value);
    }

    _createGround(regl) {
        const planeGeo = new reshader.Plane();
        planeGeo.generateBuffers(regl);
        planeGeo.data.aTexCoord = new Float32Array(8);
        return new reshader.Mesh(planeGeo);
    }

    _transformGround(map) {
        const localTransform = GroundPainter.getGroundTransform(this._ground.localTransform, map);
        this._ground.setLocalTransform(localTransform);
    }

    remove() {
        super.remove();
        if (this._ground) {
            this._ground.geometry.dispose();
            this._ground.dispose();
            delete this._ground;
        }
    }

    getDefines() {
        return {
            HAS_SKYLINE:1
        };
    }
}
