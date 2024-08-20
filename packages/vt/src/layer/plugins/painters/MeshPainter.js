import * as maptalks from 'maptalks';
import { reshader } from '@maptalks/gl';
import { vec2, mat4 } from '@maptalks/gl';
import Painter from './Painter';
import { piecewiseConstant, isFunctionDefinition } from '@maptalks/function-type';
import { setUniformFromSymbol, createColorSetter, isNumber, toUint8ColorInGlobalVar, pointAtResToMeter } from '../Util';
import { prepareFnTypeData } from './util/fn_type_util';
import { interpolated } from '@maptalks/function-type';
import Color from 'color';
import { DEFAULT_TEX_WIDTH } from '../../../packer';

const SCALE = [1, 1, 1];
const DEFAULT_POLYGON_FILL = [1, 1, 1, 1];
const EMPTY_UV_OFFSET = [0, 0];
const DEFAULT_UV_SCALE = [1, 1];

const EMPTY_ARRAY = [];

const COORD0 = new maptalks.Coordinate(0, 0);
const COORD1 = new maptalks.Coordinate(0, 0);

const ARR2_0 = [];
const ARR2_1 = [];

//一个三维mesh绘制的通用painter，负责mesh的create, add 和 delete, 负责fn-type的更新
class MeshPainter extends Painter {

    supportRenderMode(mode) {
        if (this.isAnimating()) {
            return mode === 'fxaa' || mode === 'fxaaAfterTaa';
        } else {
            return mode === 'taa' || mode === 'fxaa';
        }
    }

    isTerrainSkin() {
        return false;
    }

    isTerrainVector() {
        return this.layer.options.awareOfTerrain;
    }

    isAnimating() {
        return false;
    }

    createMesh(geo, transform, { tilePoint }) {
        if (!this.material) {
            //还没有初始化
            this.setToRedraw();
            return null;
        }
        const { geometry, symbolIndex } = geo;
        const isVectorTile = this.layer instanceof maptalks.TileLayer;
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
        const colorSetter = createColorSetter(this.colorCache);
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
            setUniformFromSymbol(mesh.uniforms, 'lineColor', symbol, 'lineColor', '#fff', colorSetter);
            Object.defineProperty(mesh.uniforms, 'lineHeight', {
                enumerable: true,
                get: () => {
                    const alt = this.dataConfig['defaultAltitude'] * (this.dataConfig['altitudeScale'] || 1);
                    return isNumber(alt) ? alt : 0;
                }
            });
        } else {
            setUniformFromSymbol(mesh.uniforms, 'polygonFill', symbol, 'polygonFill', DEFAULT_POLYGON_FILL, colorSetter);
            setUniformFromSymbol(mesh.uniforms, 'polygonOpacity', symbol, 'polygonOpacity', 1);
            const vertexColorTypes = [];
            Object.defineProperty(mesh.uniforms, 'vertexColorsOfType', {
                enumerable: true,
                get: () => {
                    const bottomColor = colorSetter(symbol['bottomPolygonFill'] || DEFAULT_POLYGON_FILL);
                    const topColor = colorSetter(symbol['topPolygonFill'] || DEFAULT_POLYGON_FILL);
                    vertexColorTypes[0] = bottomColor[0];
                    vertexColorTypes[1] = bottomColor[1];
                    vertexColorTypes[2] = bottomColor[2];
                    vertexColorTypes[3] = bottomColor[3];
                    vertexColorTypes[4] = topColor[0];
                    vertexColorTypes[5] = topColor[1];
                    vertexColorTypes[6] = topColor[2];
                    vertexColorTypes[7] = topColor[3];
                    const vertexColors = mesh.geometry.properties.vertexColors;
                    if (vertexColors) {
                        let index = 8;
                        vertexColorTypes.length = 8 + vertexColors.length;
                        for (let i = 0; i < vertexColors.length; i++) {
                            vertexColorTypes[index++] = vertexColors[i][0];
                            vertexColorTypes[index++] = vertexColors[i][1];
                            vertexColorTypes[index++] = vertexColors[i][2];
                            vertexColorTypes[index++] = vertexColors[i][3];
                        }
                    }
                    return vertexColorTypes;
                }
            });
        }
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        if (geometry.data.aOpacity) {
            defines['HAS_OPACITY'] = 1;
        }
        if (geometry.data.aLineWidth) {
            defines['HAS_LINE_WIDTH'] = 1;
        }
        if (geometry.data.aLineHeight) {
            defines['HAS_LINE_HEIGHT'] = 1;
        }
        if (geometry.data.aTerrainAltitude) {
            defines['HAS_TERRAIN_ALTITUDE'] = 1;
        }
        if (geometry.data.aVertexColorType) {
            const vertexColors = mesh.geometry.properties.vertexColors;
            let vertexTypesCount = 2;
            if (vertexColors) {
                vertexTypesCount += vertexColors.length;
            }
            defines['VERTEX_TYPES_COUNT'] = vertexTypesCount;
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
        defines['HAS_MIN_ALTITUDE'] = 1;
        defines['HAS_LAYER_OPACITY'] = 1;
        geometry.generateBuffers(this.regl);
        mesh.setDefines(defines);
        mesh.setPositionMatrix(this.getAltitudeOffsetMatrix());
        mesh.setLocalTransform(transform);

        //没有高度或level >= 3的瓦片mesh不产生阴影
        if (geometry.properties.maxAltitude <= 0 || mesh.properties.level >= 3) {
            mesh.castShadow = false;
        }
        mesh.setUniform('maxAltitude', mesh.geometry.properties.maxAltitude);
        Object.defineProperty(mesh.uniforms, 'minAltitude', {
            enumerable: true,
            get: () => {
                return this.layer.options['altitude'] || 0;
            }
        })

        const { tileResolution } = geometry.properties;
        const map = this.getMap();
        const renderer = this.layer.getRenderer();
        const tileCoord = map.pointAtResToCoord(new maptalks.Point(tilePoint), tileResolution);
        const pointToMeter = pointAtResToMeter(map, 1, tileCoord, tileResolution);
        const uvOriginUniform = [];
        Object.defineProperty(mesh.uniforms, 'uvOrigin', {
            enumerable: true,
            get: () => {
                const offset = this._computeUVOffset(uvOriginUniform, symbolIndex, tilePoint, tileResolution, pointToMeter, isVectorTile);
                return offset;
            }
        });
        // const uvOffsetUniform = [];
        // Object.defineProperty(mesh.uniforms, 'uvOffset', {
        //     enumerable: true,
        //     get: () => {
        //         const offset = this._computeUVOffset(uvOffsetUniform, symbolIndex, tilePoint, tileResolution, pointToMeter, isVectorTile);
        //         return vec2.set(uvOriginUniform, 0, 0);
        //     }
        // });
        mesh.setUniform('uvOffset', [0, 0]);
        Object.defineProperty(mesh.uniforms, 'hasAlpha', {
            enumerable: true,
            get: () => {
                const symbol = this.getSymbol(symbolIndex);
                return geometry.properties.hasAlpha || symbol['polygonOpacity'] < 1 ||
                    symbol['lineOpacity'] < 1 ||
                    mesh.material && (mesh.material.uniforms.baseColorTexture ||
                    mesh.material.uniforms.emissiveTexture);
            }
        });

        const maxZoom = this.layer.getMap().getMaxNativeZoom();
        Object.defineProperty(mesh.uniforms, 'stencilRef', {
            enumerable: true,
            get: () => {
                if (renderer.isForeground(mesh)) {
                    return 0;
                }
                return maxZoom - mesh.properties.tile.z;
            }
        });
        mesh.properties.symbolIndex = symbolIndex;
        return mesh;
    }

    _computeUVOffset(out, symbolIndex, tilePoint, tileResolution, pointToMeter, isVectorTile) {
        if (this.dataConfig.topUVMode === 1) {
            // 如果顶面纹理是ombb，不需要偏移
            out[0] = 0;
            out[1] = 0;
            return out;
        }
        const map = this.getMap();
        const symbol = this.getSymbol(symbolIndex);
        const material = symbol.material;
        let origin = tilePoint;
        if (!this.dataConfig.side && material && material.textureOrigin) {
            COORD0.set(material.textureOrigin[0], material.textureOrigin[1]);
            map.coordToPointAtRes(COORD0, tileResolution, COORD1);
            origin = vec2.set(ARR2_0, tilePoint[0] - COORD1.x, tilePoint[1] - COORD1.y);
        }
        const isMeter = !!material && material.uvOffsetInMeter;
        let uvOffset = material && material.uvOffset || EMPTY_UV_OFFSET;
        const uvOffsetAnim = this.getUVOffsetAnim();
        if (uvOffsetAnim) {
            uvOffset = this.getUVOffset(uvOffsetAnim);
        }
        const uvScale = material && material.uvScale || DEFAULT_UV_SCALE;

        // 每个瓦片左上角的坐标值
        // 侧面的纹理不会根据瓦片左上角坐标偏移
        // 只有顶面的坐标是需要根据瓦片左上角坐标来整体偏移的
        let xmin = this.dataConfig.side ? 0 : origin[0];
        let ymax = this.dataConfig.side ? 0 : origin[1];
        // 纹理的高宽
        const textureWidth = (material && material.textureWidth || DEFAULT_TEX_WIDTH);
        const textureHeight = textureWidth * uvScale[1] / uvScale[0];
        if (isMeter) {
            xmin += uvOffset[0] / pointToMeter;
            ymax += uvOffset[1] / pointToMeter;
        }
        const offsetX = isMeter ? 0 : uvOffset[0];
        const offsetY = isMeter ? 0 : uvOffset[1];
        const result = vec2.set(out, xmin * pointToMeter * uvScale[0] / textureWidth + offsetX, ymax * pointToMeter * uvScale[1] / textureHeight + offsetY);
        if (!isVectorTile) {
            result[1] *= -1;
        }
        return result;
    }

    callShader(uniforms, context) {
        const cullFace = this.sceneConfig.cullFace;
        this.sceneConfig.cullFace = 'front';
        this.callBackgroundTileShader(uniforms, context);
         if (cullFace === undefined) {
            delete this.sceneConfig.cullFace;
        } else {
            this.sceneConfig.cullFace = cullFace;
        }
        super.callShader(uniforms, context);
    }

    getShadowMeshes() {
        if (!this.isVisible()) {
            return EMPTY_ARRAY;
        }
        this.shadowCount = this.scene.getMeshes().length;
        const meshes = this.scene.getMeshes().filter(m => m.properties.level === 0);
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (mesh.material !== this.material) {
                mesh.setMaterial(this.material);
            }
        }
        return meshes;
    }

    getUVOffsetAnim() {
        const symbol = this.getSymbols()[0];
        return symbol.material && symbol.material.uvOffsetAnim;
    }

    getUVOffset(uvOffsetAnim) {
        const symbol = this.getSymbols()[0];
        const uvOffset = symbol.material && symbol.material.uvOffset || EMPTY_UV_OFFSET;
        const inMeter = !!symbol.material && symbol.material.uvOffsetInMeter;
        const timeStamp = performance.now() / 1000;
        const offset = vec2.set(ARR2_1, uvOffset[0], uvOffset[1]);
        offset[0] = timeStamp * uvOffsetAnim[0];
        offset[1] = timeStamp * uvOffsetAnim[0];
        if (!inMeter) {
            offset[0] %= 1;
            offset[1] %= 1;
        }
        return offset;
    }

    needPolygonOffset() {
        return this._needPolygonOffset;
        // return true;
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

    deleteMaterial() {
        if (!this.material) {
            return;
        }
        this.material.dispose();
        delete this.material;
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
                    delete meshes[i].geometry.properties.layer;
                }
                meshes[i].dispose();
            }
        } else {
            if (!keepGeometry) {
                meshes.geometry.dispose();
                delete meshes.geometry.properties.layer;
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
                evaluate: (properties, geometry) => {
                    let color = fillFn(map.getZoom(), properties);
                    if (isFunctionDefinition(color)) {
                        color = this.evaluateInFnTypeConfig(color, geometry, map, properties, true);
                    }
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
                evaluate: (properties, geometry) => {
                    let polygonOpacity = opacityFn(map.getZoom(), properties);
                    if (isFunctionDefinition(polygonOpacity)) {
                        polygonOpacity = this.evaluateInFnTypeConfig(polygonOpacity, geometry, map, properties, false);
                    }
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

    updateSymbol(symbol, all) {
        let refreshMaterial = false;
        if (symbol && symbol.material) {
            // 检查材质的更新是否需要更新整个style
            refreshMaterial = needRefreshMaterial(this.symbolDef[0].material || {}, symbol.material);
        }
        const refresh = super.updateSymbol(symbol, all);
        if (symbol && symbol.material) {
            this._updateMaterial(symbol.material);
        }
        return refreshMaterial || refresh;
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


const MATERIAL_PROP_NEED_REBUILD_IN_VT = {
    'normalTexture': 1,
    'bumpTexture': 1
};

function needRefreshMaterial(oldSymbolDef, newSymbolDef) {
    for (const p in newSymbolDef) {
        // 指定的纹理从无到有，或从有到无时，需要刷新style
        if (MATERIAL_PROP_NEED_REBUILD_IN_VT[p] && (newSymbolDef[p] !== oldSymbolDef[p] && (!oldSymbolDef[p] || !newSymbolDef[p]))) {
            return true;
        }
    }
    return false;

}
