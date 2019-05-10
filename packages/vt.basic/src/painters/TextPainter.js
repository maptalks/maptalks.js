import { vec2, vec3, vec4, mat2 } from '@maptalks/gl';
import CollisionPainter from './CollisionPainter';
import { TYPE_BYTES, isNil, setUniformFromSymbol, createColorSetter } from '../Util';
import { reshader, mat4 } from '@maptalks/gl';
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

const DEFAULT_UNIFORMS = {
    'textFill': [0, 0, 0, 1],
    'textOpacity': 1,
    'pitchWithMap': 0,
    'rotateWithMap': 0,
    'textHaloRadius': 0,
    'textHaloFill': [1, 1, 1, 1],
    'textHaloBlur': 0,
    'textHaloOpacity': 1,
    'isHalo': 0,
    'textPerspectiveRatio': 0,
    'textSize': 14,
    'textDx': 0,
    'textDy': 0,
    'textRotation': 0
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
    }

    createGeometry(glData) {
        const geometry = super.createGeometry.apply(this, arguments);
        if (glData.lineVertex) {
            geometry.properties.line = glData.lineVertex;
            //原先createGeometry返回的geometry有多个，line.id用来区分是第几个geometry
            //现在geometry只会有一个，所以统一为0
            geometry.properties.line.id = 0;
        }
        return geometry;
    }

    createMesh(geometry, transform) {
        const meshes = [];
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;

        if (geometry.isDisposed() || geometry.data.aPosition.length === 0) {
            return meshes;
        }
        const glyphAtlas = geometry.properties.glyphAtlas;
        if (!glyphAtlas) {
            return meshes;
        }

        const symbol = this.getSymbol();
        if (symbol['textSize'] === 0 || symbol['textOpacity'] === 0) {
            return meshes;
        }
        geometry.properties.symbol = symbol;
        const isLinePlacement = symbol['textPlacement'] === 'line';
        //tags for picking
        if (isLinePlacement) {
            this._hasLineText = true;
        } else {
            this._hasNormalText = true;
        }

        //避免重复创建属性数据
        if (!geometry.properties.aAnchor) {
            this._prepareGeometry(geometry);
        }

        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio
        };
        this._setMeshUniforms(uniforms, symbol);

        let transparent = false;
        if (symbol['textOpacity'] < 1) {
            transparent = true;
        }

        uniforms['texture'] = glyphAtlas;
        uniforms['texSize'] = [glyphAtlas.width, glyphAtlas.height];

        geometry.properties.memorySize = geometry.getMemorySize();
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, material, {
            transparent,
            castShadow: false,
            picking: true
        });
        mesh.setLocalTransform(transform);
        //设置ignoreCollision，此mesh略掉collision检测
        //halo mesh会进行collision检测，并统一更新elements
        if (symbol['textHaloRadius']) {
            mesh.properties.isHalo = true;
        }
        if (enableCollision) {
            mesh.setDefines({
                'ENABLE_COLLISION': 1
            });
        }
        meshes.push(mesh);

        if (symbol['textHaloRadius']) {
            uniforms.isHalo = 0;
            const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
            const mesh = new reshader.Mesh(geometry, material, {
                transparent,
                castShadow: false,
                picking: true
            });
            if (enableCollision) {
                mesh.setDefines({
                    'ENABLE_COLLISION': 1
                });
            }
            mesh.setLocalTransform(transform);
            meshes.push(mesh);
        }
        return meshes;
    }

    _prepareGeometry(geometry) {
        const { symbol } = geometry.properties;
        const isLinePlacement = symbol['textPlacement'] === 'line';
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
        const { aPosition, aShape } = geometry.data;
        const vertexCount = aPosition.length / 3;
        geometry.properties.aPickingId = geometry.data.aPickingId;
        geometry.properties.aCount = geometry.data.aCount;
        delete geometry.data.aCount;

        if ((enableCollision || isLinePlacement)) {
            geometry.properties.aAnchor = aPosition;
            geometry.properties.aShape = aShape;
        }

        if (isLinePlacement) {
            const { aVertical, aSegment, aGlyphOffset } = geometry.data;
            geometry.properties.aGlyphOffset = aGlyphOffset;
            geometry.properties.aSegment = aSegment;
            geometry.properties.aVertical = aVertical;

            delete geometry.data.aSegment;
            delete geometry.data.aVertical;
            delete geometry.data.aGlyphOffset;

            geometry.data.aOffset = {
                usage: 'dynamic',
                data: new Int16Array(aShape.length)
            };
            geometry.properties.aOffset = new Int16Array(aShape.length);

            if (enableCollision) {
                //非line placement时
                geometry.data.aOpacity = {
                    usage: 'dynamic',
                    data: new Uint8Array(aShape.length / 2)
                };
                geometry.properties.aOpacity = new Uint8Array(aShape.length / 2);
            }


        } else if (enableCollision) {
            const aOpacity = geometry.properties.aOpacity = new Uint8Array(vertexCount);
            for (let i = 0; i < aOpacity.length; i++) {
                aOpacity[i] = 255;
            }
            //非line placement时
            geometry.data.aOpacity = {
                usage: 'dynamic',
                data: new Uint8Array(aOpacity.length)
            };
        }

        if (isLinePlacement || enableCollision) {
            geometry.properties.elements = geometry.elements;
            geometry.properties.elemCtor = geometry.elements.constructor;
        }
    }

    _setMeshUniforms(uniforms, symbol) {
        this._colorCache = this._colorCache || {};
        setUniformFromSymbol(uniforms, 'textOpacity', symbol, 'textOpacity');
        setUniformFromSymbol(uniforms, 'textFill', symbol, 'textFill', createColorSetter(this._colorCache));
        setUniformFromSymbol(uniforms, 'textHaloFill', symbol, 'textHaloFill', createColorSetter(this._colorCache));
        setUniformFromSymbol(uniforms, 'textHaloBlur', symbol, 'textHaloBlur');
        if (symbol['textHaloRadius']) {
            setUniformFromSymbol(uniforms, 'textHaloRadius', symbol, 'textHaloRadius');
            uniforms.isHalo = 1;
        }
        setUniformFromSymbol(uniforms, 'textHaloOpacity', symbol, 'textHaloOpacity');
        if (symbol['textPerspectiveRatio']) {
            uniforms.textPerspectiveRatio = symbol['textPerspectiveRatio'];
        } else if (symbol['textPlacement'] === 'line') {
            uniforms.textPerspectiveRatio = 1;
        }
        if (symbol['textRotationAlignment'] === 'map') {
            uniforms.rotateWithMap = 1;
        }
        if (symbol['textPitchAlignment'] === 'map') {
            uniforms.pitchWithMap = 1;
        }
        setUniformFromSymbol(uniforms, 'textSize', symbol, 'textSize');
        setUniformFromSymbol(uniforms, 'textDx', symbol, 'textDx');
        setUniformFromSymbol(uniforms, 'textDy', symbol, 'textDy');
        setUniformFromSymbol(uniforms, 'textRotation', symbol, 'textRotation', v => v * Math.PI / 180);
    }

    preparePaint(context) {
        super.preparePaint(context);
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

            if (geometry.properties.symbol['textPlacement'] === 'line') {
                //line placement
                if (!geometry.properties.line) {
                    continue;
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
            } else if (enableCollision) {
                const elements = geometry.properties.elements;
                const visibleElements = [];
                this._forEachLabel(mesh, elements, (mesh, start, end, mvpMatrix, labelIndex) => {
                    fn(elements, visibleElements, mesh, start, end, mvpMatrix, labelIndex);
                });
                geometry.updateData('aOpacity', geometry.properties.aOpacity);

                const allVisilbe = visibleElements.length === elements.length && geometry.count === elements.length;
                if (!allVisilbe) {
                    geometry.setElements(new geometry.properties.elemCtor(visibleElements));
                }
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

        const properties = mesh.geometry.properties;
        let line = properties.line;
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
        const geometry = mesh.geometry,
            geometryProps = geometry.properties;
        const pickingId = geometryProps.aPickingId;

        let index = 0;

        let idx = elements[0];
        let start = 0, current = pickingId[idx];
        //每个文字有6个element
        for (let i = 0; i <= elements.length; i += BOX_ELEMENT_COUNT) {
            idx = elements[i];
            //pickingId发生变化，新的feature出现
            if (pickingId[idx] !== current || i === elements.length) {
                const end = i/*  === elements.length - 6 ? elements.length : i */;
                const charCount = geometryProps.aCount[elements[start]];
                for (let ii = start; ii < end; ii += charCount * BOX_ELEMENT_COUNT) {
                    fn.call(this, mesh, ii, ii + charCount * BOX_ELEMENT_COUNT, matrix, index++);
                }
                current = pickingId[idx];
                start = i;
            }
        }
    }

    // start and end is the start and end index of a label
    _updateLabelAttributes(mesh, meshElements, start, end, line, mvpMatrix, planeMatrix, labelIndex) {
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
        const map = this.getMap();
        const geometry = mesh.geometry;

        const { aShape, aOffset, aAnchor } = geometry.properties;
        const { level } = mesh.properties;

        //地图缩小时限制绘制的box数量，以及fading时，父级瓦片中的box数量，避免大量的box绘制，提升缩放的性能
        if (this.shouldLimitBox(level, true) && labelIndex > this.layer.options['boxLimitOnZoomout']) {
            if (!enableCollision) {
                resetOffset(aOffset, meshElements, start, end);
            }
            return false;
        }

        const isProjected = !planeMatrix;
        const idx = meshElements[start] * 3;
        let labelAnchor = vec3.set(ANCHOR, aAnchor[idx], aAnchor[idx + 1], aAnchor[idx + 2]);
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

        const textSize = mesh.properties.textSize;
        const glyphSize = 24;

        //updateNormal
        //normal decides whether to flip and vertical
        const firstChrIdx = meshElements[start];
        const lastChrIdx = meshElements[end - 1];
        // debugger
        const normal = this._updateNormal(mesh, textSize, line, firstChrIdx, lastChrIdx, labelAnchor, scale, planeMatrix);

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
            const offset = getCharOffset(CHAR_OFFSET, mesh, textSize, line, vertexStart, labelAnchor, scale, flip);
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
                vec2.set(SHAPE, aShape[2 * (vertexStart + ii)], aShape[2 * (vertexStart + ii) + 1]);
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
        const normal = onlyOne ? 0 : getLabelNormal(mesh, textSize, line, firstChrIdx, lastChrIdx, labelAnchor, scale, map.width / map.height, planeMatrix);

        return normal;
    }

    isBoxCollides(mesh, elements, boxCount, start, end, matrix, boxIndex) {
        const map = this.getMap();
        const geoProps = mesh.geometry.properties;
        const symbol = geoProps.symbol;
        const isLinePlacement = (symbol['textPlacement'] === 'line');
        const debugCollision = this.layer.options['debugCollision'];
        const textSize = mesh.properties.textSize;

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

        const uniforms = [
            'textSize',
            'textDx',
            'textDy',
            'textRotation',
            'cameraToCenterDistance',
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                }
            },
            'textPerspectiveRatio',
            'texSize',
            'canvasSize',
            'glyphSize',
            'pitchWithMap',
            'mapPitch',
            'texture',
            'gammaScale',
            'textFill',
            'textOpacity',
            'textHaloRadius',
            'textHaloFill',
            'textHaloBlur',
            'textHaloOpacity',
            'isHalo',
            {
                name: 'zoomScale',
                type: 'function',
                fn: function (context, props) {
                    return props['tileResolution'] / props['resolution'];
                }
            },
            'rotateWithMap',
            'mapRotation',
            'tileRatio'
        ];

        const extraCommandProps = {
            viewport,
            stencil: { //fix #94, intel显卡的崩溃和blending关系比较大，开启stencil来避免blending
                enable: this.layer.getRenderer().isEnableWorkAround('win-intel-gpu-crash'),
                mask: 0xFF,
                func: {
                    //halo的stencil ref更大，允许文字填充在halo上绘制
                    cmp: '<',
                    ref: (context, props) => {
                        return props.isHalo + 1;
                    },
                    mask: 0xFF
                },
                opFront: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: 'replace'
                },
                opBack: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: 'replace'
                }
            },
            blend: {
                enable: true,
                func: {
                    // src: 'src alpha',
                    // dst: 'one minus src alpha'
                    src: 'one',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            depth: {
                enable: true,
                func: 'always'
            },
        };

        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms,
            extraCommandProps
        });
        this._shaderAlongLine = new reshader.MeshShader({
            vert: vertAlongLine, frag,
            uniforms,
            extraCommandProps
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
            glyphSize: 24,
            // gammaScale : 0.64,
            gammaScale: 0.79,
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

function bytesAlign(attributes) {
    let max = 0;
    let stride = 0;
    for (const p in attributes) {
        const type = attributes[p].type;
        if (TYPE_BYTES[type] > max) {
            max = TYPE_BYTES[type];
        }
        stride += TYPE_BYTES[type] * attributes[p].size || 1;
    }
    if (stride % max > 0) {
        stride += (max - stride % max);
    }
    return stride;
}

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

function isWinIntelGPU(gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo && typeof navigator !== 'undefined') {
        //e.g. ANGLE (Intel(R) HD Graphics 620
        const gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const win = navigator.platform === 'Win32' || navigator.platform === 'Win64';
        if (gpu && gpu.toLowerCase().indexOf('intel') >= 0 && win) {
            return true;
        }
    }
    return false;
}
