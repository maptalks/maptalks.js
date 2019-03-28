import { vec3, vec4 } from '@maptalks/gl';
import CollisionPainter from './CollisionPainter';
import { TYPE_BYTES, isNil, evaluate } from '../Util';
import { reshader, mat4 } from '@maptalks/gl';
import { getCharOffset } from './util/get_char_offset';
import { projectLine } from './util/projection';
import { getLabelBox } from './util/get_label_box';
import { getLabelNormal } from './util/get_label_normal';
import Color from 'color';
import vert from './glsl/text.vert';
import vertAlongLine from './glsl/text.line.vert';
import frag from './glsl/text.frag';
import pickingVert from './glsl/text.picking.vert';
import linePickingVert from './glsl/text.line.picking.vert';
import DataAccessor from './util/DataAccessor';
import { projectPoint } from './util/projection';

const shaderFilter0 = mesh => {
    return mesh.uniforms['level'] === 0 && !mesh.geometry.properties.aNormal;
};

const shaderFilterN = mesh => {
    return mesh.uniforms['level'] > 0 && !mesh.geometry.properties.aNormal;
};

const shaderLineFilter0 = mesh => {
    return mesh.uniforms['level'] === 0 && mesh.geometry.properties.aNormal;
};

const shaderLineFilterN = mesh => {
    return mesh.uniforms['level'] > 0 && mesh.geometry.properties.aNormal;
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
const PROJ_MATRIX = [], LINE_OFFSET = [];

const BOX = [], BOX0 = [], BOX1 = [];

const ANCHOR = [], PROJ_ANCHOR = [], ANCHOR_BOX = [];

export default class TextPainter extends CollisionPainter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);
        this.propAllowOverlap = 'textAllowOverlap';
        this.propIgnorePlacement = 'textIgnorePlacement';
        this.layer.getRenderer().canvas.addEventListener('webglcontextlost', () => {
            // console.log(JSON.stringify(layer.getMap().getView()));
            // // const arr = new Int16Array(this._buffer);
            // // const rotations = new Int16Array(arr.length / 4);
            // // for (let i = 0; i < rotations.length; i++) {
            // //     rotations[i] = arr[i * 4 + 2] / 91;
            // // }
            // console.log(this._rotations.join());

        }, false);
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
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio
        };

        //避免重复创建属性数据
        if (!geometry.properties.aAnchor) {
            const { aPosition, aShape0 } = geometry.data;
            const vertexCount = aPosition.length / 3;
            geometry.properties.aPickingId = geometry.data.aPickingId;
            geometry.properties.aCount = geometry.data.aCount;
            delete geometry.data.aCount;

            if ((enableCollision || isLinePlacement)) {
                geometry.properties.aAnchor = aPosition;
                geometry.properties.aShape0 = aShape0;
            }

            if (isLinePlacement) {
                const { aVertical, aSegment, aGlyphOffset0, aGlyphOffset1 } = geometry.data;
                geometry.properties.aGlyphOffset0 = aGlyphOffset0;
                geometry.properties.aGlyphOffset1 = aGlyphOffset1;
                geometry.properties.aSegment = aSegment;
                geometry.properties.aVertical = aVertical;

                delete geometry.data.aSegment;
                delete geometry.data.aVertical;
                delete geometry.data.aGlyphOffset0;
                delete geometry.data.aGlyphOffset1;

                let stride = 0;
                const attributes = {};
                //TODO 给regl增加type支持，而不是统一为一种类型
                //https://github.com/regl-project/regl/pull/530
                if (symbol['textPitchAlignment'] === 'map') {
                    const shapeBuffer = new ArrayBuffer(vertexCount * 6);
                    geometry.properties.pitchShape = shapeBuffer;
                    geometry.addBuffer('pitchShape', shapeBuffer);
                    //pitch跟随map时，aOffset和aRotation不需要实时计算更新，只需要一次即可
                    geometry.data.aOffset = {
                        offset: 0,
                        size: 2,
                        stride: 6,
                        type: 'int16',
                        buffer: 'pitchShape'
                    };
                    geometry.data.aRotation = {
                        offset: 4,
                        size: 1,
                        stride: 6,
                        type: 'int16',
                        buffer: 'pitchShape'
                    };
                    attributes.aNormal = {
                        offset: stride++,
                        size: 1,
                        type: 'uint8',
                        buffer: 'mutable'
                    };
                } else {
                    attributes.aOffset = {
                        offset: stride,
                        size: 2,
                        type: 'int16',
                        buffer: 'mutable'
                    };
                    stride += 2 * 2;
                    attributes.aRotation = {
                        offset: stride,
                        size: 1,
                        type: 'int16',
                        buffer: 'mutable'
                    };
                    stride += 2;
                    attributes.aNormal = {
                        offset: stride,
                        size: 1,
                        type: 'uint8',
                        buffer: 'mutable'
                    };
                    stride += 1;
                }

                if (enableCollision) {
                    //非line placement时
                    attributes.aOpacity = {
                        offset: stride++,
                        size: 1,
                        type: 'int16',
                        buffer: 'mutable'
                    };
                }

                stride = bytesAlign(attributes);

                for (const p in attributes) {
                    geometry.data[p] = attributes[p];
                    geometry.data[p].stride = stride;
                }
                // geometry.properties.aOffset = geometry.data.aOffset = new Uint8Array(vertexCount * 2);

                const mutable = new ArrayBuffer(vertexCount * stride);

                const buffer = symbol['textPitchAlignment'] === 'map' ? geometry.properties.pitchShape : mutable;

                geometry.properties.aOffset = new DataAccessor(buffer, geometry.data['aOffset']);
                geometry.properties.aRotation = new DataAccessor(buffer, geometry.data['aRotation']);
                //aNormal = [isFlip * 2 + isVertical, ...];
                geometry.properties.aNormal = new DataAccessor(mutable, geometry.data['aNormal']);
                if (enableCollision) {
                    geometry.properties.aOpacity = new DataAccessor(mutable, geometry.data['aOpacity']);
                }

                geometry.addBuffer('mutable', {
                    usage: 'dynamic',
                    data: mutable
                });
                geometry.properties.mutable = mutable;


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

        let transparent = false;
        if (symbol['textOpacity'] || symbol['textOpacity'] === 0) {
            uniforms.textOpacity = symbol['textOpacity'];
            if (symbol['textOpacity'] < 1) {
                transparent = true;
            }
        }

        if (symbol['textFill']) {
            const color = Color(symbol['textFill']);
            uniforms.textFill = color.unitArray();
            if (uniforms.textFill.length === 3) {
                uniforms.textFill.push(1);
            }
        }

        if (symbol['textHaloFill']) {
            const color = Color(symbol['textHaloFill']);
            uniforms.textHaloFill = color.unitArray();
            if (uniforms.textHaloFill.length === 3) {
                uniforms.textHaloFill.push(1);
            }
        }

        if (symbol['textHaloBlur']) {
            uniforms.textHaloBlur = symbol['textHaloBlur'];
        }

        if (symbol['textHaloRadius']) {
            uniforms.textHaloRadius = symbol['textHaloRadius'];
            uniforms.isHalo = 1;
        }

        if (symbol['textHaloOpacity']) {
            uniforms.textHaloOpacity = symbol['textHaloOpacity'];
        }

        if (symbol['textPerspectiveRatio']) {
            uniforms.textPerspectiveRatio = symbol['textPerspectiveRatio'];
        } else if (isLinePlacement) {
            uniforms.textPerspectiveRatio = 1;
        }

        if (symbol['textRotationAlignment'] === 'map') {
            uniforms.rotateWithMap = 1;
        }

        if (symbol['textPitchAlignment'] === 'map') {
            uniforms.pitchWithMap = 1;
        }

        if (symbol['textSize']) {
            uniforms.textSize = symbol['textSize'];
        }

        if (symbol['textDx']) {
            uniforms.textDx = symbol['textDx'];
        }

        if (symbol['textDy']) {
            uniforms.textDy = symbol['textDy'];
        }

        if (symbol['textRotation']) {
            uniforms.textRotation = symbol['textRotation'] * Math.PI / 180;
        }

        const glyphAtlas = geometry.properties.glyphAtlas;
        uniforms['texture'] = glyphAtlas;
        uniforms['texSize'] = [glyphAtlas.width, glyphAtlas.height];

        geometry.properties.memory = geometry.getMemorySize();
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
        const angleCos = Math.cos(bearing),
            angleSin = Math.sin(bearing),
            pitchCos = Math.cos(0),
            pitchSin = Math.sin(0);
        const planeMatrix = [
            angleCos, -1.0 * angleSin * pitchCos, angleSin * pitchSin,
            angleSin, angleCos * pitchCos, -1.0 * angleCos * pitchSin,
            0.0, pitchSin, pitchCos
        ];
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
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (mesh.properties.isHalo || !mesh.isValid() || mesh.properties.level > 0 && this.shouldIgnoreBgTiles()) {
                //halo和正文共享的同一个geometry，无需更新
                continue;
            }
            const geometry = mesh.geometry;
            const symbol = geometry.properties.symbol;
            mesh.properties.textSize = !isNil(symbol['textSize']) ? evaluate(symbol['textSize'], null, map.getZoom()) : DEFAULT_UNIFORMS['textSize'];

            // const idx = geometry.properties.aPickingId[0];
            // console.log(`图层:${geometry.properties.features[idx].feature.layer},数据数量：${geometry.count / BOX_ELEMENT_COUNT}`);

            if (geometry.properties.aNormal) {
                //line placement
                if (!geometry.properties.line) {
                    continue;
                }
                this._updateLineLabel(mesh, planeMatrix);
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

        const uniforms = mesh.material.uniforms;
        const isPitchWithMap = uniforms['pitchWithMap'] === 1,
            shouldUpdate = !isPitchWithMap || !geometry.__offsetRotationUpdated;

        const allElements = geometryProps.elements;

        //pitchWithMap 而且 offset， rotation都更新过了，才能直接用allElements
        const elements = shouldUpdate ? [] : allElements;

        if (!isPitchWithMap) {
            const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.localTransform);
            //project line to screen coordinates
            const out = new Array(line.length);
            line = this._projectLine(out, line, matrix, map.width, map.height);
        }
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
        let visibleElements = enableCollision ? [] : elements;

        this._forEachLabel(mesh, allElements, (mesh, start, end, mvpMatrix, labelIndex) => {
            let visible = this._updateLabelAttributes(mesh, allElements, start, end, line, mvpMatrix, isPitchWithMap ? planeMatrix : null);
            if (!visible) {
                //offset 计算 miss，则立即隐藏文字，不进入fading
                return;
            }
            if (shouldUpdate && (isPitchWithMap || !enableCollision)) {
                //只有pitchWithMap，且offset,Rotation没有更新时（第一次运行），才需要更新elements
                for (let i = start; i < end; i++) {
                    elements.push(allElements[i]);
                }
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

        if (shouldUpdate && isPitchWithMap) {
            //pitchWithMap 时，elements只需更新一次，替换掉原elements
            geometryProps.elements = new geometryProps.elemCtor(elements);

            //pitchWithMap 时，aOffset和aRotation只需要更新一次
            const pitchShape = geometry.properties.pitchShape;
            geometry.updateBuffer('pitchShape', pitchShape);
        }
        const mutable = geometry.properties.mutable;
        // console.log(mutable.byteLength);
        // console.log(JSON.stringify(map.getView()));
        this._buffer = mutable;
        geometry.updateBuffer('mutable', mutable);
        if (visibleElements.length !== allElements.length || geometry.count !== visibleElements.length) {
            // geometry.properties.elements = elements;
            geometry.setElements(new geometryProps.elemCtor(visibleElements));
            // console.log('绘制', visibleElements.length / 6, '共', allElements.length / 6);
        }
        //tag if geometry's aOffset and aRotation is updated
        geometry.__offsetRotationUpdated = true;
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
    _updateLabelAttributes(mesh, meshElements, start, end, line, mvpMatrix, planeMatrix) {
        const map = this.getMap();
        const geometry = mesh.geometry;

        const uniforms = mesh.material.uniforms;
        const isPitchWithMap = uniforms['pitchWithMap'] === 1,
            //should update aOffset / aRotation?
            shouldUpdate = !isPitchWithMap || !geometry.__offsetRotationUpdated;
        const aOffset = geometry.properties.aOffset,
            aRotation = geometry.properties.aRotation,
            aAnchor = geometry.properties.aAnchor,
            { aVertical, aNormal } = geometry.properties;

        const isProjected = !planeMatrix;
        const idx = meshElements[start] * 3;
        let labelAnchor = vec3.set(ANCHOR, aAnchor[idx], aAnchor[idx + 1], aAnchor[idx + 2]);
        if (isProjected) {
            labelAnchor = projectPoint(PROJ_ANCHOR, labelAnchor, mvpMatrix, map.width, map.height);
            vec4.set(ANCHOR_BOX, labelAnchor[0], labelAnchor[1], labelAnchor[0], labelAnchor[1]);
            if (map.isOffscreen(ANCHOR_BOX)) {
                // debugger
                return false;
            }
        }

        const scale = isProjected ? 1 : geometry.properties.tileExtent / this.layer.options['tileSize'][0];

        let visible = true;

        if (visible) {
            //updateNormal
            //normal decides whether to flip and vertical
            const firstChrIdx = meshElements[start],
                lastChrIdx = meshElements[end - 1];
            // debugger
            this._updateNormal(aNormal, aOffset, aVertical, firstChrIdx, lastChrIdx, planeMatrix);
        }

        //if planeMatrix is null, line is in tile coordinates
        // line = planeMatrix ? line.line : line;
        if (shouldUpdate) {
            const textSize = mesh.properties.textSize;
            //array to store current text's elements
            for (let j = start; j < end; j += BOX_ELEMENT_COUNT) {
                const vertexStart = meshElements[j];
                const offset = getCharOffset(LINE_OFFSET, mesh, textSize, line, vertexStart, labelAnchor, scale);
                if (!offset) {
                    //remove whole text if any char is missed
                    visible = false;
                    break;
                }
                for (let ii = 0; ii < 4; ii++) {
                    // aOffset.set(2 * (vertexStart + ii), offset[0]);
                    // aOffset.set(2 * (vertexStart + ii) + 1, offset[1]);
                    // aRotation.set(vertexStart + ii, offset[2]);
                    aOffset.set(2 * (vertexStart + ii), offset[0]);
                    aOffset.set(2 * (vertexStart + ii) + 1, offset[1]);
                    aRotation.set(vertexStart + ii, offset[2] * 91);
                }
                //every character has 4 vertice, and 6 indexes
                //j, j + 1, j + 2 is the left-top triangle
                //j + 1, j + 2, j + 3 is the right-bottom triangle
                // labelElements.push(meshElements[j], meshElements[j + 1], meshElements[j + 2]);
                // labelElements.push(meshElements[j + 3], meshElements[j + 4], meshElements[j + 5]);
            }
        }


        return visible;
    }

    _updateNormal(aNormal, aOffset, aVertical, firstChrIdx, lastChrIdx, planeMatrix) {
        const map = this.getMap(),
            aspectRatio = map.width / map.height;
        const normal = getLabelNormal(aOffset, firstChrIdx, lastChrIdx, aVertical, aspectRatio, planeMatrix);
        //更新normal
        for (let i = firstChrIdx; i <= lastChrIdx; i++) {
            aNormal.set(i, normal);
        }
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
                    delete m.material.uniforms.texture;
                });
            } else {
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
                return !mesh.geometry.properties.aNormal;
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
                return !!mesh.geometry.properties.aNormal;
            };
        }
    }

    pick(x, y) {
        if (!this._hasLineText) {
            return super.pick(x, y);
        }
        if (!this._hasNormalText) {
            const picking = this.picking;
            this.picking = this._linePicking;
            const picked = super.pick(x, y);
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
            picked = this.picking.pick(x, y, uniforms, {
                viewMatrix: map.viewMatrix,
                projMatrix: map.projMatrix,
                returnPoint: true
            });
        }

        if (picked.meshId === null) {
            picking = this._linePicking;
            this._linePicking.render(this.scene.getMeshes(), uniforms, true);
            if (this._linePicking.getRenderedMeshes().length) {
                picked = this._linePicking.pick(x, y, uniforms, {
                    viewMatrix: map.viewMatrix,
                    projMatrix: map.projMatrix,
                    returnPoint: true
                });
            }
        }

        const { meshId, pickingId, point } = picked;
        const mesh = (meshId === 0 || meshId) && picking.getMeshAt(meshId);
        if (!mesh) {
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
