import { vec2, vec3, vec4, mat2, mat4, reshader } from '@maptalks/gl';
import CollisionPainter from './CollisionPainter';
import { extend, isNil } from '../Util';
import { getCharOffset } from './util/get_char_offset';
import { projectLine } from './util/projection';
import { getLabelBox } from './util/get_label_box';
import { getLabelNormal } from './util/get_label_normal';
import vert from './glsl/text.vert';
import vertAlongLine from './glsl/text.line.vert';
import frag from './glsl/text.frag';
import pickingVert from './glsl/text.picking.vert';
import linePickingVert from './glsl/text.line.picking.vert';
import { projectPoint } from './util/projection';
import { getShapeMatrix } from './util/box_util';
import { createTextMesh, DEFAULT_UNIFORMS, createTextShader, GLYPH_SIZE, GAMMA_SCALE, getTextFnTypeConfig } from './util/create_text_painter';
import { updateGeometryFnTypeAttrib } from './util/fn_type_util';

const shaderFilter0 = mesh => {
    return mesh.uniforms['level'] === 0 && mesh.geometry.properties.symbol['textPlacement'] !== 'line';
};

const shaderFilterN = mesh => {
    return mesh.uniforms['level'] > 0 && mesh.geometry.properties.symbol['textPlacement'] !== 'line';
};

const shaderLineFilter0 = mesh => {
    return mesh.uniforms['level'] === 0 && mesh.geometry.properties.symbol['textPlacement'] === 'line';
};

const shaderLineFilterN = mesh => {
    return mesh.uniforms['level'] > 0 && mesh.geometry.properties.symbol['textPlacement'] === 'line';
};

//label box 或 icon box 对应的element数量
const BOX_ELEMENT_COUNT = 6;

// temparary variables used later
const PROJ_MATRIX = [], CHAR_OFFSET = [];

const PLANE_MATRIX = [];

const BOX = [], BOX0 = [], BOX1 = [];

const ANCHOR = [], PROJ_ANCHOR = [], ANCHOR_BOX = [];

const MAT2 = [];

const SHAPE = [], OFFSET = [], AXIS_FACTOR = [1, -1];

const INT16 = new Int16Array(2);


const FIRST_CHAROFFSET = [], LAST_CHAROFFSET = [];

export default class TextPainter extends CollisionPainter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);
        this.propAllowOverlap = 'textAllowOverlap';
        this.propIgnorePlacement = 'textIgnorePlacement';
        // this.layer.getRenderer().canvas.addEventListener('webglcontextlost', e => {
        //     console.log(JSON.stringify(layer.getMap().getView()));
        //     const arr = new Int16Array(this._buffer);
        //     const arr2 = [];
        //     for (let i = 0; i < arr.length; i += 2) {
        //         arr2.push('[' + arr[i] + ',' + arr[i + 1] + ']');
        //     }
        //     console.log(arr2.join());
        //     // // const rotations = new Int16Array(arr.length / 4);
        //     // // for (let i = 0; i < rotations.length; i++) {
        //     // //     rotations[i] = arr[i * 4 + 2] / 91;
        //     // // }
        //     // console.log(this._rotations.join());
        //     e.preventDefault();

        // }, false);
        this._fnTypeConfig = getTextFnTypeConfig(this.getMap(), this.symbolDef);
        this._colorCache = {};
    }


    createGeometry(glData) {
        if (!glData.length) {
            return null;
        }
        //pointpack因为可能有splitSymbol，所以返回的glData是个数组，有多个pack
        let geometry;
        let pack;
        for (let i = 0; i < glData.length; i++) {
            pack = glData[i];
            if (pack.glyphAtlas) {
                geometry = super.createGeometry(pack);
            }
        }
        if (!geometry) {
            return null;
        }
        if (pack.lineVertex) {
            geometry.properties.line = pack.lineVertex;
            //原先createGeometry返回的geometry有多个，line.id用来区分是第几个geometry
            //现在geometry只会有一个，所以统一为0
            geometry.properties.line.id = 0;
        }
        return geometry;
    }

    createMesh(geometry, transform) {
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
        const symbol = this.getSymbol();

        const meshes = createTextMesh(this.regl, geometry, transform, symbol, this._fnTypeConfig, enableCollision);
        if (meshes.length) {
            const isLinePlacement = symbol['textPlacement'] === 'line';
            //tags for picking
            if (isLinePlacement) {
                this._hasLineText = true;
            } else {
                this._hasNormalText = true;
            }
        }

        return meshes;
    }

    preparePaint(context) {
        super.preparePaint(context);

        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        updateGeometryFnTypeAttrib(this._fnTypeConfig, meshes);

        this._projectedLinesCache = {};
        this._updateLabels(context.timestamp);
    }

    callCurrentTileShader(uniforms) {
        // let size = 0;
        // const meshes = this.scene.getMeshes();
        // for (let i = 0; i < meshes.length; i++) {
        //     if (meshes[i].geometry.properties.memory) {
        //         size += meshes[i].geometry.properties.memory;
        //     }
        // }
        // console.log('Buffer内存总大小', size);

        //1. render current tile level's meshes
        this.shader.filter = shaderFilter0;
        this.renderer.render(this.shader, uniforms, this.scene);

        this._shaderAlongLine.filter = shaderLineFilter0;
        this.renderer.render(this._shaderAlongLine, uniforms, this.scene);
    }

    callBackgroundTileShader(uniforms) {
        this.shader.filter = shaderFilterN;
        this.renderer.render(this.shader, uniforms, this.scene);

        this._shaderAlongLine.filter = shaderLineFilterN;
        this.renderer.render(this._shaderAlongLine, uniforms, this.scene);
    }

    /**
     * update flip and vertical data for each text
     */
    _updateLabels(/* timestamp */) {
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        const map = this.getMap();
        const bearing = -map.getBearing() * Math.PI / 180;
        const planeMatrix = mat2.fromRotation(PLANE_MATRIX, bearing);
        const fn = (elements, visibleElements, mesh, start, end, mvpMatrix, labelIndex) => {
            // debugger
            const boxCount = (end - start) / 6;
            const visible = this.updateBoxCollisionFading(mesh, elements, boxCount, start, end, mvpMatrix, labelIndex);
            if (visible) {
                for (let i = start; i < end; i++) {
                    visibleElements.push(elements[i]);
                }
            }
        };
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;

        // console.log('meshes数量', meshes.length, '字符数量', meshes.reduce((v, mesh) => {
        //     return v + mesh.geometry.count / BOX_ELEMENT_COUNT;
        // }, 0));
        // console.log(meshes.map(m => m.properties.meshKey));
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (mesh.properties.isHalo || !mesh.isValid() || mesh.properties.level > 0 && this.shouldIgnoreBgTiles()) {
                //halo和正文共享的同一个geometry，无需更新
                continue;
            }
            const geometry = mesh.geometry;
            const symbol = geometry.properties.symbol;
            mesh.properties.textSize = !isNil(symbol['textSize']) ? symbol['textSize'] : DEFAULT_UNIFORMS['textSize'];

            // const idx = geometry.properties.aPickingId[0];
            // console.log(`图层:${geometry.properties.features[idx].feature.layer},数据数量：${geometry.count / BOX_ELEMENT_COUNT}`);
            const meshKey = mesh.properties.meshKey;
            if (geometry.properties.symbol['textPlacement'] === 'line') {
                //line placement
                if (!geometry.properties.line) {
                    continue;
                }
                if (enableCollision) {
                    this.startMeshCollision(meshKey);
                }
                this._updateLineLabel(mesh, planeMatrix);
                const { aOffset, aOpacity } = geometry.properties;
                if (aOffset._dirty) {
                    geometry.updateData('aOffset', aOffset);
                    aOffset._dirty = false;
                }
                if (aOpacity && aOpacity._dirty) {
                    geometry.updateData('aOpacity', aOpacity);
                    aOpacity._dirty = false;
                }
                if (enableCollision) {
                    this.endMeshCollision(meshKey);
                }
            } else if (enableCollision) {
                this.startMeshCollision(meshKey);
                const { elements, elemCtor, aOpacity } = geometry.properties;
                const visibleElements = [];
                this._forEachLabel(mesh, elements, (mesh, start, end, mvpMatrix, labelIndex) => {
                    fn(elements, visibleElements, mesh, start, end, mvpMatrix, labelIndex);
                });
                if (aOpacity && aOpacity._dirty) {
                    geometry.updateData('aOpacity', aOpacity);
                }

                const allVisilbe = visibleElements.length === elements.length && geometry.count === elements.length;
                if (!allVisilbe) {
                    geometry.setElements(new elemCtor(visibleElements));
                }
                this.endMeshCollision(meshKey);
            }
        }
    }

    _updateLineLabel(mesh, planeMatrix) {
        const map = this.getMap(),
            geometry = mesh.geometry,
            geometryProps = geometry.properties;
        //pitch不跟随map时，需要根据屏幕位置实时计算各文字的位置和旋转角度并更新aOffset和aRotation
        //pitch跟随map时，根据line在tile内的坐标计算offset和rotation，只需要计算更新一次
        //aNormal在两种情况都要实时计算更新

        if (!this.sceneConfig['showOnZoomingOut'] && this.shouldLimitBox(mesh.properties.level)) {
            geometry.setElements([]);
            return;
        }

        let line = geometryProps.line;
        if (!line) {
            return;
        }

        // this._counter++;

        const uniforms = mesh.material.uniforms;
        const isPitchWithMap = uniforms['pitchWithMap'] === 1;

        const allElements = geometryProps.elements;

        //pitchWithMap 而且 offset， rotation都更新过了，才能直接用allElements

        if (!isPitchWithMap) {
            const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.localTransform);
            //project line to screen coordinates
            const out = new Array(line.length);
            line = this._projectLine(out, line, matrix, map.width, map.height);
        }
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
        let visibleElements = enableCollision ? [] : allElements;

        this._forEachLabel(mesh, allElements, (mesh, start, end, mvpMatrix, labelIndex) => {
            let visible = this._updateLabelAttributes(mesh, allElements, start, end, line, mvpMatrix, isPitchWithMap ? planeMatrix : null, labelIndex);
            // const meshKey = mesh.properties.meshKey;
            // let collision = this.getCachedCollision(meshKey, labelIndex);
            // let visible = true;
            // if (!collision || this.isCachedCollisionStale(meshKey)) {
            //     visible = this._updateLabelAttributes(mesh, allElements, start, end, line, mvpMatrix, isPitchWithMap ? planeMatrix : null, labelIndex);
            // }
            if (!visible) {
                //offset 计算 miss，则立即隐藏文字，不进入fading
                return;
            }
            if (!enableCollision) {
                return;
            }
            const boxCount = (end - start) / 6;
            visible = this.updateBoxCollisionFading(mesh, allElements, boxCount, start, end, mvpMatrix, labelIndex);
            if (visible) {
                for (let i = start; i < end; i++) {
                    visibleElements.push(allElements[i]);
                }
            }
        });
        if (visibleElements.length !== allElements.length || geometry.count !== visibleElements.length) {
            geometry.setElements(new geometryProps.elemCtor(visibleElements));
            // console.log('绘制', visibleElements.length / 6, '共', allElements.length / 6);
        }
    }

    _projectLine(out, line, matrix, width, height) {
        //line.id都为0，但不同的tile, matrix是不同的，故可以用matrix作为hash id
        const id = line.id + '-' + matrix.join();
        if (this._projectedLinesCache[id]) {
            return this._projectedLinesCache[id];
        }
        const prjLine = projectLine(out, line, matrix, width, height);
        this._projectedLinesCache[id] = prjLine;
        return prjLine;
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

    // start and end is the start and end index of a label
    _updateLabelAttributes(mesh, meshElements, start, end, line, mvpMatrix, planeMatrix, labelIndex) {
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
        const map = this.getMap();
        const geometry = mesh.geometry;
        const positionSize = geometry.desc.positionSize;

        const { aShape, aOffset, aAnchor } = geometry.properties;
        const aTextSize = geometry.properties['aTextSize'];
        const { level } = mesh.properties;

        //地图缩小时限制绘制的box数量，以及fading时，父级瓦片中的box数量，避免大量的box绘制，提升缩放的性能
        if (this.shouldLimitBox(level, true) && labelIndex > this.layer.options['boxLimitOnZoomout']) {
            if (!enableCollision) {
                resetOffset(aOffset, meshElements, start, end);
            }
            return false;
        }

        const isProjected = !planeMatrix;
        const idx = meshElements[start] * positionSize;
        let labelAnchor = vec3.set(ANCHOR, aAnchor[idx], aAnchor[idx + 1], positionSize === 2 ? 0 : aAnchor[idx + 2]);
        const projLabelAnchor = projectPoint(PROJ_ANCHOR, labelAnchor, mvpMatrix, map.width, map.height);
        vec4.set(ANCHOR_BOX, projLabelAnchor[0], projLabelAnchor[1], projLabelAnchor[0], projLabelAnchor[1]);
        if (map.isOffscreen(ANCHOR_BOX)) {
            if (!enableCollision) {
                resetOffset(aOffset, meshElements, start, end);
            }

            //如果anchor在屏幕外，则直接不可见，省略掉后续逻辑
            return false;
        }
        if (isProjected) {
            labelAnchor = projLabelAnchor;
        }

        const scale = isProjected ? 1 : geometry.properties.tileExtent / this.layer.options['tileSize'][0];

        let visible = true;

        const glyphSize = 24;

        //updateNormal
        //normal decides whether to flip and vertical
        const firstChrIdx = meshElements[start];
        const lastChrIdx = meshElements[end - 1];
        const textSize = aTextSize ? aTextSize[firstChrIdx] : mesh.properties.textSize;
        const normal = this._updateNormal(mesh, textSize, line, firstChrIdx, lastChrIdx, labelAnchor, scale, planeMatrix);
        if (normal === null) {
            resetOffset(aOffset, meshElements, start, end);
            //normal返回null说明计算过程中有文字visible是false，直接退出
            return false;
        }

        const uniforms = mesh.material.uniforms;
        const isPitchWithMap = uniforms['pitchWithMap'] === 1;
        const flip = Math.floor(normal / 2);
        const vertical = normal % 2;

        //以下在js中实现了 text.line.vert 中的原有的shape和offset算法：
        /**
        void main() {
            vec4 pos = projViewModelMatrix * vec4(aPosition, 1.0);
            float distance = pos.w;

            float cameraScale = distance / cameraToCenterDistance;

            float distanceRatio = (1.0 - cameraToCenterDistance / distance) * textPerspectiveRatio;
            //通过distance动态调整大小
            float perspectiveRatio = clamp(
                0.5 + 0.5 * (1.0 - distanceRatio),
                0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
                4.0);

            //精度修正：js中用int16存放旋转角，会丢失小数点，乘以64能在int16范围内尽量保留小数点后尽量多的位数
            float rotation = aRotation / 64.0 * RAD + textRotation;
            float flip = float(int(aNormal) / 2);
            float vertical = mod(aNormal, 2.0);
            rotation += mix(0.0, -PI / 2.0, vertical); //-90 degree

            float angleSin = sin(rotation);
            float angleCos = cos(rotation);
            mat2 shapeMatrix = mat2(angleCos, -angleSin, angleSin, angleCos);

            vec2 shape = shapeMatrix * aShape;

            vec2 offset = aOffset / 10.0; //精度修正：js中用int16存的offset,会丢失小数点，乘以十后就能保留小数点后1位
            vec2 texCoord = aTexCoord;

            shape = shape / glyphSize * textSize;

            if (pitchWithMap == 1.0) {
                offset = shape * vec2(1.0, -1.0) + offset;
                //乘以cameraScale可以抵消相机近大远小的透视效果
                gl_Position = projViewModelMatrix * vec4(aPosition + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
                vGammaScale = cameraScale + mapPitch / 4.0;
            } else {
                offset = (shape + offset * vec2(1.0, -1.0)) * 2.0 / canvasSize;
                pos.xy += offset * perspectiveRatio * pos.w;
                gl_Position = pos;
                //当textPerspective:
                //值为1.0时: vGammaScale用cameraScale动态计算
                //值为0.0时: vGammaScale固定为1.2
                vGammaScale = mix(1.0, cameraScale, textPerspectiveRatio);
            }

            gl_Position.xy += vec2(textDx, textDy) * 2.0 / canvasSize * distance;
         */

        //array to store current text's elements
        for (let j = start; j < end; j += BOX_ELEMENT_COUNT) {
            //every character has 4 vertice, and 6 indexes
            const vertexStart = meshElements[j];
            let offset;
            if (!flip && j === start) {
                offset = FIRST_CHAROFFSET;
            } else if (!flip && j === end - BOX_ELEMENT_COUNT) {
                offset = LAST_CHAROFFSET;
            } else {
                offset = getCharOffset(CHAR_OFFSET, mesh, textSize, line, vertexStart, labelAnchor, scale, flip);
            }
            if (!offset) {
                //remove whole text if any char is missed
                visible = false;
                if (!enableCollision) {
                    resetOffset(aOffset, meshElements, start, end);
                }
                break;
            }

            let rotation = offset[2];
            if (vertical) {
                rotation -= Math.PI / 2;
            }

            const shapeMatrix = getShapeMatrix(MAT2, rotation, 0, uniforms['rotateWithMap'], uniforms['pitchWithMap']);

            for (let ii = 0; ii < 4; ii++) {
                vec2.set(SHAPE, aShape[2 * (vertexStart + ii)] / 10, aShape[2 * (vertexStart + ii) + 1] / 10);
                vec2.scale(SHAPE, SHAPE, textSize / glyphSize);
                vec2.transformMat2(SHAPE, SHAPE, shapeMatrix);

                if (isPitchWithMap) {
                    vec2.multiply(SHAPE, SHAPE, AXIS_FACTOR);
                    vec2.add(OFFSET, SHAPE, offset);
                } else {
                    vec2.multiply(OFFSET, offset, AXIS_FACTOR);
                    // vec2.set(OFFSET, 0, OFFSET[1], 0);
                    vec2.add(OFFSET, SHAPE, OFFSET);
                }


                INT16[0] = OFFSET[0] * 10;
                INT16[1] = OFFSET[1] * 10;

                //*10 是为了保留小数点做的精度修正
                if (aOffset[2 * (vertexStart + ii)] !== INT16[0] ||
                    aOffset[2 * (vertexStart + ii) + 1] !== INT16[1]) {
                    aOffset._dirty = true;
                    //乘以十是为了提升shader中offset的精度
                    aOffset[2 * (vertexStart + ii)] = INT16[0];
                    aOffset[2 * (vertexStart + ii) + 1] = INT16[1];
                }


            }
        }

        return visible;
    }

    _updateNormal(mesh, textSize, line, firstChrIdx, lastChrIdx, labelAnchor, scale, planeMatrix) {
        const onlyOne = lastChrIdx - firstChrIdx <= 3;
        const map = this.getMap();
        const normal = onlyOne ? 0 : getLabelNormal(FIRST_CHAROFFSET, LAST_CHAROFFSET, mesh, textSize, line, firstChrIdx, lastChrIdx, labelAnchor, scale, map.width / map.height, planeMatrix);

        return normal;
    }

    isBoxCollides(mesh, elements, boxCount, start, end, matrix, boxIndex) {
        const map = this.getMap();
        const geoProps = mesh.geometry.properties;
        const symbol = geoProps.symbol;
        const isLinePlacement = symbol['textPlacement'] === 'line' && !symbol['isIconText'];
        const debugCollision = this.layer.options['debugCollision'];
        // const textSize = mesh.properties.textSize;
        const aTextSize = geoProps['aTextSize'];
        const textSize = aTextSize ? aTextSize[elements[start]] : mesh.properties.textSize;

        const isFading = this.isBoxFading(mesh.properties.meshKey, boxIndex);

        let hasCollides = false;
        const charCount = boxCount;
        const boxes = [];
        //1, 获取每个label的collision boxes
        //2, 将每个box在collision index中测试
        //   2.1 如果不冲突，则显示label
        //   2.2 如果冲突，则隐藏label
        if (!isLinePlacement && mesh.material.uniforms['rotateWithMap'] !== 1 && !symbol['textRotation']) {
            // 既没有沿线绘制，也没有随地图旋转时，文字本身也没有旋转时
            // 可以直接用第一个字的tl和最后一个字的br生成box，以减少box数量
            const firstChrIdx = elements[start],
                lastChrIdx = elements[start + charCount * 6 - 6];
            const tlBox = getLabelBox(BOX0, mesh, textSize, firstChrIdx, matrix, map),
                brBox = getLabelBox(BOX1, mesh, textSize, lastChrIdx, matrix, map);
            const box = BOX;
            box[0] = Math.min(tlBox[0], brBox[0]);
            box[1] = Math.min(tlBox[1], brBox[1]);
            box[2] = Math.max(tlBox[2], brBox[2]);
            box[3] = Math.max(tlBox[3], brBox[3]);
            boxes.push(box.slice(0));
            if (this.isCollides(box, geoProps.z)) {
                hasCollides = true;
                if (!isFading && !debugCollision) {
                    return {
                        collides: true,
                        boxes
                    };
                }
            }
        } else {
            let offscreenCount = 0;
            //insert every character's box into collision index
            for (let j = start; j < start + charCount * 6; j += 6) {
                //use int16array to save some memory
                const box = getLabelBox(BOX, mesh, textSize, elements[j], matrix, map);
                boxes.push(box.slice(0));
                const collides = this.isCollides(box, geoProps.z);
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
            if (offscreenCount === charCount) {
                //所有的文字都offscreen时，可认为存在碰撞
                hasCollides = true;
                if (!isFading && !debugCollision) {
                    return {
                        collides: true,
                        boxes
                    };
                }
            }
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

    delete() {
        super.delete();
        this._shaderAlongLine.dispose();
        delete this._projectedLinesCache;
        this._fadingRecords = {};
        if (this._linePicking) {
            this._linePicking.dispose();
        }
    }

    init() {
        // const map = this.getMap();
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        const { uniforms, extraCommandProps } = createTextShader(this.layer, this.sceneConfig);

        this._shaderAlongLine = new reshader.MeshShader({
            vert: vertAlongLine, frag,
            uniforms,
            extraCommandProps
        });
        let commandProps = extraCommandProps;
        if (extraCommandProps && extraCommandProps.stencil && extraCommandProps.stencil.func.cmp === '<') {
            //为解决intel gpu crash，stencil可能会被启用
            //但只有line-text渲染才需要，普通文字渲染不用打开stencil
            // commandProps = extend({}, extraCommandProps);
            // commandProps.stencil = extend({}, extraCommandProps.stencil);
            // commandProps.stencil.enable = false;
            commandProps = extend({}, extraCommandProps);
            commandProps.stencil = extend({}, extraCommandProps.stencil);
            commandProps.stencil.func = extend({}, extraCommandProps.stencil.func);
            commandProps.stencil.func.cmp = '<=';
        }
        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms,
            extraCommandProps: commandProps
        });

        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: pickingVert,
                    uniforms
                },
                this.pickingFBO
            );
            this.picking.filter = mesh => {
                return mesh.geometry.properties.symbol['textPlacement'] !== 'line';
            };

            this._linePicking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: linePickingVert,
                    uniforms
                },
                this.pickingFBO
            );
            this._linePicking.filter = mesh => {
                return mesh.geometry.properties.symbol['textPlacement'] === 'line';
            };
        }
    }

    pick(x, y, tolerance = 1) {
        if (!this._hasLineText) {
            return super.pick(x, y, tolerance);
        }
        if (!this._hasNormalText) {
            const picking = this.picking;
            this.picking = this._linePicking;
            const picked = super.pick(x, y, tolerance);
            this.picking = picking;
            return picked;
        }
        if (!this.pickingFBO || !this.picking) {
            return null;
        }
        const map = this.getMap();
        const uniforms = this.getUniformValues(map);
        this.picking.render(this.scene.getMeshes(), uniforms, true);
        let picking = this.picking;
        let picked = {};
        if (this.picking.getRenderedMeshes().length) {
            picked = this.picking.pick(x, y, tolerance, uniforms, {
                viewMatrix: map.viewMatrix,
                projMatrix: map.projMatrix,
                returnPoint: true
            });
        }

        if (picked.meshId === null) {
            picking = this._linePicking;
            this._linePicking.render(this.scene.getMeshes(), uniforms, true);
            if (this._linePicking.getRenderedMeshes().length) {
                picked = this._linePicking.pick(x, y, tolerance, uniforms, {
                    viewMatrix: map.viewMatrix,
                    projMatrix: map.projMatrix,
                    returnPoint: true
                });
            }
        }

        const { meshId, pickingId, point } = picked;
        const mesh = (meshId === 0 || meshId) && picking.getMeshAt(meshId);
        if (!mesh || !mesh.geometry) {
            //有可能mesh已经被回收，geometry不再存在
            return null;
        }
        const props = mesh.geometry.properties;
        return {
            data: props && props.features && props.features[pickingId],
            point
        };
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix,
            cameraToCenterDistance = map.cameraToCenterDistance,
            canvasSize = [this.canvas.width, this.canvas.height];
        //手动构造map的x与z轴的三维旋转矩阵
        //http://planning.cs.uiuc.edu/node102.html
        // const pitch = map.getPitch(),
        //     bearing = -map.getBearing();
        // const q = quat.fromEuler([], pitch, 0, bearing);
        // const planeMatrix = mat4.fromRotationTranslation([], q, [0, 0, 0]);

        // const pitch = map.getPitch() * Math.PI / 180,
        //     bearing = -map.getBearing() * Math.PI / 180;
        // const angleCos = Math.cos(bearing),
        //     angleSin = Math.sin(bearing),
        //     pitchCos = Math.cos(pitch),
        //     pitchSin = Math.sin(pitch);
        // const planeMatrix = [
        //     angleCos, -1.0 * angleSin * pitchCos, angleSin * pitchSin,
        //     angleSin, angleCos * pitchCos, -1.0 * angleCos * pitchSin,
        //     0.0, pitchSin, pitchCos
        // ];

        return {
            mapPitch: map.getPitch() * Math.PI / 180,
            mapRotation: map.getBearing() * Math.PI / 180,
            projViewMatrix,
            viewMatrix: map.viewMatrix,
            cameraToCenterDistance, canvasSize,
            glyphSize: GLYPH_SIZE,
            // gammaScale : 0.64,
            gammaScale: GAMMA_SCALE,
            resolution: map.getResolution(),
            // planeMatrix
        };
    }
}

const contentExpRe = /\{([\w_]+)\}/g;
/**
 * Replace variables wrapped by square brackets ({foo}) with actual values in props.
 * @example
 *     // will returns 'John is awesome'
 *     const actual = replaceVariable('{foo} is awesome', {'foo' : 'John'});
 * @param {String} str      - string to replace
 * @param {Object} props    - variable value properties
 * @return {String}
 * @memberOf StringUtil
 */
export function resolveText(str, props) {
    return str.replace(contentExpRe, function (str, key) {
        if (!props) {
            return '';
        }
        const value = props[key];
        if (value === null || value === undefined) {
            return '';
        } else if (Array.isArray(value)) {
            return value.join();
        }
        return value;
    });
}

// function bytesAlign(attributes) {
//     let max = 0;
//     let stride = 0;
//     for (const p in attributes) {
//         const type = attributes[p].type;
//         if (TYPE_BYTES[type] > max) {
//             max = TYPE_BYTES[type];
//         }
//         stride += TYPE_BYTES[type] * attributes[p].size || 1;
//     }
//     if (stride % max > 0) {
//         stride += (max - stride % max);
//     }
//     return stride;
// }

function resetOffset(aOffset, meshElements, start, end) {
    for (let j = start; j < end; j += BOX_ELEMENT_COUNT) {
        //every character has 4 vertice, and 6 indexes
        const vertexStart = meshElements[j];
        for (let ii = 0; ii < 4; ii++) {
            if (aOffset[2 * (vertexStart + ii)] ||
                aOffset[2 * (vertexStart + ii) + 1]) {
                aOffset._dirty = true;
                aOffset[2 * (vertexStart + ii)] = 0;
                aOffset[2 * (vertexStart + ii) + 1] = 0;
            }
        }
    }
}
