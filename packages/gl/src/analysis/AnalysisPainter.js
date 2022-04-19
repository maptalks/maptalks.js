import * as reshader from '@maptalks/reshader.gl';
import { extend } from '../layer/util/util.js';

class AnalysisPainter {
    constructor(regl, layer, config) {
        this._regl= regl;
        this._layer = layer;
        this._config = config;
        this._init();
    }

    _init() {
        this.renderer = new reshader.Renderer(this._regl);
        const layerRenderer = this._layer.getRenderer();
        const viewport = this._viewport = {
            x : 0,
            y : 0,
            width : () => {
                return layerRenderer.canvas ? layerRenderer.canvas.width : 1;
            },
            height : () => {
                return layerRenderer.canvas ? layerRenderer.canvas.height : 1;
            }
        };
        this._fbo = this._regl.framebuffer({
            color: this._regl.texture({
                width: layerRenderer.canvas ? layerRenderer.canvas.width : 1,
                height: layerRenderer.canvas ? layerRenderer.canvas.height : 1,
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this._shader = new reshader.AnalysisShader(viewport);
    }

    getMap() {
        return this._layer && this._layer.getMap();
    }

    paint(tex, meshes) {
        if (!meshes || !meshes.length) {
            return tex;
        }
        this._resize();
        const uniforms = {};
        const analysisTaskList = this._layer._analysisTaskList;
        if (!this._hasAnalysis()) {
            return tex;
        }
        delete this._shader.shaderDefines['HAS_FLOODANALYSE'];
        delete this._shader.shaderDefines['HAS_VIEWSHED'];
        delete this._shader.shaderDefines['HAS_SKYLINE'];
        for (let i = 0; i < analysisTaskList.length; i++) {
            const task = analysisTaskList[i];
            const defines = task.getDefines();
            extend(this._shader.shaderDefines, defines);
            const map = this.getMap();
            const width = map.width, height = map.height;
            if (!task.isEnable()) {
                continue;
            }
            const analysisUniforms = task.renderAnalysis(meshes, width, height);
            if (analysisUniforms) {
                extend(uniforms, analysisUniforms);
            }
        }
        uniforms['sceneMap'] = tex;
        this._shader.setDefines(this._shader.shaderDefines);
        this.renderer.render(this._shader, uniforms, null, this._fbo);
        return this._fbo;
    }

    _resize() {
        const map = this._layer.getMap();
        const width = map.width, height = map.height;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
    }

    _hasAnalysis() {
        const tasks = this._layer && this._layer._analysisTaskList;
        if (!tasks) {
            return false;
        }
        for (let i = 0; i < tasks.length;i++) {
            if (tasks[i].isEnable()) {
                return true;
            }
        }
        return false;
    }
}

export default AnalysisPainter;
