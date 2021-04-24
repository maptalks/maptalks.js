import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import Painter from './Painter';
import { piecewiseConstant } from '@maptalks/function-type';
import { setUniformFromSymbol, createColorSetter, isNumber, toUint8ColorInGlobalVar } from '../Util';
import { prepareFnTypeData, updateGeometryFnTypeAttrib } from './util/fn_type_util';
import { interpolated } from '@maptalks/function-type';
import Color from 'color';

const SCALE = [1, 1, 1];
const DEFAULT_POLYGON_FILL = [1, 1, 1, 1];

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

    createMesh(geometry, transform) {
        if (!this.material) {
            //还没有初始化
            this.setToRedraw();
            return null;
        }

        if (Array.isArray(geometry)) {
            return geometry.map(geo => this.createMesh(geo, transform));
        }
        const mesh = new reshader.Mesh(geometry, this.material);
        if (this.sceneConfig.animation) {
            SCALE[2] = 0.01;
            const mat = [];
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, transform, mat);
            transform = mat;
        }
        prepareFnTypeData(geometry, this.symbolDef, this.getFnTypeConfig());
        const shader = this.getShader();
        const defines = shader.getGeometryDefines ? shader.getGeometryDefines(geometry) : {};
        const symbol = this.getSymbol();
        this._colorCache = this._colorCache || {};
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
            setUniformFromSymbol(mesh.uniforms, 'lineColor', symbol, 'lineColor', '#fff', createColorSetter(this._colorCache));
            Object.defineProperty(mesh.uniforms, 'lineHeight', {
                enumerable: true,
                get: () => {
                    const alt = this.dataConfig['defaultAltitude'] * (this.dataConfig['altitudeScale'] || 1);
                    return isNumber(alt) ? alt : 0;
                }
            });
        } else {
            setUniformFromSymbol(mesh.uniforms, 'polygonFill', symbol, 'polygonFill', DEFAULT_POLYGON_FILL, createColorSetter(this._colorCache));
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
        geometry.generateBuffers(this.regl);
        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);

        //没有高度或level >= 3的瓦片mesh不产生阴影
        if (geometry.properties.maxAltitude <= 0 || mesh.getUniform('level') >= 3) {
            mesh.castShadow = false;
        }
        mesh.setUniform('maxAltitude', mesh.geometry.properties.maxAltitude);
        return mesh;
    }

    needPolygonOffset() {
        return this._needPolygonOffset;
    }

    startFrame(...args) {
        delete this._needPolygonOffset;
        return super.startFrame(...args);
    }

    addMesh(mesh, progress) {
        this._prepareMesh(mesh, progress);
        super.addMesh(mesh, progress);
    }

    _prepareMesh(mesh, progress) {
        if (Array.isArray(mesh)) {
            mesh.forEach(m => {
                this._prepareMesh(m, progress);
            });
            return;
        }
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
        if (this.getSymbol().ssr) {
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

    preparePaint(...args) {
        super.preparePaint(...args);
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        updateGeometryFnTypeAttrib(this.regl, this.symbolDef, this.getFnTypeConfig(), meshes, this.getMap().getZoom());
    }

    updateSymbol(...args) {
        super.updateSymbol(...args);
        const symbolDef = this.symbolDef;
        this._fillFn = piecewiseConstant(symbolDef['polygonFill'] || symbolDef['lineColor']);
        this._opacityFn = interpolated(symbolDef['polygonOpacity'] || symbolDef['lineOpacity']);
        this._aLineWidthFn = interpolated(symbolDef['lineWidth']);
    }

    updateDataConfig(dataConfig, old) {
        if (this.dataConfig.type === 'line-extrusion' && !dataConfig['altitudeProperty'] && !old['altitudeProperty']) {
            return false;
        }
        return true;
    }

    getFnTypeConfig() {
        if (this._fnTypeConfig) {
            return this._fnTypeConfig;
        }
        const symbolDef = this.symbolDef;
        this._fillFn = piecewiseConstant(symbolDef['polygonFill'] || symbolDef['lineColor']);
        this._opacityFn = interpolated(symbolDef['polygonOpacity'] || symbolDef['lineOpacity']);
        this._aLineWidthFn = interpolated(symbolDef['lineWidth']);
        const map = this.getMap();
        const u8 = new Uint8Array(1);
        const u16 = new Uint16Array(1);
        const fillName = this.symbolDef['polygonFill'] ? 'polygonFill' : this.symbolDef['lineColor'] ? 'lineColor' : 'polygonFill';
        const opacityName = this.symbolDef['polygonOpacity'] ? 'polygonOpacity' : this.symbolDef['lineOpacity'] ? 'lineOpacity' : 'polygonOpacity';
        this._fnTypeConfig = [
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
                    let color = this._fillFn(map.getZoom(), properties);
                    if (!Array.isArray(color)) {
                        color = this._colorCache[color] = this._colorCache[color] || Color(color).array();
                    } else {
                        color = toUint8ColorInGlobalVar(color);
                    }
                    return color;
                }
            },
            {
                attrName: 'aOpacity',
                type: Uint8Array,
                width: 1,
                symbolName: opacityName,
                evaluate: properties => {
                    const polygonOpacity = this._opacityFn(map.getZoom(), properties);
                    u8[0] = polygonOpacity * 255;
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
                    const lineWidth = this._aLineWidthFn(map.getZoom(), properties);
                    //乘以2是为了解决 #190
                    u16[0] = Math.round(lineWidth * 2.0);
                    return u16[0];
                }
            }
        ];
        return this._fnTypeConfig;
    }

    getPolygonOffset() {
        return {
            enable: (context, props) => props.maxAltitude === 0,
            offset: super.getPolygonOffset()
        };
    }

}

export default MeshPainter;
