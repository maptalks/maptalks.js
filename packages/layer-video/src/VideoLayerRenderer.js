import * as maptalks from 'maptalks';
import { createREGL, reshader, mat4, quat } from '@maptalks/gl';
import { intersectsBox } from 'frustum-intersects';

const vert = `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    uniform mat4 projViewModelMatrix;
    uniform mat4 positionMatrix;
    uniform mat4 modelMatrix;
    varying vec2 vTexCoords;
    #include <get_output>
    void main()
    {
        mat4 localPositionMatrix = getPositionMatrix();
        vec4 localPosition = getPosition(aPosition);
        gl_Position = projViewModelMatrix * localPositionMatrix * localPosition;
        vTexCoords = aTexCoord;
    }
`;

const frag = `
    precision mediump float;
    uniform sampler2D videoTexture;
    uniform float opacity;

    varying vec2 vTexCoords;
    void main() {
        vec4 color = texture2D(videoTexture, vTexCoords);
        gl_FragColor = color * opacity;
    }
`;
const shaderConfig = {
    vert,
    frag,
    uniforms : [
        {
            name: 'projViewModelMatrix',
            type: 'function',
            fn: (context, props) => {
                return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
            }
        },
        'texture',
        'opacity'
    ],
    positionAttribute : 'POSITION',
    extraCommandProps: {
        depth: {
            enable: true,
            func: 'always'
        },
        cull: {
            enable: false,
            face: 'back'
        },
        frontFace: 'cw',
        blend: {
            enable: true,
            func: {
                src: 'src alpha',
                dst: 'one minus src alpha'
            },
            equation: 'add'
        }
    }
};

const triangles = [1, 0, 3, 3, 2, 1];
class VideoLayerRenderer extends maptalks.renderer.CanvasRenderer {
    constructor(layer) {
        super(layer);
        this._scenes = {};
    }

    draw(timestamp, context) {
        this.prepareCanvas();
        this._renderScene(context);
    }

    drawOnInteracting(e, timestamp, context) {
        this._renderScene(context);
    }

    needToRedraw() {
        return true;
    }

    hitDetect() {
        return false;
    }

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            const layer = this.layer;
            const attributes = layer.options.glOptions || {
                alpha: true,
                depth: true,
                //antialias: true,
                stencil : true
            };
            this.glOptions = attributes;
            this.gl = this.gl || this._createGLContext(this.canvas, attributes);
            this.regl = createREGL({
                gl : this.gl,
                extensions : [
                    'ANGLE_instanced_arrays',
                    'OES_texture_float',
                    'OES_texture_half_float',
                    'OES_texture_float_linear',
                    'OES_texture_half_float_linear',
                    'EXT_shader_texture_lod',
                    'OES_element_index_uint',
                    'OES_standard_derivatives',
                    'WEBGL_depth_texture'
                ],
                optionalExtensions : this.layer.options['glExtensions'] || []
            });
        }
        this._initShader();
        this._initRenderer();
        const videoSurfaces = this.layer.getVideoSurfaces();
        for (let i = 0; i < videoSurfaces.length; i++) {
            this._createScene(videoSurfaces[i]);
        }
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) {}
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    _initRenderer() {
        const map = this.layer.getMap();
        const renderer = new reshader.Renderer(this.regl);
        this.renderer = renderer;
        this._uniforms = {
            'projMatrix': map.projMatrix,
            'projViewMatrix' : map.projViewMatrix,
            'viewMatrix': map.viewMatrix,
            'halton': [0.2107, -0.0202],
            'uHalton': [0.2107, -0.0202],
            'uCameraPosition' : map.cameraPosition,
            'cameraPosition' : map.cameraPosition,
            'globalTexSize' : [map.width, map.height]
        };
    }

    _getRegl() {
        return this.regl;
    }

    _initShader() {
        this.viewport = {
            x : 0,
            y : 0,
            width : () => {
                return this.canvas ? this.canvas.width : 1;
            },
            height : () => {
                return this.canvas ? this.canvas.height : 1;
            }
        };
        this._updateShader();
    }

    _updateShader() {
        if (this._shader) {
            this._shader.dispose();
        }
        if (this.layer.options['showTopAlways']) {
            shaderConfig.extraCommandProps.depth.mask = false;
            shaderConfig.extraCommandProps.depth.range = [0, 0];
        } else {
            delete shaderConfig.extraCommandProps.depth.mask;
            delete shaderConfig.extraCommandProps.depth.range;
        }
        shaderConfig.extraCommandProps.cull.enable = this.layer.options['doubleSide'] ? false : true;
        this._shader = new reshader.MeshShader(shaderConfig);
    }

    _createScene(videoSurface) {
        const texture =  this.regl.texture();
        const material = new reshader.Material({
            videoTexture: texture,
            opacity: 1.0
        });
        const coordinates = videoSurface.getCoordinates();
        const { worldCenter, points } = this._transformCoordToWorld(coordinates);
        const geometry = this._createGeometry(points);
        const mesh = new reshader.Mesh(geometry, material);
        this._updateMatrix(mesh, worldCenter);
        const scene = new reshader.Scene(mesh);
        const videoId = videoSurface._getVideoId();
        this._scenes[videoId] = scene;
    }

    _updateCoordinates(videoSurface) {
        const videoId = videoSurface._getVideoId();
        const scene = this._scenes[videoId];
        const mesh = scene.getMeshes()[0];
        const coordinates = videoSurface.getCoordinates();
        mesh.geometry.dispose();
        const { worldCenter, points } = this._transformCoordToWorld(coordinates);
        const geometry = this._createGeometry(points);
        mesh.geometry = geometry;
        this._updateMatrix(mesh, worldCenter);
    }

    _renderScene(context) {
        const visibles = this.layer.getVideoSurfaces().filter(videoSurface => {
            return videoSurface.isVisible();
        });
        if (!visibles.length) {
            return;
        }
        const renderScene = this._createSceneInFrustum(visibles);
        if (!renderScene) {
            return;
        }
        let targetFBO = null;
        if (context) {
            targetFBO = context.renderTarget && context.renderTarget.fbo;
        }
        this.renderer.render(this._shader, this._uniforms, renderScene, targetFBO);
    }

    _createGeometry(points) {
        return new reshader.Geometry({
            POSITION : points,
            TEXCOORD : [
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0
            ]
        },
        triangles,
        0,
        {
            primitive: 'triangles',
            //顶点的属性名称，默认为aPosition
            positionAttribute: 'POSITION',
            uv0Attribute: 'TEXCOORD',
            normalAttribute: 'NORMAL',
            //顶点个数，默认为3
            positionSize : 3
        });
    }

    _transformCoordToWorld(coordinates) {
        let points = [];
        const map = this.getMap();
        const tmpPolygon = new maptalks.Polygon(coordinates);
        const center = tmpPolygon.getCenter();
        const worldCenter = coordinateToWorld(map, center, 0);
        this._worldCenter = worldCenter;
        if (map) {
            coordinates.forEach(coordinate => {
                const coord = new maptalks.Coordinate(coordinate[0], coordinate[1]);
                const altitude = map.altitudeToPoint(coordinate[2] || 0, map.getGLRes());
                const worldPoint = coordinateToWorld(map, coord, altitude);
                worldPoint[0] = worldPoint[0] - worldCenter[0];
                worldPoint[1] = worldPoint[1] - worldCenter[1];
                points = points.concat(worldPoint);
            });
        }
        return { worldCenter, points };
    }

    _createSceneInFrustum(videoSurfaces) {
        const visibles = [];
        const map = this.layer.getMap();
        for (let i = 0; i < videoSurfaces.length; i++) {
            const videoSurface = videoSurfaces[i];
            const scene = this._scenes[videoSurface._getVideoId()];
            if (!scene) {
                continue;
            }
            const meshes = scene.getMeshes();
            for (let ii = 0; ii < meshes.length; ii++) {
                const mesh = meshes[ii];
                const material = mesh.getMaterial();
                const texture = material.get('videoTexture');
                if (texture && videoSurface._canDrawing()) {
                    texture(videoSurface.video);
                    material.set('opacity', videoSurface.getOpacity());
                }
                if (intersectsBox(map.projViewMatrix, mesh.getBoundingBox())) {
                    visibles.push(mesh);
                }
            }
        }
        return visibles.length ? new reshader.Scene(visibles) : null;
    }

    _updateMatrix(mesh, worldCenter) {
        mat4.fromRotationTranslationScale(mesh.localTransform,  quat.fromEuler([], 0, 0, 0), worldCenter, [1, 1, 1]);
    }

    remove() {
        if (this._shader) {
            this._shader.dispose();
        }
        super.remove();
    }

    _deleteScene(videoId) {
        const scene = this._scenes[videoId];
        if (!scene) {
            return;
        }
        const meshes = scene.getMeshes();
        meshes.forEach(mesh => {
            mesh.geometry.dispose();
            if (mesh.material) {
                mesh.material.dispose();
            }
            mesh.dispose();
        });
    }
}
export default VideoLayerRenderer;

function coordinateToWorld(map, coordinate, z) {
    if (!map) {
        return null;
    }
    const p = map.coordinateToPointAtRes(coordinate,  map.getGLRes());
    return [p.x, p.y, z];
}
