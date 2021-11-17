import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import Painter from './Painter';
import { piecewiseConstant } from '@maptalks/function-type';
import { setUniformFromSymbol, createColorSetter, isNumber, toUint8ColorInGlobalVar } from '../Util';
import { prepareFnTypeData } from './util/fn_type_util';
import { interpolated } from '@maptalks/function-type';
import Color from 'color';

const SCALE = [1, 1, 1];
const DEFAULT_POLYGON_FILL = [1, 1, 1, 1];
const EMPTY_UV_OFFSET = [0, 0];

//一个三维mesh绘制的通用painter，负责mesh的create, add 和 delete, 负责fn-type的更新
class MeshPainter extends Painter {

    supportRenderMode(mode) {
        if (this.isAnimating()) {
            return mode === 'fxaa' || mode === 'fxaaAfterTaa';
        } else {
            return mode === 'taa' || mode === 'fxaa';
        }
    }

    isAnimating() {
        return false;
    }

    createMesh(geo, transform, { tilePoint, tileZoom }) {
        if (!this.material) {
            //还没有初始化
            this.setToRedraw();
            return null;
        }
        const { geometry, symbolIndex } = geo;
        const mesh = new reshader.Mesh(geometry, this.material);
        if (this.sceneConfig.animation) {
            SCALE[2] = 0.01;
            const mat = [];
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, transform, mat);
            transform = mat;
        }
        const symbolDef = this.getSymbolDef(symbolIndex);
        const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
        prepareFnTypeData(geometry, symbolDef, fnTypeConfig);
        const shader = this.getShader();
        const defines = shader.getGeometryDefines ? shader.getGeometryDefines(geometry) : {};
        const symbol = this.getSymbol(symbolIndex);
        if (geometry.data.aExtrude) {
            defines['IS_LINE_EXTRUSION'] = 1;
            const { tileResolution, tileRatio } = geometry.properties;
            const map = this.getMap();
            Object.defineProperty(mesh.uniforms, 'linePixelScale', {
                enumerable: true,
                get: function () {
                    return tileRatio * map.getResolution() / tileResolution;
                }
            });
            setUniformFromSymbol(mesh.uniforms, 'lineWidth', symbol, 'lineWidth', 4);
            setUniformFromSymbol(mesh.uniforms, 'lineOpacity', symbol, 'lineOpacity', 1);
            setUniformFromSymbol(mesh.uniforms, 'lineColor', symbol, 'lineColor', '#fff', createColorSetter(this.colorCache));
            Object.defineProperty(mesh.uniforms, 'lineHeight', {
                enumerable: true,
                get: () => {
                    const alt = this.dataConfig['defaultAltitude'] * (this.dataConfig['altitudeScale'] || 1);
                    return isNumber(alt) ? alt : 0;
                }
            });
        } else {
            setUniformFromSymbol(mesh.uniforms, 'polygonFill', symbol, 'polygonFill', DEFAULT_POLYGON_FILL, createColorSetter(this.colorCache));
            setUniformFromSymbol(mesh.uniforms, 'polygonOpacity', symbol, 'polygonOpacity', 1);
        }
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        if (geometry.data.aLineWidth) {
            defines['HAS_LINE_WIDTH'] = 1;
        }
        if (geometry.data.aLineHeight) {
            defines['HAS_LINE_HEIGHT'] = 1;
        }
        if (geometry.data.aOpacity) {
            const aOpacity = geometry.data.aOpacity;
            for (let i = 0; i < aOpacity.length; i++) {
                if (aOpacity[i] < 255) {
                    geometry.properties.hasAlpha = true;
                    break;
                }
            }
        }
        geometry.generateBuffers(this.regl);
        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);

        //没有高度或level >= 3的瓦片mesh不产生阴影
        if (geometry.properties.maxAltitude <= 0 || mesh.getUniform('level') >= 3) {
            mesh.castShadow = false;
        }
        mesh.setUniform('maxAltitude', mesh.geometry.properties.maxAltitude);

        const map = this.getMap();
        const glRes = map.getGLRes();
        const sr = this.layer.getSpatialReference && this.layer.getSpatialReference();
        const layerRes = sr ? sr.getResolution(tileZoom) : map.getResolution(tileZoom);
        const glScale = layerRes / glRes;
        // vector-packer/PACK_TEX_SIZE
        const PACK_TEX_SIZE = 128 / 256;
        // const uvScale = this.material.get('uvScale') || [1, 1];
        // mesh.setUniform('uvOrigin', [tilePoint[0] * glScale / (PACK_TEX_SIZE * uvScale[0]), tilePoint[1] * glScale / (PACK_TEX_SIZE * uvScale[0])]);
        Object.defineProperty(mesh.uniforms, 'uvOrigin', {
            enumerable: true,
            get: () => {
                const uvScale = this.getSymbol(symbolIndex).material.uvScale || [1, 1];
                const dataUVScale = this.dataConfig.dataUVScale || [1, 1];
                // 每个瓦片左上角的坐标值
                const xmin = uvScale[0] * tilePoint[0] * glScale;
                const ymax = uvScale[1] * tilePoint[1] * glScale;
                // 纹理的高宽
                const texWidth = PACK_TEX_SIZE * dataUVScale[0];
                const texHeight = PACK_TEX_SIZE * dataUVScale[1];
                return [xmin / texWidth, ymax / texHeight];
            }
        });
        Object.defineProperty(mesh.uniforms, 'uvOffset', {
            enumerable: true,
            get: () => {
                const uvOffsetAnim = this.getUVOffsetAnim();
                return this.getUVOffset(uvOffsetAnim);
            }
        });
        Object.defineProperty(mesh.uniforms, 'hasAlpha', {
            enumerable: true,
            get: () => {
                const symbol = this.getSymbol(symbolIndex);
                return geometry.properties.hasAlpha || symbol['polygonOpacity'] < 1;
            }
        });
        mesh.properties.symbolIndex = symbolIndex;
        return mesh;
    }


    getUVOffsetAnim() {
        const symbol = this.getSymbols()[0];
        return symbol.material && symbol.material.uvOffsetAnim;
    }

    getUVOffset(uvOffsetAnim) {
        const symbol = this.getSymbols()[0];
        const uvOffset = symbol.material && symbol.material.uvOffset || EMPTY_UV_OFFSET;
        const timeStamp = this.layer.getRenderer().getFrameTimestamp();
        const offset = [uvOffset[0], uvOffset[1]];
        const hasNoise = !!symbol.material && symbol.material.noiseTexture;
        // 256是noiseTexture的高宽，乘以256才能保证动画首尾衔接，不会出现跳跃现象
        const speed = hasNoise ? 500000 : 1000
        const scale = hasNoise ? 256 : 1;
        if (uvOffsetAnim && uvOffsetAnim[0]) {
            offset[0] = (timeStamp * uvOffsetAnim[0] % speed) / speed * scale;
        }
        if (uvOffsetAnim && uvOffsetAnim[1]) {
            offset[1] = (timeStamp * uvOffsetAnim[1] % speed) / speed * scale;
        }
        return offset;
    }

    needPolygonOffset() {
        return this._needPolygonOffset;
    }

    startFrame(...args) {
        delete this._needPolygonOffset;
        return super.startFrame(...args);
    }

    addMesh(mesh, progress) {
        mesh.forEach(m => {
            this._prepareMesh(m, progress);
        });
        super.addMesh(...arguments);
    }

    _prepareMesh(mesh, progress) {
        if (progress !== null) {
            const mat = mesh.localTransform;
            if (progress === 0) {
                progress = 0.01;
            }
            SCALE[2] = progress;
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, mesh.properties.tileTransform, mat);
            mesh.setLocalTransform(mat);
        } else {
            mesh.setLocalTransform(mesh.properties.tileTransform);
        }
        if (mesh.material !== this.material) {
            mesh.setMaterial(this.material);
        }
        if (mesh.geometry.properties.maxAltitude <= 0) {
            this._needPolygonOffset = true;
        }
        //在这里更新ssr，以免symbol中ssr发生变化时，uniform值却没有发生变化, fuzhenn/maptalks-studio#462
        if (this.getSymbol(mesh.properties.symbolIndex).ssr) {
            mesh.ssr = 1;
        } else {
            mesh.ssr = 0;
        }
    }

    deleteMesh(meshes, keepGeometry) {
        if (!meshes) {
            return;
        }
        this.scene.removeMesh(meshes);
        if (Array.isArray(meshes)) {
            for (let i = 0; i < meshes.length; i++) {
                if (!keepGeometry) {
                    meshes[i].geometry.dispose();
                }
                meshes[i].dispose();
            }
        } else {
            if (!keepGeometry) {
                meshes.geometry.dispose();
            }
            meshes.dispose();
        }
    }

    updateDataConfig(dataConfig, old) {
        if (this.dataConfig.type === 'line-extrusion' && !dataConfig['altitudeProperty'] && !old['altitudeProperty']) {
            return false;
        }
        return true;
    }

    createFnTypeConfig(map, symbolDef) {
        const fillFn = piecewiseConstant(symbolDef['polygonFill'] || symbolDef['lineColor']);
        const opacityFn = interpolated(symbolDef['polygonOpacity'] || symbolDef['lineOpacity']);
        const aLineWidthFn = interpolated(symbolDef['lineWidth']);
        const u8 = new Uint8Array(1);
        const u16 = new Uint16Array(1);
        const fillName = symbolDef['polygonFill'] ? 'polygonFill' : symbolDef['lineColor'] ? 'lineColor' : 'polygonFill';
        const opacityName = symbolDef['polygonOpacity'] ? 'polygonOpacity' : symbolDef['lineOpacity'] ? 'lineOpacity' : 'polygonOpacity';
        return [
            {
                //geometry.data 中的属性数据
                attrName: 'aColor',
                type: Uint8Array,
                width: 4,
                //symbol中的function-type属性
                symbolName: fillName,
                define: 'HAS_COLOR',
                //
                evaluate: properties => {
                    let color = fillFn(map.getZoom(), properties);
                    if (!Array.isArray(color)) {
                        color = this.colorCache[color] = this.colorCache[color] || Color(color).unitArray();
                    }
                    color = toUint8ColorInGlobalVar(color);
                    return color;
                }
            },
            {
                attrName: 'aOpacity',
                type: Uint8Array,
                width: 1,
                symbolName: opacityName,
                evaluate: (properties, _, geometry) => {
                    const polygonOpacity = opacityFn(map.getZoom(), properties);
                    u8[0] = polygonOpacity * 255;
                    if (u8[0] < 255) {
                        geometry.properties.hasAlpha = true;
                    }
                    return u8[0];
                }
            },
            {
                attrName: 'aLineWidth',
                type: Uint8Array,
                width: 1,
                symbolName: 'lineWidth',
                define: 'HAS_LINE_WIDTH',
                evaluate: properties => {
                    const lineWidth = aLineWidthFn(map.getZoom(), properties);
                    //乘以2是为了解决 #190
                    u16[0] = Math.round(lineWidth * 2.0);
                    return u16[0];
                }
            }
        ];
    }

    getPolygonOffset() {
        return {
            enable: (context, props) => props.maxAltitude === 0,
            offset: super.getPolygonOffset()
        };
    }

    updateSymbol(symbol, all) {
        const refresh = super.updateSymbol(symbol, all);
        if (symbol.material) {
            this._updateMaterial(symbol.material);
        }
        return refresh;
    }

    _isNeedRefreshStyle(oldSymbolDef, newSymbolDef) {
        return hasTexture(oldSymbolDef) !== hasTexture(newSymbolDef);
    }

}

export default MeshPainter;


function hasTexture(symbolDef) {
    if (!symbolDef || !symbolDef.material) {
        return false;
    }
    for (const p in symbolDef.material) {
        if (p.indexOf('Texture') > 0 && symbolDef.material[p]) {
            return true;
        }
    }
    return false;
}
