import * as reshader from '../../reshader';
import { mat4, quat, vec3 } from 'gl-matrix';
import rainVert from './glsl/rain.vert';
import rainFrag from './glsl/rain.frag';
const modelViewMatrix = [];
const DEFALUT_SCALE = [0.03, 0.03, 0.03];
const TEMP_ROTATE = [], TEMP_SCALE = [], TEMP_MAT = [];
const DEFAULT_COLOR = [1, 1, 1];
const DEFAULT_EXTENT = {
        min:[-1200, -1200, 0],
        max:[1200, 1200, 1000]
    }, DEFAULT_ZOOM = 16.685648411389433, extent = {min: [], max: []};
const Y_UP_TO_Z_UP = mat4.fromRotationTranslation([], quat.fromEuler([], 90, 0, 0), [0, 0, 0]);

class RainPainer {
    constructor(regl, layer) {
        this._regl = regl;
        this.renderer = new reshader.Renderer(regl);
        this._layer = layer;
        this._timer = new Clock();
        this._init();
    }

    getMap() {
        return this._layer && this._layer.getMap();
    }

    _init() {
        const canvas = this._layer.getRenderer().canvas;
        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return canvas.width;
            },
            height : () => {
                return canvas.height;
            }
        };
        this._shader = new reshader.MeshShader({
            vert: rainVert,
            frag: rainFrag,
            uniforms: [
                {
                    name: 'modelViewMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport,
                depth: {
                    enable: true,
                    mask: false,
                    func: 'less',
                    range: [0, 1]
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                }
            },
        });
        this._createScene();
    }

    _createScene() {
        const emptyTexture = this._regl.texture({ width: 2, height: 2});
        this._mesh = this._createRain();
        if (!this._mesh) {
            return;
        }
        this._scene = new reshader.Scene(this._mesh);
        const rainConfig = this._getRainConfig();
        if (!rainConfig.rainTexture) {
            this._mesh.material.set('rainMap', emptyTexture);
            console.warn('should set rain texture.');
        } else {
            this._creatRainTexture(rainConfig.rainTexture).then(rainMap => {
                this._mesh.material.set('rainMap', rainMap);
            });
        }
    }

    _createRain() {
        const map = this.getMap();
        const rainConfig = this._getRainConfig();
        if (!rainConfig) {
            return null;
        }
        this._fixZoom = map.getZoom();
        const box = this._getFixExtent();
        // const box = DEFAULT_EXTENT;
        const rainDensity = this._rainDensity = rainConfig.density;

        const rainWidth = this._rainWidth = rainConfig.rainWidth || 1;
        const rainHeight = this._rainHeight = rainConfig.rainHeight || 1;
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        for (let i = 0; i < rainDensity; i++) {
            const pos = {};
            pos.x = Math.random() * (box.max[0] - box.min[0]) + box.min[0];
            pos.y = Math.random() * (box.max[2] - box.min[2]) + box.min[2];
            pos.z = Math.random() * (box.max[1] - box.min[1]) + box.min[1];
            //雨滴的高宽比3:1
            const height = ((box.max[2] - box.min[2]) / 37.5) * rainHeight;
            const width = (height / 3) * rainWidth;

            vertices.push(
                pos.x + width,
                pos.y + height,
                pos.z,
                pos.x - width,
                pos.y + height,
                pos.z,
                pos.x - width,
                pos.y,
                pos.z,
                pos.x + width,
                pos.y,
                pos.z
            );

            normals.push(
                pos.x,
                pos.y - height / 2,
                pos.z,
                pos.x,
                pos.y - height / 2,
                pos.z,
                pos.x,
                pos.y - height / 2,
                pos.z,
                pos.x,
                pos.y - height / 2,
                pos.z
            );

            uvs.push(1, 1, 0, 1, 0, 0, 1, 0);

            indices.push(
                i * 4 + 0,
                i * 4 + 1,
                i * 4 + 2,
                i * 4 + 0,
                i * 4 + 2,
                i * 4 + 3
            );
        }
        const attributes = {};
        attributes['POSITION'] = vertices;
        attributes['NORMAL'] = normals;
        attributes['TEXCOORD_0'] = uvs;
        const geometry = new reshader.Geometry(
            attributes,
            indices,
            0,
            {
                primitive : 'triangles',
                positionAttribute: 'POSITION',
                normalAttribute: 'NORMAL',
                uv0Attribute: 'TEXCOORD_0'
            }
        );
        geometry.generateBuffers(this.renderer.device);
        const material = new reshader.Material({
            rainMap: this._regl.texture({ width: 2, height: 2 }),
            diffuse: rainConfig.color || [1, 1, 1],
            opacity: rainConfig.opacity || 1
        });
        const modelMesh = new reshader.Mesh(geometry, material);
        modelMesh.setUniform('top', box.max[2]);
        modelMesh.setUniform('bottom', box.min[2]);
        this._transformRain(modelMesh);
        modelMesh.transparent = true;
        return modelMesh;
    }

    _creatRainTexture(rainTexture) {
        const rainImage = new Image();
        rainImage.src = this._rainTexture = rainTexture;
        return new Promise((resolve, reject) => {
            rainImage.onload = () => {
                const rainMap = this._regl.texture({
                    mag: 'linear',
                    min: 'linear mipmap nearest',
                    wrapS: 'clamp',
                    wrapT: 'clamp',
                    data: rainImage
                });
                resolve(rainMap);
            };
            rainImage.onerror = (err) => {
                reject(err);
            };
        });
    }

    paint(context) {
        if (!this._scene) {
            return;
        }
        const rainConfig = this._getRainConfig();
        const uniforms = {};
        const map = this.getMap();
        uniforms['projMatrix'] = map.projMatrix;
        uniforms['viewMatrix'] = map.viewMatrix;
        uniforms['cameraPosition'] = map.cameraPosition;
        const speed = rainConfig.speed || 1.0;
        const time = this._timer.getElapsedTime() / (2 / speed) % 1;
        uniforms['time'] = time;
        this._mesh.material.set('diffuse', rainConfig.color || DEFAULT_COLOR);
        this._mesh.material.set('opacity', rainConfig.opacity || 1);
        this._transformRain(this._mesh);
        const fbo = context && context.renderTarget && context.renderTarget.fbo;
        this.renderer.render(this._shader, uniforms, this._scene, fbo);
        this._layer.getRenderer().setCanvasUpdated();
    }

    _transformRain(mesh) {
        const map = this.getMap();
        const center = map.coordinateToPointAtRes(map.getCenter(), map.getGLRes());
        const ratio = map.getGLScale() / map.getGLScale(this._fixZoom);
        const v3 = vec3.set(TEMP_SCALE, ratio, ratio, ratio);
        const scale = vec3.multiply(v3, DEFALUT_SCALE, v3);
        const transformat = mat4.identity(TEMP_MAT);
        const config = this._getRainConfig();
        const bearing = map.getBearing();
        mat4.fromRotationTranslationScale(transformat, quat.fromEuler(TEMP_ROTATE, config.windDirectionX || 0, config.windDirectionY || 0, -bearing + 90), [center.x, center.y, 0], scale);
        mat4.multiply(transformat, transformat, Y_UP_TO_Z_UP);
        mesh.setLocalTransform(transformat);
    }

    setToRedraw() {
        const renderer = this._layer.getRenderer();
        if (!renderer) {
            return;
        }
        renderer.setToRedraw();
    }

    update() {
        const rainConfig = this._getRainConfig();
        if (!rainConfig) {
            return;
        }
        if (!this._mesh) {
            this._createScene();
        }
        //更改雨量大小，需要重新创建mesh
        if (rainConfig.density !== this._rainDensity || rainConfig.rainWidth !== this._rainWidth || rainConfig.rainHeight !== this._rainHeight) {
            const rainMap = this._mesh.material.get('rainMap');
            this._mesh.geometry.dispose();
            this._mesh.dispose();
            this._scene.clear();
            this._mesh = this._createRain();
            this._mesh.material.set('rainMap', rainMap);
            this._scene.setMeshes(this._mesh);
        }
        if (rainConfig.rainTexture !== this._rainTexture) {
            this._creatRainTexture(rainConfig.rainTexture).then(rainMap => {
                this._mesh.material.set('rainMap', rainMap);
            });
        }
    }

    dispose() {
        if (this._mesh) {
            this._mesh.geometry.dispose();
            if (this._mesh.material) {
                this._mesh.material.dispose();
            }
            this._mesh.dispose();
            delete this._mesh;
        }
        if (this._shader) {
            this._shader.dispose();
            delete this._shader;
        }
    }

    isEnable() {
        const config = this._getRainConfig();
        return config && config.enable;
    }

    _getRainConfig() {
        const weatherConfig = this._layer.getWeatherConfig();
        return weatherConfig && weatherConfig.rain;
    }

    _getFixExtent() {
        const map = this.getMap();
        const zoom = map.getZoom();
        const ratio = DEFAULT_ZOOM - zoom;
        vec3.scale(extent.min, DEFAULT_EXTENT.min, Math.pow(2, ratio));
        vec3.scale(extent.max, DEFAULT_EXTENT.max, Math.pow(2, ratio));
        return extent;
    }
}

class Clock {
    constructor(autoStart) {
        this.autoStart = (autoStart !== undefined ) ? autoStart : true;
        this.startTime = 0;
        this.oldTime = 0;
        this.elapsedTime = 0;
        this.running = false;
    }

    start () {
        this.startTime = ( typeof performance === 'undefined' ? Date : performance ).now();
        this.oldTime = this.startTime;
        this.elapsedTime = 0;
        this.running = true;
    }

    stop () {
        this.getElapsedTime();
        this.running = false;
        this.autoStart = false;
    }

    getElapsedTime () {
        this.getDelta();
        return this.elapsedTime;
    }

    getDelta () {
        let diff = 0;
        if ( this.autoStart && ! this.running ) {
            this.start();
            return 0;
        }

        if ( this.running ) {
            const newTime = ( typeof performance === 'undefined' ? Date : performance ).now();
            diff = ( newTime - this.oldTime ) / 1000;
            this.oldTime = newTime;
            this.elapsedTime += diff;
        }
        return 0;
    }
}

export default RainPainer;
