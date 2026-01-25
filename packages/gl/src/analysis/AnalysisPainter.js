import * as reshader from '../reshader';
import AnalysisShader from './AnalysisShader.js';
import { extend } from '../layer/util/util.js';
import { Util } from 'maptalks';

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
        this._shader = new AnalysisShader(viewport);
    }

    getMap() {
        return this._layer && this._layer.getMap();
    }

    paint(tex, layers) {
        if (!layers && layers.length) {
            return tex;
        }
        this._resize();
        const uniforms = {};
        const analysisTaskList = this._layer._analysisTaskList;
        if (!this._hasAnalysis()) {
            return tex;
        }
        this._regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
            stencil : 0,
            framebuffer : this._fbo
        });
        const shaderDefines = extend({}, this._shader.shaderDefines);
        delete shaderDefines['HAS_FLOODANALYSE'];
        delete shaderDefines['HAS_VIEWSHED'];
        delete shaderDefines['HAS_SKYLINE'];
        delete shaderDefines['HAS_INSIGHT'];
        delete shaderDefines['HAS_CUT'];
        delete shaderDefines['HAS_CROSSCUT'];
        delete shaderDefines['HAS_HEIGHTLIMIT'];
        if (tex.texture && tex.texture.sampleCount > 1) {
            shaderDefines['HAS_MULTISAMPLED'] = 1;
        }
        for (let i = 0; i < analysisTaskList.length; i++) {
            const task = analysisTaskList[i];
            if (!task.isEnable()) {
                continue;
            }
            const defines = task.getDefines();
            extend(shaderDefines, defines);
            const map = this.getMap();
            const width = map.width, height = map.height;
            const toAanalysisMeshes = this._getToAnalysisMeshes(layers, task.getExcludeLayers());
            const analysisUniforms = task.renderAnalysis(toAanalysisMeshes, width, height);
            if (analysisUniforms) {
                extend(uniforms, analysisUniforms);
            }
        }
        uniforms['sceneMap'] = tex;
        uniforms['resolution'] = [this._fbo.width, this._fbo.height];
        this._shader.setDefines(shaderDefines);
        this.renderer.render(this._shader, uniforms, null, this._fbo);
        return this._fbo;
    }

    _getToAnalysisMeshes(layers, excludeLayers) {
        let toAnalysisMeshes = [];
        for (let i = 0; i < layers.length; i++) {
            if (excludeLayers.indexOf(layers[i].getId()) > -1) {
                continue;
            }
            const renderder = layers[i].getRenderer();
            if (renderder && renderder.getAnalysisMeshes) {
                const meshes = renderder.getAnalysisMeshes();
                meshes.forEach(mesh => {
                    mesh.setUniform('useAnalysis', 1);
                });
                toAnalysisMeshes = toAnalysisMeshes.concat(meshes);
            }
        }
        return toAnalysisMeshes;
    }

    getViewportSize() {
        let width, height;
        if (this._viewport.width.data) {
            width = Util.isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
            height = Util.isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        } else {
            width = Util.isFunction(this._viewport.width) ? this._viewport.width() : this._viewport.width;
            height = Util.isFunction(this._viewport.height) ? this._viewport.height() : this._viewport.height;
        }
        return { width, height };
    }

    _resize() {
        const { width, height } = this.getViewportSize();
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
