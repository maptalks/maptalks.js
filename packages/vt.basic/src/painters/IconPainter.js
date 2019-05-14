import CollisionPainter from './CollisionPainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/marker.vert';
import frag from './glsl/marker.frag';
import pickingVert from './glsl/marker.picking.vert';
import { getIconBox } from './util/get_icon_box';
import { getLabelBox } from './util/get_label_box';
import { setUniformFromSymbol, isNil } from '../Util';
import { createTextMesh, createTextShader, DEFAULT_UNIFORMS, GLYPH_SIZE, GAMMA_SCALE } from './util/create_text_painter';

import textVert from './glsl/text.vert';
import textFrag from './glsl/text.frag';
import textPickingVert from './glsl/text.picking.vert';

const BOX_ELEMENT_COUNT = 6;

const ICON_FILTER = mesh => {
    return mesh.uniforms['level'] === 0 && !!mesh.geometry.properties.iconAtlas;
};

const ICON_FILTER_N = mesh => {
    return mesh.uniforms['level'] > 0 && !!mesh.geometry.properties.iconAtlas;
};

const TEXT_FILTER = mesh => {
    return mesh.uniforms['level'] === 0 && !!mesh.geometry.properties.glyphAtlas;
};

const TEXT_FILTER_N = mesh => {
    return mesh.uniforms['level'] > 0 && !!mesh.geometry.properties.glyphAtlas;
};

const defaultUniforms = {
    'markerOpacity': 1,
    'pitchWithMap': 0,
    'markerPerspectiveRatio': 0,
    'rotateWithMap': 0,
    'markerWidth': 15,
    'markerHeight': 15,
    'markerDx': 0,
    'markerDy': 0,
    'markerRotation': 0
};

//temparary variables
const BOX = [];
const PROJ_MATRIX = [];

class IconPainter extends CollisionPainter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);

        this.propAllowOverlap = 'markerAllowOverlap';
        this.propIgnorePlacement = 'markerIgnorePlacement';
    }

    createGeometry(glData) {
        if (!glData || !glData.length) {
            return null;
        }
        return glData.map(data => super.createGeometry(data));
    }

    createMesh(geometries, transform) {
        const meshes = [];
        let iconMesh, textMesh;
        for (let i = 0; i < geometries.length; i++) {
            const geometry = geometries[i];
            if (geometry.properties.iconAtlas) {
                const mesh = iconMesh = this._createIconMesh(geometries[i], transform);
                if (mesh) meshes.push(mesh);
            } else if (geometry.properties.glyphAtlas) {
                const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
                const symbol = this.getSymbol();
                symbol['isIconText'] = true;
                const mesh = textMesh = createTextMesh(this.regl, geometry, transform, symbol, enableCollision);
                if (mesh.length) meshes.push(...mesh);
            }
        }
        if (iconMesh && textMesh && textMesh.length) {
            iconMesh._textMesh = textMesh[0];
            textMesh[0]._iconMesh = iconMesh;
        }
        return meshes;
    }

    _createIconMesh(geometry, transform) {
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
        if (geometry.isDisposed() || geometry.data.aPosition.length === 0) {
            return null;
        }
        const iconAtlas = geometry.properties.iconAtlas;
        if (!iconAtlas) {
            return null;
        }
        const symbol = this.getSymbol();
        geometry.properties.symbol = symbol;
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio
        };

        //!geometry.properties.aAnchor 以避免重复创建collision数据
        if (enableCollision && !geometry.properties.aAnchor) {
            const { aPosition, aShape } = geometry.data;
            const vertexCount = geometry.data.aPosition.length / 3;
            //initialize opacity array
            //aOpacity用于fading透明度的调整
            const aOpacity = new Uint8Array(vertexCount);
            for (let i = 0; i < aOpacity.length; i++) {
                aOpacity[i] = 0;
            }
            geometry.data.aOpacity = {
                usage: 'dynamic',
                data: aOpacity
            };
            geometry.properties.aOpacity = new Uint8Array(vertexCount);

            geometry.properties.aAnchor = aPosition;
            geometry.properties.aShape = aShape;
            //保存elements，隐藏icon时，从elements中删除icon的索引数据
            geometry.properties.elements = geometry.elements;
            geometry.properties.elemCtor = geometry.elements.constructor;
        }

        if (symbol['markerPitchAlignment'] === 'map') {
            uniforms['pitchWithMap'] = 1;
        }

        if (symbol['markerRotationAlignment'] === 'map') {
            uniforms['rotateWithMap'] = 1;
        }

        setUniformFromSymbol(uniforms, 'markerOpacity', symbol, 'markerOpacity');
        setUniformFromSymbol(uniforms, 'markerPerspectiveRatio', symbol, 'markerPerspectiveRatio');
        setUniformFromSymbol(uniforms, 'markerWidth', symbol, 'markerWidth');
        setUniformFromSymbol(uniforms, 'markerHeight', symbol, 'markerHeight');
        setUniformFromSymbol(uniforms, 'markerDx', symbol, 'markerDx');
        setUniformFromSymbol(uniforms, 'markerDy', symbol, 'markerDy');
        setUniformFromSymbol(uniforms, 'markerRotation', symbol, 'markerRotation', v => v * Math.PI / 180);

        uniforms['texture'] = iconAtlas;
        uniforms['texSize'] = [iconAtlas.width, iconAtlas.height];
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms, defaultUniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            transparent: true,
            castShadow: false,
            picking: true
        });
        if (enableCollision) {
            mesh.setDefines({
                'ENABLE_COLLISION': 1
            });
        }
        mesh.setLocalTransform(transform);
        return mesh;
    }

    preparePaint(context) {
        super.preparePaint(context);
        this._updateIconCollision(context.timestamp);
    }

    callCurrentTileShader(uniforms) {
        this.shader.filter = ICON_FILTER;
        this.renderer.render(this.shader, uniforms, this.scene);

        this._textShader.filter = TEXT_FILTER;
        this.renderer.render(this._textShader, uniforms, this.scene);
    }

    callBackgroundTileShader(uniforms) {
        this.shader.filter = ICON_FILTER_N;
        this.renderer.render(this.shader, uniforms, this.scene);

        this._textShader.filter = TEXT_FILTER_N;
        this.renderer.render(this._textShader, uniforms, this.scene);
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
        let meshes = this.scene.getMeshes().filter(mesh => !!mesh.geometry.properties.iconAtlas);
        if (!meshes || !meshes.length) {
            return;
        }

        const symbol = this.getSymbol();
        const hasIconText = symbol['isIconText'];
        if (!hasIconText) {
            this._updateIconOnly(meshes);
        } else {
            //如果icon包含文字，则改为遍历文字，因为文字无法像icon那样直接定位
            this._updateIconAndText(meshes);
        }
    }

    _updateIconOnly(meshes) {
        const fn = (elements, visibleElements, mesh, start, end, mvpMatrix, iconIndex) => {
            const visible = this.updateBoxCollisionFading(mesh, elements, 1, start, end, mvpMatrix, iconIndex);
            if (visible) {
                for (let i = start; i < end; i++) {
                    visibleElements.push(elements[i]);
                }
            }
        };
        for (let m = 0; m < meshes.length; m++) {
            const mesh = meshes[m];
            const geometry = mesh.geometry;
            const { elements, elemCtor, aOpacity } = geometry.properties;
            const visibleElements = [];
            this._forEachIcon(mesh, elements, (mesh, start, end, mvpMatrix, index) => {
                fn(elements, visibleElements, mesh, start, end, mvpMatrix, index);
            });
            geometry.setElements(new elemCtor(visibleElements));
            if (aOpacity._dirty) {
                geometry.updateData('aOpacity', aOpacity);
            }
        }
    }

    _updateIconAndText(meshes) {
        const fn = (textElements, iconElements, textVisibleElements, iconVisibleElements, mesh, start, end, mvpMatrix, iconIndex) => {
            const boxCount = (end - start) / 6;
            const visible = this.updateBoxCollisionFading(mesh, textElements, boxCount, start, end, mvpMatrix, iconIndex);
            if (visible) {
                for (let i = start; i < end; i++) {
                    textVisibleElements.push(textElements[i]);
                }
                for (let ii = 0; ii < BOX_ELEMENT_COUNT; ii++) {
                    iconVisibleElements.push(iconElements[iconIndex * BOX_ELEMENT_COUNT + ii]);
                }
            }
        };
        for (let m = 0; m < meshes.length; m++) {
            const iconMesh = meshes[m];
            const textMesh = iconMesh._textMesh;
            const symbol = textMesh.geometry.properties.symbol;
            textMesh.properties.textSize = !isNil(symbol['textSize']) ? symbol['textSize'] : DEFAULT_UNIFORMS['textSize'];
            const iconGeometry = iconMesh.geometry;
            const textGeometry = textMesh.geometry;
            const iconElements = iconGeometry.properties.elements;
            const textElements = textGeometry.properties.elements;
            const iconVisibleElements = [];
            const textVisibleElements = [];
            this._forEachLabel(textMesh, textElements, (mesh, start, end, mvpMatrix, index) => {
                fn(textElements, iconElements, textVisibleElements, iconVisibleElements, mesh, start, end, mvpMatrix, index);
            });
            iconGeometry.setElements(new iconGeometry.properties.elemCtor(iconVisibleElements));
            if (iconGeometry.properties.aOpacity._dirty) {
                iconGeometry.updateData('aOpacity', iconGeometry.properties.aOpacity);
            }
            textGeometry.setElements(new textGeometry.properties.elemCtor(textVisibleElements));
            if (textGeometry.properties.aOpacity._dirty) {
                textGeometry.updateData('aOpacity', textGeometry.properties.aOpacity);
            }
        }
    }

    setCollisionOpacity(mesh, allElements, aOpacity, value, start, end, boxIndex) {
        const iconMesh = mesh._iconMesh;
        if (iconMesh) {
            //icon and text
            super.setCollisionOpacity(mesh, allElements, aOpacity, value, start, end, boxIndex);
            const iconElements = iconMesh.geometry.properties.elements;
            aOpacity = iconMesh.geometry.properties.aOpacity;
            start = boxIndex * BOX_ELEMENT_COUNT;
            end = boxIndex * BOX_ELEMENT_COUNT + BOX_ELEMENT_COUNT;
            super.setCollisionOpacity(iconMesh, iconElements, aOpacity, value, start, end, boxIndex);
        } else {
            //only icon
            super.setCollisionOpacity(mesh, allElements, aOpacity, value, start, end, boxIndex);
        }

    }

    _forEachIcon(mesh, elements, fn) {
        const map = this.getMap();
        const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.localTransform);
        let index = 0;
        for (let i = 0; i < elements.length; i += BOX_ELEMENT_COUNT) {
            fn.call(this, mesh, i, i + BOX_ELEMENT_COUNT, matrix, index++);
        }
    }

    _forEachLabel(mesh, elements, fn) {
        const map = this.getMap();
        const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.localTransform);
        const { aPickingId, aCount } = mesh.geometry.properties;

        let index = 0;

        let idx = elements[0];
        let start = 0, current = aPickingId[idx];
        //每个文字有6个element
        for (let i = 0; i <= elements.length; i += BOX_ELEMENT_COUNT) {
            idx = elements[i];
            //pickingId发生变化，新的feature出现
            if (aPickingId[idx] !== current || i === elements.length) {
                const end = i/*  === elements.length - 6 ? elements.length : i */;
                const charCount = aCount[elements[start]];
                for (let ii = start; ii < end; ii += charCount * BOX_ELEMENT_COUNT) {
                    fn.call(this, mesh, ii, ii + charCount * BOX_ELEMENT_COUNT, matrix, index++);
                }
                current = aPickingId[idx];
                start = i;
            }
        }
    }

    isBoxCollides(mesh, elements, boxCount, start, end, matrix, boxIndex) {
        const map = this.getMap();
        const debugCollision = this.layer.options['debugCollision'];
        const iconMesh = mesh._iconMesh;
        const isFading = this.isBoxFading(mesh.properties.meshKey, boxIndex);
        const z = mesh.geometry.properties.z;
        let boxes;
        let hasCollides = false;
        if (!iconMesh) {
            //only icon
            const firstBoxIdx = elements[start];
            boxes = getIconBox(BOX, mesh, firstBoxIdx, matrix, map);
            hasCollides = this.isCollides(boxes, z) !== 0;
        } else {
            boxes = [];

            let offscreenCount = 0;
            // debugger
            //icon and text
            const firstBoxIdx = iconMesh.geometry.properties.elements[boxIndex * BOX_ELEMENT_COUNT];
            const iconBox = getIconBox(BOX, iconMesh, firstBoxIdx, matrix, map);
            boxes.push(iconBox.slice(0));
            const collides = this.isCollides(iconBox, z);
            if (collides === 1) {
                hasCollides = true;
                if (!isFading && !debugCollision) {
                    return {
                        collides: true,
                        boxes
                    };
                }
            } else if (collides === -1) {
                //offscreen
                offscreenCount++;
            }

            const charCount = boxCount;
            const textSize = mesh.properties.textSize;


            //insert every character's box into collision index
            for (let j = start; j < start + charCount * 6; j += 6) {
                //use int16array to save some memory
                const box = getLabelBox(BOX, mesh, textSize, elements[j], matrix, map);
                boxes.push(box.slice(0));
                const collides = this.isCollides(box, z);
                if (collides === 1) {
                    hasCollides = true;
                    if (!isFading && !debugCollision) {
                        return {
                            collides: true,
                            boxes
                        };
                    }
                } else if (collides === -1) {
                    //offscreen
                    offscreenCount++;
                }
            }
            if (offscreenCount === charCount + 1) {
                //所有的文字都offscreen时，可认为存在碰撞
                hasCollides = true;
                return {
                    collides: true,
                    boxes
                };

            }
        }

        if (debugCollision) {
            this.addCollisionDebugBox(boxes, hasCollides ? 0 : 1);
        }
        return {
            collides: hasCollides,
            boxes
        };
    }

    deleteMesh(meshes, keepGeometry) {
        if (!meshes) {
            return;
        }
        if (keepGeometry) {
            //keepGeometry时，文字纹理应该保留
            if (Array.isArray(meshes)) {
                meshes.forEach(m => {
                    if (m && m.material) {
                        delete m.material.uniforms.texture;
                    }
                });
            } else if (meshes.material) {
                delete meshes.material.uniforms.texture;
            }
        }
        super.deleteMesh(meshes, keepGeometry);
    }

    init() {
        const regl = this.regl;
        const canvas = this.canvas;

        this.renderer = new reshader.Renderer(regl);

        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return canvas ? canvas.width : 1;
            },
            height: () => {
                return canvas ? canvas.height : 1;
            }
        };

        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms: [
                'markerWidth',
                'markerHeight',
                'markerDx',
                'markerDy',
                'markerRotation',
                'cameraToCenterDistance',
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                },
                'texSize',
                'canvasSize',
                'iconSize',
                'pitchWithMap',
                'mapPitch',
                'markerPerspectiveRatio',
                'texture',
                'rotateWithMap',
                'mapRotation',
                'tileRatio',
                {
                    name: 'zoomScale',
                    type: 'function',
                    fn: function (context, props) {
                        return props['tileResolution'] / props['resolution'];
                    }
                }
            ],
            extraCommandProps: {
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
                    func: 'always'
                },
            }
        });

        const { uniforms, extraCommandProps } = createTextShader(this.layer);

        this._textShader = new reshader.MeshShader({
            vert: textVert, frag: textFrag,
            uniforms,
            extraCommandProps
        });

        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: pickingVert,
                    uniforms: [
                        'markerWidth',
                        'markerHeight',
                        'markerDx',
                        'markerDy',
                        'markerRotation',
                        'cameraToCenterDistance',
                        {
                            name: 'projViewModelMatrix',
                            type: 'function',
                            fn: function (context, props) {
                                return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                            }
                        },
                        'canvasSize',
                        'iconSize',
                        'pitchWithMap',
                        'mapPitch',
                        'markerPerspectiveRatio',
                        'rotateWithMap',
                        'mapRotation',
                        'tileRatio',
                        {
                            name: 'zoomScale',
                            type: 'function',
                            fn: function (context, props) {
                                return props['tileResolution'] / props['resolution'];
                            }
                        }
                    ]
                },
                this.pickingFBO
            );
            this.picking.filter = mesh => {
                return !!mesh.geometry.properties.iconAtlas;
            };

            this._textPicking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: textPickingVert,
                    uniforms
                },
                this.pickingFBO
            );
            this._textPicking.filter = mesh => {
                return !!mesh.geometry.properties.glyphAtlas;
            };
            //TODO pick(x,y)方法实现text的identify
        }
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix,
            cameraToCenterDistance = map.cameraToCenterDistance,
            canvasSize = [this.canvas.width, this.canvas.height];
        return {
            mapPitch: map.getPitch() * Math.PI / 180,
            mapRotation: map.getBearing() * Math.PI / 180,
            projViewMatrix,
            cameraToCenterDistance,
            canvasSize,
            iconSize: [24, 24],
            resolution: map.getResolution(),

            //text uniforms
            glyphSize: GLYPH_SIZE,
            // gammaScale : 0.64,
            gammaScale: GAMMA_SCALE,
        };
    }
}

export default IconPainter;
