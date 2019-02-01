import CollisionPainter from './CollisionPainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/marker.vert';
import frag from './glsl/marker.frag';
import pickingVert from './glsl/marker.picking.vert';
import { getIconBox } from './util/get_icon_box';

const defaultUniforms = {
    'markerOpacity' : 1,
    'pitchWithMap' : 0,
    'markerPerspectiveRatio' : 0,
    'rotateWithMap' : 0,
};

//temparary variables
const BOX = [];
const PROJ_MATRIX = [];

class IconPainter extends CollisionPainter {
    constructor(regl, layer, sceneConfig) {
        super(regl, layer, sceneConfig);

        this.propAllowOverlap = 'markerAllowOverlap';
        this.propIgnorePlacement = 'markerIgnorePlacement';
    }

    createMesh(geometries, transform, tileData) {
        const meshes = [];
        if (!geometries || !geometries.length) {
            return meshes;
        }

        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;

        const packMeshes = tileData.meshes;
        for (let i = 0; i < packMeshes.length; i++) {
            const geometry = geometries[packMeshes[i].pack];
            if (geometry.isDisposed() || geometry.data.aPosition.length === 0) {
                continue;
            }
            const symbol = packMeshes[i].symbol;
            geometry.properties.symbol = symbol;
            const uniforms = {
                tileResolution : geometry.properties.tileResolution,
                tileRatio : geometry.properties.tileRatio
            };

            const { aPosition, aShape, aDxDy, aRotation } = geometry.data;

            if (enableCollision) {
                const vertexCount = geometry.data.aPosition.length / 3;
                //initialize opacity array
                //aOpacity用于fading透明度的调整
                const aOpacity = new Uint8Array(vertexCount);
                for (let i = 0; i < aOpacity.length; i++) {
                    aOpacity[i] = 255;
                }
                geometry.data.aOpacity = {
                    usage : 'dynamic',
                    data : aOpacity
                };
                geometry.properties.aOpacity = {
                    usage : 'dynamic',
                    data : new Uint8Array(vertexCount)
                };

                geometry.properties.aAnchor = aPosition;
                geometry.properties.aDxDy = aDxDy;
                geometry.properties.aShape = aShape;
                geometry.properties.aRotation = aRotation;
                //保存elements，隐藏icon时，从elements中删除icon的索引数据
                geometry.properties.elements = geometry.elements;
                geometry.properties.elemCtor = geometry.elements.constructor;
            }

            // let transparent = false;
            if (symbol['markerOpacity'] || symbol['markerOpacity'] === 0) {
                uniforms.markerOpacity = symbol['markerOpacity'];
            }

            const iconAtlas = geometry.properties.iconAtlas;
            uniforms['texture'] = iconAtlas;
            uniforms['texSize'] = [iconAtlas.width, iconAtlas.height];

            if (symbol['markerPitchAlignment'] === 'map') {
                uniforms['pitchWithMap'] = 1;
            }

            if (symbol['markerRotationAlignment'] === 'map') {
                uniforms.rotateWithMap = 1;
            }

            if (symbol['markerPerspectiveRatio']) {
                uniforms['markerPerspectiveRatio'] = symbol['markerPerspectiveRatio'];
            }
            geometry.generateBuffers(this.regl);
            const material = new reshader.Material(uniforms, defaultUniforms);
            const mesh = new reshader.Mesh(geometry, material, {
                transparent : true,
                castShadow : false,
                picking : true
            });
            if (enableCollision) {
                mesh.setDefines({
                    'ENABLE_COLLISION' : 1
                });
            }
            mesh.setLocalTransform(transform);
            meshes.push(mesh);
        }
        return meshes;
    }

    preparePaint(context) {
        super.preparePaint(context);
        this._updateIconCollision(context.timestamp);
    }

    /**
     * 遍历每个icon，判断其是否有碰撞， 如果有，则删除其elements
     * @param {Number} timestamp
     */
    _updateIconCollision(/* timestamp */) {
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
        if (!enableCollision) {
            return;
        }
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }

        const fn = (elements, visibleElements, mesh, start, end, mvpMatrix, iconIndex) => {
            const visible = this.updateBoxCollisionFading(mesh, elements, 1, start, end, mvpMatrix, iconIndex);
            if (visible) {
                for (let i = start; i < end; i++) {
                    visibleElements.push(elements[i]);
                }
            }
        };
        for (let m = 0; m < meshes.length; m++) {
            const mesh = meshes[m],
                geometry = mesh.geometry,
                elements = geometry.properties.elements;
            const visibleElements = geometry.properties.visibleElements = [];
            this._forEachIcon(mesh, elements, (mesh, start, end, mvpMatrix, index) => {
                fn(elements, visibleElements, mesh, start, end, mvpMatrix, index);
            });
            geometry.setElements({
                usage : 'dynamic',
                data : new geometry.properties.elemCtor(visibleElements)
            });
            geometry.updateData('aOpacity', geometry.properties.aOpacity);
        }
    }

    _forEachIcon(mesh, elements, fn) {
        const BOX_ELEMENT_COUNT = 6;
        const map = this.getMap();
        const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.localTransform);
        let index = 0;
        for (let i = 0; i < elements.length; i += BOX_ELEMENT_COUNT) {
            fn.call(this, mesh, i, i + BOX_ELEMENT_COUNT, matrix, index++);
        }
    }

    isBoxCollides(mesh, elements, boxCount, start, end, matrix) {
        const map = this.getMap();
        const debugCollision = this.layer.options['debugCollision'];

        const firstBoxIdx = elements[start];
        const box = getIconBox(BOX, mesh, firstBoxIdx, matrix, map);
        const hasCollides = this.isCollides(box, mesh.geometry.properties.z);

        if (debugCollision) {
            this.addCollisionDebugBox(box, hasCollides ? 0 : 1);
        }
        return {
            collides : hasCollides,
            boxes : box
        };
    }

    init() {
        const regl = this.regl;
        const canvas = this.canvas;

        this.renderer = new reshader.Renderer(regl);

        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return canvas ? canvas.width : 1;
            },
            height : () => {
                return canvas ? canvas.height : 1;
            }
        };

        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms : [
                'cameraToCenterDistance',
                {
                    name : 'projViewModelMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                },
                'texSize',
                'canvasSize',
                'pitchWithMap',
                'mapPitch',
                'markerPerspectiveRatio',
                'texture',
                'rotateWithMap',
                'mapRotation',
                'tileRatio',
                {
                    name : 'zoomScale',
                    type : 'function',
                    fn : function (context, props) {
                        return props['tileResolution'] / props['resolution'];
                    }
                }
            ],
            extraCommandProps : {
                viewport,
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        // srcAlpha: 1,
                        dst: 'one minus src alpha',
                        // dstAlpha: 1
                    },
                    equation: 'add',
                    // color: [0, 0, 0, 0]
                },
                depth: {
                    enable: true,
                    func : 'always'
                },
            }
        });
        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert : pickingVert,
                    uniforms : [
                        'cameraToCenterDistance',
                        {
                            name : 'projViewModelMatrix',
                            type : 'function',
                            fn : function (context, props) {
                                return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                            }
                        },
                        'canvasSize',
                        'pitchWithMap',
                        'mapPitch',
                        'markerPerspectiveRatio',
                        'rotateWithMap',
                        'mapRotation',
                        'tileRatio',
                        {
                            name : 'zoomScale',
                            type : 'function',
                            fn : function (context, props) {
                                return props['tileResolution'] / props['resolution'];
                            }
                        }
                    ]
                },
                this.pickingFBO
            );
        }
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix,
            cameraToCenterDistance = map.cameraToCenterDistance,
            canvasSize = [this.canvas.width, this.canvas.height];
        return {
            mapPitch : map.getPitch() * Math.PI / 180,
            mapRotation : map.getBearing() * Math.PI / 180,
            projViewMatrix,
            cameraToCenterDistance,
            canvasSize,
            resolution : map.getResolution(),
        };
    }
}

export default IconPainter;
