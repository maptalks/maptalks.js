import * as reshader from '@maptalks/reshader.gl';
import { vec2 } from 'gl-matrix';
import RainPainter from './RainPainter.js';
import SnowPainter from './SnowPainter.js';

const RESOLUTION = [],  DEFAULT_ZOOM = 16.685648411389433;
class WeatherPainter {
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
        this._width = viewport.width, this._height = viewport.height;
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
        this.EMPTY_TEXTURE = this._regl.texture({ with: 2, height: 2 });
        this._rainPainter = new RainPainter(this._regl, this._layer);
        this._rainRipplesPass = new reshader.RainRipplesPass(this._regl, viewport);
        this._snowPainter = new SnowPainter(this._regl, this._layer);
        this._fogPass = new reshader.FogPass(this._regl, viewport);
        this._weatherShader = new reshader.FogShader();
        this._weatherShader.version = 300;
    }

    getMap() {
        return this._layer && this._layer.getMap();
    }

    renderScene(drawContext) {
        this.renderSnowMask(drawContext);
        this.renderRain(drawContext);
    }

    renderRain(drawContext) {
        if (!this.isEnableRain()) {
            return;
        }
        this._rainPainter.paint(drawContext);
    }

    renderSnowMask(drawContext) {
        if (!this.isEnableSnow()) {
            return;
        }
        const map = this.getMap();
        this._snowPainter.render(drawContext, map);
    }

    paint(tex, meshes) {
        if (!meshes || !meshes.length) {
            return tex;
        }
        this._resize();
        const config = this._layer.getWeatherConfig();
        const uniforms = {};
        if (this.isEnableRain()) {
            uniforms['ripplesMap'] = this._renderRainRipples();
            this._weatherShader.shaderDefines['HAS_RAIN'] = 1;
        } else {
            delete this._weatherShader.shaderDefines['HAS_RAIN'];
        }
        if (this.isEnableSnow()) {
            this._weatherShader.shaderDefines['HAS_SNOW'] = 1;
            meshes.forEach(mesh => {
                mesh.defines['HAS_SNOW'] = 1;
            });
        } else {
            delete this._weatherShader.shaderDefines['HAS_SNOW'];
            meshes.forEach(mesh => {
               delete mesh.defines['HAS_SNOW'];
            });
        }
        if (this.isEnableFog()) {
            const fogConfig = config.fog;
            uniforms['fogColor'] = fogConfig.color || [0.9, 0.9, 0.9];
            this._weatherShader.shaderDefines['HAS_FOG'] = 1;
        } else {
            delete this._weatherShader.shaderDefines['HAS_FOG'];
        }
        this._weatherShader.setDefines(this._weatherShader.shaderDefines);
        uniforms['mixFactorMap'] = this._renderMixFactor(meshes);
        uniforms['sceneMap'] = tex;
        uniforms['time'] = this._getTimeSpan() / 1000;
        uniforms['resolution'] = vec2.set(RESOLUTION, this._fbo.width, this._fbo.height);
        this.renderer.render(this._weatherShader, uniforms, null, this._fbo);
        return this._fbo;
    }

    _renderMixFactor(meshes) {
        const options = {};
        const map = this.getMap();
        const zoom = map.getZoom();
        const ratio = Math.pow(2, DEFAULT_ZOOM - zoom);
        const config = this._layer.getWeatherConfig();
        const fogConfig = config.fog;
        const start = fogConfig.start || 0.1, end = fogConfig.end || 100;
        options['projMatrix'] = map.projMatrix;
        options['viewMatrix'] = map.viewMatrix;
        options['cameraPosition'] = map.cameraPosition;
        options['fogDist'] = [start * ratio, end * ratio];
        const mixFactorMap = this._fogPass.render(meshes, options);
        return mixFactorMap;
    }

    _renderRainRipples() {
        const map = this.getMap();
        const options = {};
        options['projMatrix'] = map.projMatrix;
        options['viewMatrix'] = map.viewMatrix;
        options['time'] = this._getTimeSpan() / 1000;
        const ripplesMap = this._rainRipplesPass.render(map, options);
        return ripplesMap;
    }

    _getTimeSpan() {
        if (!this._layer) {
            return 0;
        }
        const render = this._layer.getRenderer();
        return render.getFrameTime();
    }

    isEnableRain() {
        const weatherConfig = this._layer.getWeatherConfig();
        return weatherConfig && weatherConfig.rain && weatherConfig.rain.enable;
    }

    isEnableFog() {
        const weatherConfig = this._layer.getWeatherConfig();
        return weatherConfig && weatherConfig.fog && weatherConfig.fog.enable;
    }

    isEnableSnow() {
        const weatherConfig = this._layer.getWeatherConfig();
        return weatherConfig && weatherConfig.snow && weatherConfig.snow.enable;
    }

    update() {
        if (this.isEnableRain()) {
            this._rainPainter = this._rainPainter || new RainPainter(this._regl, this._layer);
            this._rainPainter.update();
        }
        if (this.isEnableSnow()) {
            this._snowPainter = this._snowPainter || new SnowPainter(this._regl, this._layer);
            this._snowPainter.update();
        }
    }

    getShadowMeshes() {
        return this._snowPainter.getMeshes();
    }

    _resize() {
        const map = this.getMap();
        const width = map.width, height = map.height;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
    }
}

export default WeatherPainter;
