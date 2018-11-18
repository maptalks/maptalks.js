import Painter from './Painter';
import { reshader, vec2, vec3, mat4 } from '@maptalks/gl';
import { getLineOffset } from './util/line_offset';
import Color from 'color';
import vert from './glsl/text.vert';
import vertAlongLine from './glsl/text.line.vert';
import frag from './glsl/text.frag';
import pickingVert from './glsl/text.picking.vert';

const shaderFilter0 = mesh => {
    return mesh.uniforms['level'] === 0 && !mesh.geometry.data.aOffset1;
};

const shaderFilterN = mesh => {
    return mesh.uniforms['level'] > 0 && !mesh.geometry.data.aOffset1;
};

const shaderLineFilter0 = mesh => {
    return mesh.uniforms['level'] === 0 && mesh.geometry.data.aOffset1;
};

const shaderLineFilterN = mesh => {
    return mesh.uniforms['level'] > 0 && mesh.geometry.data.aOffset1;
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
const PROJ_MATRIX = [], ANCHOR = [], GLYPH_OFFSET = [], DXDY = [], SEGMENT = [], LINE_OFFSET = [];

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
            }

            if (symbol['textRotationAlignment'] === 'map' || isAlongLine) {
                uniforms.rotateWithMap = 1;
            }

            if (symbol['textPitchAlignment'] === 'map' || isAlongLine) {
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
        // this._updateLabels(uniforms);

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
        const map = this.layer.getMap(),
            bearing = -map.getBearing() * Math.PI / 180;
        const angleCos = Math.cos(bearing),
            angleSin = Math.sin(bearing),
            pitchCos = Math.cos(0),
            pitchSin = Math.sin(0);
        const planeMatrix = [
            angleCos, -1.0 * angleSin * pitchCos, angleSin * pitchSin,
            angleSin, angleCos * pitchCos, -1.0 * angleCos * pitchSin,
            0.0, pitchSin, pitchCos
        ];

        const firstPoint = [0, 0, 0], lastPoint = [0, 0, 0];

        const aspectRatio = map.width / map.height;


        //TODO project line
        const tileMatrix = meshes[0].localTransform,
            projMatrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, tileMatrix);
        let line = meshes[0].geometry.properties.line;
        if (line) {
            line = projLine(line, );
        }

        for (let m = 0; m < meshes.length; m++) {
            const mesh = meshes[m];
            const geometry = mesh.geometry;
            const geometryProps = geometry.properties;
            const aNormal = geometryProps.aNormal;
            if (!aNormal) {
                continue;
            }

            const uniforms = mesh.material.uniforms;
            //pickingId中是feature序号，相同的pickingId对应着相同的feature
            const pickingId = geometryProps.aPickingId;
            let start = 0, current = pickingId[0];
            //每个文字有四个pickingId
            for (let i = 0; i < pickingId.length; i += 4) {
                //pickingId发生变化，新的feature出现
                if (pickingId[i] !== current || i === pickingId.length - 4) {
                    const end = i === pickingId.length - 4 ? pickingId.length : i;

                    this._updateFeature(mesh, current, start, end, geometryProps);

                    current = pickingId[i];
                    start = i;
                }

            }
            geometry.updateData('aNormal', aNormal);
        }
    }

    _updateFeature(mesh, pickingId, start, end) {
        const geometry = mesh.geometry;
        const properties = geometry.properties;
        const feature = properties.features[pickingId];
        const text = feature.textName = feature.textName || resolveText(properties.symbol.textName, feature.feature.properties),
            count = text.length;//文字字符数

        //一个feature中包含多个文字的anchor
        //1. 遍历anchor
        //2. 读取anchor第一个文字和最后一个文字的位置
        //3. 计算flip和vertical的值并设置
        for (let ii = start; ii < end; ii += 4 * count) {
            this._updateOffset(text, );
            //每个anchor在offset中占 4 * count 位
            const firstChrIdx = ii * 2, //第一个文字的offset位置
                lastChrIdx = (ii + 4 * count) * 2; //最后一个文字的offset位置
            vec3.set(firstPoint, offset[firstChrIdx], offset[firstChrIdx + 1], 0);
            vec3.set(lastPoint, offset[lastChrIdx - 2], offset[lastChrIdx - 1], 0);
            vec3.transformMat3(firstPoint, firstPoint, planeMatrix);
            vec3.transformMat3(lastPoint, lastPoint, planeMatrix);
            let vertical, flip;
            if (!uniforms['isVerticalChar']) {
                vertical = 0;
                flip = firstPoint[0] > lastPoint[0] ? 1 : 0;
            } else {
                const rise = Math.abs(lastPoint[1] - firstPoint[1]);
                const run = Math.abs(lastPoint[0] - firstPoint[0]) * aspectRatio;
                flip = firstPoint[0] > lastPoint[0] ? 1 : 0;
                if (rise > run) {
                    vertical = 1;
                    flip = firstPoint[1] < lastPoint[1] ? 1 : 0;
                } else {
                    vertical = 0;
                }
            }

            // flip = 0;
            // vertical = firstPoint[0] > lastPoint[0] ? 1 : 0;
            // vertical = 1;

            //更新normal
            for (let iii = firstChrIdx / 2; iii < lastChrIdx / 2; iii++) {
                aNormal.data[iii] = 2 * flip + vertical;
            }
        }
    }

    _updateOffset(mesh, i) {
        // 遍历每个文字，对每个文字获取: anchor, glyphOffset, dx， dy
        // 从 aSegment 获取anchor的segment, startIndex 和 lineLength
        // 调用 line_offset.js 计算文字的 offset 和 angle
        // 与aDxDy和aTextRotation相加后，写回到 aOffset 和 aRotation 中

        const scale = 1; //TODO 屏幕坐标和tile坐标的比例

        const { aAnchor, aGlyphOffset, aDxDy, aSegment, aSize, line } = mesh.geometry.properties;
        const anchor = vec3.set(ANCHOR, aAnchor[i * 3], aAnchor[i * 3 + 1], aAnchor[i * 3 + 2]);
        const glyphOffset = vec2.set(GLYPH_OFFSET, aGlyphOffset[i * 2], aGlyphOffset[i * 2 + 1]);
        const dxdy = vec2.set(DXDY, aDxDy[i * 2], aDxDy[i * 2 + 1]);
        const segment = vec3.set(SEGMENT, aSegment[i * 3], aSegment[i * 3 + 1], aSegment[i * 3 + 2]);

        const offset = getLineOffset(LINE_OFFSET, line, anchor, glyphOffset, dxdy[0], dxdy[1], segment[0], segment[1], segment[2], aSize[i], scale);


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

        // const firstPoint = [], lastPoint = [];
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
