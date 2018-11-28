import Painter from './Painter';
import { reshader, vec2, vec3, mat4 } from '@maptalks/gl';
import { getLineOffset } from './util/line_offset';
import { projectLine, projectPoint } from './util/projection';
import Color from 'color';
import vert from './glsl/text.vert';
import vertAlongLine from './glsl/text.line.vert';
import frag from './glsl/text.frag';
import pickingVert from './glsl/text.picking.vert';

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

const defaultUniforms = {
    'textFill' : [0, 0, 0, 1],
    'textOpacity' : 1,
    'pitchWithMap' : 0,
    'rotateWithMap' : 0,
    'textHaloRadius' : 0,
    'textHaloFill' : [1, 1, 1, 1],
    'textHaloBlur' : 0,
    'textHaloOpacity' : 1,
    'isHalo' : 0,
    'fadeOpacity' : 1,
    'textPerspectiveRatio' : 0
};

// temparary variables used later
const PROJ_MATRIX = [], FIRST_POINT = [], LAST_POINT = [],
    ANCHOR = [], PROJ_ANCHOR = [], GLYPH_OFFSET = [], DXDY = [], SEGMENT = [], LINE_OFFSET = [];

class TextPainter extends Painter {
    needToRedraw() {
        return this._redraw;
    }

    createGeometry(glData) {
        const geometries = super.createGeometry.apply(this, arguments);
        for (let i = 0; i < geometries.length; i++) {
            if (glData.packs[i].lineVertex) {
                geometries[i].properties.line = glData.packs[i].lineVertex;
            }
        }

        return geometries;
    }

    createMesh(geometries, transform, tileData) {
        if (!geometries || !geometries.length) {
            return null;
        }

        const packMeshes = tileData.meshes;
        const meshes = [];
        for (let i = 0; i < packMeshes.length; i++) {
            let geometry = geometries[packMeshes[i].pack];
            if (geometry.isDisposed() || geometry.data.aPosition.length === 0) {
                continue;
            }
            const symbol = packMeshes[i].symbol;
            geometry.properties.symbol = symbol;
            const uniforms = {
                tileResolution : geometry.properties.res,
                tileRatio : geometry.properties.tileRatio
            };

            const isAlongLine = (symbol['textPlacement'] === 'line');
            if (isAlongLine) {
                const { aPosition, aGlyphOffset, aOffset, aRotation, aSegment, aSize } = geometry.data;

                geometry.properties.aAnchor = aPosition;
                geometry.properties.aGlyphOffset = aGlyphOffset;
                geometry.properties.aDxDy = aOffset;
                geometry.properties.aTextRotation = aRotation;
                geometry.properties.aSegment = aSegment;
                geometry.properties.aSize = aSize;
                geometry.properties.aPickingId = geometry.data.aPickingId;
                geometry.properties.elemCtor = geometry.elements.constructor;

                delete geometry.data.aSegment;
                delete geometry.data.aGlyphOffset;

                geometry.properties.aOffset = geometry.data.aOffset = {
                    usage : 'dynamic',
                    data : new aOffset.constructor(aOffset.length)
                };
                geometry.properties.aRotation = geometry.data.aRotation = {
                    usage : 'dynamic',
                    data : new aRotation.constructor(aRotation.length)
                };
                //aNormal = [isFlip * 2 + isVertical, ...];
                geometry.data.aNormal = geometry.properties.aNormal = {
                    usage : 'dynamic',
                    data : new Uint8Array(aOffset.length / 2)
                };
                //TODO 增加是否是vertical字符的判断
                uniforms.isVerticalChar = true;
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
            } else if (isAlongLine) {
                uniforms.textPerspectiveRatio = 1;
            }

            if (symbol['textRotationAlignment'] === 'map') {
                uniforms.rotateWithMap = 1;
            }

            if (symbol['textPitchAlignment'] === 'map') {
                uniforms.pitchWithMap = 1;
            }

            const glyphAtlas = geometry.properties.glyphAtlas;
            uniforms['texture'] = glyphAtlas;
            uniforms['texSize'] = [glyphAtlas.width, glyphAtlas.height];

            geometry.generateBuffers(this.regl);
            const material = new reshader.Material(uniforms, defaultUniforms);
            const mesh = new reshader.Mesh(geometry, material, {
                transparent,
                castShadow : false,
                picking : true
            });
            mesh.setLocalTransform(transform);
            meshes.push(mesh);

            if (symbol['textHaloRadius']) {
                uniforms.isHalo = 0;
                const material = new reshader.Material(uniforms, defaultUniforms);
                const mesh = new reshader.Mesh(geometry, material, {
                    transparent,
                    castShadow : false,
                    picking : true
                });
                mesh.setLocalTransform(transform);
                meshes.push(mesh);
            }
        }
        return meshes;
    }

    callShader(uniforms) {
        this._updateLabels();

        this._shader.filter = shaderFilter0;
        this._renderer.render(this._shader, uniforms, this.scene);

        this._shader.filter = shaderFilterN;
        this._renderer.render(this._shader, uniforms, this.scene);

        this._shaderAlongLine.filter = shaderLineFilter0;
        this._renderer.render(this._shaderAlongLine, uniforms, this.scene);

        this._shaderAlongLine.filter = shaderLineFilterN;
        this._renderer.render(this._shaderAlongLine, uniforms, this.scene);
    }

    /**
     * update flip and vertical data for each text
     */
    _updateLabels() {
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        const map = this.layer.getMap();
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


        const elements = [];
        for (let m = 0; m < meshes.length; m++) {
            const mesh = meshes[m];
            const geometry = mesh.geometry;
            const geometryProps = geometry.properties;
            const { aNormal, aOffset, aRotation } = geometryProps;
            if (!aNormal) {
                continue;
            }

            const properties = mesh.geometry.properties;
            let line = properties.line;
            if (!line) {
                continue;
            }
            elements.length = 0;

            const uniforms = mesh.material.uniforms;
            const isPitchWithMap = uniforms['textPitchAlignment'] === 'map';

            const tileMatrix = mesh.localTransform,
                projMatrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, tileMatrix);
            if (!isPitchWithMap) {
                //project line to screen coordinates
                const out = properties.projLine = properties.projLine || new Int16Array(line.length / 3 * 2);
                line = projectLine(out, line, projMatrix, map.width, map.height);
            }
            //pickingId中是feature序号，相同的pickingId对应着相同的feature
            const pickingId = geometryProps.aPickingId;
            let start = 0, current = pickingId[0];
            //每个文字有四个pickingId
            for (let i = 0; i < pickingId.length; i += 4) {
                //pickingId发生变化，新的feature出现
                if (pickingId[i] !== current || i === pickingId.length - 4) {
                    const end = i === pickingId.length - 4 ? pickingId.length : i;

                    this._updateFeature(mesh, line, current, start, end, projMatrix, isPitchWithMap ? planeMatrix : null, elements);

                    current = pickingId[i];
                    start = i;
                }
            }
            geometry.updateData('aNormal', aNormal);
            geometry.updateData('aOffset', aOffset);
            geometry.updateData('aRotation', aRotation);

            geometry.setElements({
                usage : 'dynamic',
                data : new geometry.properties.elemCtor(elements)
            });
        }
    }
    // start and end is the start and end index of feature's line
    _updateFeature(mesh, line, pickingId, start, end, projMatrix, planeMatrix, elements) {
        const geometry = mesh.geometry;
        const properties = geometry.properties;
        const feature = properties.features[pickingId];
        const text = feature.textName = feature.textName || resolveText(properties.symbol.textName, feature.feature.properties),
            charCount = text.length;//文字字符数

        const uniforms = mesh.material.uniforms;
        const aOffset = geometry.properties.aOffset,
            aRotation = geometry.properties.aRotation,
            aNormal = geometry.properties.aNormal;

        const segElements = [];

        for (let i = start; i < end; i += charCount * 4) {
            //array to store current text's elements
            for (let j = i; j < i + charCount * 4; j += 4) {
                const offset = this._getOffset(mesh, line, j, projMatrix);
                if (!offset) {
                    //remove whole text if any char is missed
                    segElements.length = 0;
                    break;
                }
                for (let ii = 0; ii < 4; ii++) {
                    aOffset.data[2 * (j + ii)] = offset[0];
                    aOffset.data[2 * (j + ii) + 1] = offset[1];
                    aRotation.data[j + ii] = offset[2];
                }
                //every character has 4 vertice, and 6 indexes
                //j, j + 1, j + 2 is the left-top triangle
                //j + 1, j + 2, j + 3 is the right-bottom triangle
                segElements.push(j, j + 1, j + 2);
                segElements.push(j + 1, j + 2, j + 3);
            }

            //updateNormal
            //normal decides whether to flip and vertical
            const firstChrIdx = i,
                lastChrIdx = i + charCount * 4;
            this._updateNormal(aNormal, aOffset, uniforms['isVerticalChar'], firstChrIdx, lastChrIdx, planeMatrix);

            elements.push(...segElements);
            //clear segElements
            segElements.length = 0;
        }
    }

    _updateNormal(aNormal, aOffset, isVertical, firstChrIdx, lastChrIdx, planeMatrix) {
        //每个position对应了1个aPickingId和2个aOffset，所以需要乘2
        firstChrIdx *= 2;
        lastChrIdx *= 2;

        //一个feature中包含多个文字的anchor
        //1. 遍历anchor
        //2. 读取anchor第一个文字和最后一个文字的位置
        //3. 计算flip和vertical的值并设置
        const map = this.layer.getMap(),
            aspectRatio = map.width / map.height;

        //第一个文字的offset位置
        vec3.set(FIRST_POINT, aOffset.data[firstChrIdx], aOffset.data[firstChrIdx + 1], 0);
        //最后一个文字的offset位置
        vec3.set(LAST_POINT, aOffset.data[lastChrIdx - 2], aOffset.data[lastChrIdx - 1], 0);
        if (planeMatrix) {
            vec3.transformMat3(FIRST_POINT, FIRST_POINT, planeMatrix);
            vec3.transformMat3(LAST_POINT, LAST_POINT, planeMatrix);
        }
        let vertical, flip;
        if (!isVertical) {
            vertical = 0;
            flip = FIRST_POINT[0] > LAST_POINT[0] ? 1 : 0;
        } else {
            const rise = Math.abs(LAST_POINT[1] - FIRST_POINT[1]);
            const run = Math.abs(LAST_POINT[0] - FIRST_POINT[0]) * aspectRatio;
            flip = FIRST_POINT[0] > LAST_POINT[0] ? 1 : 0;
            if (rise > run) {
                vertical = 1;
                flip = FIRST_POINT[1] < LAST_POINT[1] ? 0 : 1;
            } else {
                vertical = 0;
            }
        }
        // flip = 1;
        // vertical = FIRST_POINT[0] > LAST_POINT[0] ? 1 : 0;
        // vertical = 1;

        //更新normal
        for (let i = firstChrIdx / 2; i < lastChrIdx / 2; i++) {
            aNormal.data[i] = 2 * flip + vertical;
        }
    }

    _getOffset(mesh, line, i, projMatrix) {
        // 遍历每个文字，对每个文字获取: anchor, glyphOffset, dx， dy
        // 计算anchor的屏幕位置
        // 根据地图pitch和cameraDistanceFromCenter计算glyph的perspective ratio
        // 从 aSegment 获取anchor的segment, startIndex 和 lineLength
        // 调用 line_offset.js 计算文字的 offset 和 angle
        // 与aDxDy和aTextRotation相加后，写回到 aOffset 和 aRotation 中
        const map = this.layer.getMap();

        const { aAnchor, aGlyphOffset, aDxDy, aSegment, aSize } = mesh.geometry.properties;
        const anchor = vec3.set(ANCHOR, aAnchor[i * 3], aAnchor[i * 3 + 1], aAnchor[i * 3 + 2]);

        const projAnchor = projectPoint(PROJ_ANCHOR, anchor, projMatrix, map.width, map.height);
        vec2.round(PROJ_ANCHOR, PROJ_ANCHOR);

        const glyphOffset = vec2.set(GLYPH_OFFSET, aGlyphOffset[i * 2], aGlyphOffset[i * 2 + 1]);
        const dxdy = vec2.set(DXDY, aDxDy[i * 2], aDxDy[i * 2 + 1]);
        const segment = vec3.set(SEGMENT, aSegment[i * 3], aSegment[i * 3 + 1], aSegment[i * 3 + 2]);

        const offset = getLineOffset(LINE_OFFSET, line, projAnchor, glyphOffset, dxdy[0], dxdy[1], segment[0], segment[1], segment[2], aSize[i] / 24);
        return offset;
    }

    remove() {
        this._shader.dispose();
        this._shaderAlongLine.dispose();
    }

    init() {
        // const map = this.layer.getMap();
        const regl = this.regl;
        const canvas = this.canvas;

        this._renderer = new reshader.Renderer(regl);

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
        const scissor = {
            enable: true,
            box: {
                x : 0,
                y : 0,
                width : () => {
                    return canvas ? canvas.width : 1;
                },
                height : () => {
                    return canvas ? canvas.height : 1;
                }
            }
        };

        const uniforms = [
            'cameraToCenterDistance',
            {
                name : 'projViewModelMatrix',
                type : 'function',
                fn : function (context, props) {
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
            'fadeOpacity',
            {
                name : 'zoomScale',
                type : 'function',
                fn : function (context, props) {
                    return props['tileResolution'] / props['resolution'];
                }
            },
            'planeMatrix',
            'rotateWithMap',
            'mapRotation',
            'tileRatio'
        ];

        const extraCommandProps = {
            viewport, scissor,
            blend: {
                enable: true,
                func: {
                    // src: 'src alpha',
                    // dst: 'one minus src alpha'
                    src : 'one',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            depth: {
                enable: true,
                func : 'always'
            },
        };

        this._shader = new reshader.MeshShader({
            vert, frag,
            uniforms,
            extraCommandProps
        });
        this._shaderAlongLine = new reshader.MeshShader({
            vert : vertAlongLine, frag,
            uniforms,
            extraCommandProps
        });
        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                //TODO 需要创建两个picking对象
                this._renderer,
                {
                    vert : pickingVert,
                    uniforms
                },
                this.pickingFBO
            );
        }
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

        const pitch = map.getPitch() * Math.PI / 180,
            bearing = -map.getBearing() * Math.PI / 180;
        const angleCos = Math.cos(bearing),
            angleSin = Math.sin(bearing),
            pitchCos = Math.cos(pitch),
            pitchSin = Math.sin(pitch);
        const planeMatrix = [
            angleCos, -1.0 * angleSin * pitchCos, angleSin * pitchSin,
            angleSin, angleCos * pitchCos, -1.0 * angleCos * pitchSin,
            0.0, pitchSin, pitchCos
        ];

        return {
            mapPitch : map.getPitch() * Math.PI / 180,
            mapRotation : map.getBearing() * Math.PI / 180,
            projViewMatrix,
            cameraToCenterDistance, canvasSize,
            glyphSize : 24,
            // gammaScale : 0.64,
            gammaScale : 1.0,
            resolution : map.getResolution(),
            planeMatrix
        };
    }
}

export default TextPainter;

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
