import * as maptalks from 'maptalks';
import { reshader, mat4, quat } from '@maptalks/gl';
import BasicPainter from './BasicPainter';
import vert from './glsl/billboard.vert';
import frag from './glsl/billboard.frag';
import pickingVert from './glsl/billboard.vert';
import ShelfPack from '@mapbox/shelf-pack';
import { RGBAImage } from '../../../packer/Image';
import { isFunction, isString } from '../../../common/Util';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';
import { createAtlasTexture } from './util/atlas_util';
import { getIndexArrayType } from '../../../packer/pack/util/array';
import { isObjectEmpty } from './util/is_obj_empty';

const TILE_POINT = new maptalks.Point(0, 0);

const sizeOut = [];
const OUT_QUAT = [];
const canvas = document.createElement('canvas');

export default class BillBoardPainter extends BasicPainter {

    constructor(...args) {
        super(...args);
        this._ready = true;
        const symbolDef = this.getSymbolDef({ index: 0 });
        // an url source
        const isUrlSource = isString(symbolDef && symbolDef.source);
        this._ready = !isUrlSource;
        if (isFunctionDefinition(symbolDef.width)) {
            this._widthFn = interpolated(symbolDef.width);
        } else {
            this._width = symbolDef.width;
        }
        if (isFunctionDefinition(symbolDef.height)) {
            this._heightFn = interpolated(symbolDef.height);
        } else {
            this._height = symbolDef.height;
        }

        if (isFunctionDefinition(symbolDef.rotationX)) {
            this._rotationXFn = interpolated(symbolDef.rotationX);
        } else {
            this._rotationX = symbolDef.rotationX;
        }
        if (isFunctionDefinition(symbolDef.rotationY)) {
            this._rotationYFn = interpolated(symbolDef.rotationY);
        } else {
            this._rotationY = symbolDef.rotationY;
        }
        if (isFunctionDefinition(symbolDef.rotationZ)) {
            this._rotationZFn = interpolated(symbolDef.rotationZ);
        } else {
            this._rotationZ = symbolDef.rotationZ;
        }

        if (isUrlSource) {
            const image = this._image = new Image();
            image.onload = () => {
                this._ready = true;
            };
            image.src = symbolDef.source;
        }
    }

    needToRedraw() {
        const symbolDef = this.getSymbolDef({ index: 0 });
        if (!symbolDef || !isFunction(symbolDef.source)) {
            return super.needToRedraw();
        }
        const renderer = this.layer.getRenderer();
        const currentTiles = renderer.getCurrentTiles();
        if (!currentTiles || isObjectEmpty(currentTiles)) {
            return super.needToRedraw();
        }
        const redraw = this._checkIfSourceUpdated();
        return redraw || super.needToRedraw();
    }

    _checkIfSourceUpdated() {
        let redraw = false;
        const renderer = this.layer.getRenderer();
        const currentTiles = renderer.getCurrentTiles();
        const symbolDef = this.getSymbolDef({ index: 0 });
        const source = symbolDef.source;
        const tileCache = renderer.tileCache;
        const bins = [];
        for (const p in currentTiles) {
            const tile = tileCache.get(p);
            if (!tile || !tile.image || !tile.image.cache || !tile.image.cache[0]) {
                continue;
            }
            let { geometry } = tile.image.cache[0];
            if (!geometry || !geometry[0] || !geometry[0].geometry) {
                continue;
            }
            geometry = geometry[0].geometry.properties.billGeometry;
            const { oldPickingId, contextCache, textureCache, features, billTexture } = geometry.properties;
            if (!oldPickingId || !oldPickingId.length) {
                continue;
            }
            let tileRedraw = false;
            let refreshTexCoord = false;
            const count = oldPickingId.length;
            for (let i = 0; i < count; i++) {
                const pickingId = oldPickingId[i];
                const context = contextCache[pickingId] = contextCache[pickingId] || {};
                const feature = features[pickingId] && features[pickingId].feature;
                if (!feature) {
                    continue;
                }
                const current = textureCache[pickingId];
                let currentWidth = 0;
                let currentHeight = 0;
                if (current) {
                    currentWidth = current.width;
                    currentHeight = current.height;
                }
                let tex = source(context, feature.properties);
                let texture;
                if (tex.redraw) {
                    tileRedraw = redraw = true;
                    texture = textureCache[pickingId] = tex.data;
                    if (currentWidth !== texture.width || currentHeight !== texture.height) {
                        refreshTexCoord = true;
                    }
                } else {
                    texture = textureCache[pickingId];
                }
                bins.push({
                    id: pickingId,
                    w: texture.width,
                    h: texture.height
                });
            }
            if (tileRedraw) {
                const aTexCoord = refreshTexCoord ? geometry.properties.aTexCoord : null;
                const image = this._fillFnTextureData(aTexCoord, geometry, bins);
                billTexture({
                    width: image.width,
                    height: image.height,
                    data: image.data,
                    format: image.format,
                    mag: 'linear',
                    min: 'linear',
                    flipY: false,
                    premultiplyAlpha: true
                });
                if (refreshTexCoord) {
                    geometry.updateData('aTexCoord', geometry.properties.aTexCoord);
                }
            }
        }
        return redraw;
    }

    isTerrainSkin() {
        return false;
    }

    isTerrainVector() {
        return this.layer.options.awareOfTerrain;
    }

    isUniqueStencilRefPerTile() {
        return false;
    }

    createMesh(geo, transform, { tilePoint }) {
        if (!this._ready) {
            return null;
        }
        let { geometry: pointGeo } = geo;
        const { features, tileResolution, tileRatio } = pointGeo.properties;
        if (!pointGeo.data.aPosition || pointGeo.data.aPosition.length === 0) {
            return null;
        }

        const geometry = this._createBillboard(pointGeo, pointGeo.desc.positionSize, features);
        geometry.generateBuffers(this.regl);
        pointGeo.properties.billGeometry = geometry;

        const material = new reshader.Material({
            billTexture: geometry.properties.billTexture
        });
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        const map = this.getMap();
        TILE_POINT.set(tilePoint[0], tilePoint[1]);
        // const tileCoord = map.pointAtResToCoord(TILE_POINT, tileResolution);
        // const centiMeterToLocal = map.distanceToPointAtRes(100, 100, geometry.properties.tileResolution)['_multi'](tileRatio / 10000).toArray();
        const extrudeScale = map.altitudeToPoint(1, tileResolution) * tileRatio;

        mesh.setUniform('extrudeScale', extrudeScale / 100);
        const textureSize = [];
        mesh.setFunctionUniform('textureSize', () => {
            const billTexture = geometry.properties.billTexture;
            textureSize[0] = billTexture.width;
            textureSize[1] = billTexture.height;
            return textureSize;
        })
        const defines = {};
        if (mesh.geometry.data.aAltitude) {
            defines['HAS_ALTITUDE'] = 1;
        }
        mesh.setDefines(defines);
        mesh.positionMatrix = this.getAltitudeOffsetMatrix();
        mesh.setLocalTransform(transform);
        mesh.properties.symbolIndex = { index: 0 };
        return mesh;
    }

    _createBillboard(geometry, positionSize, features) {
        const tileZoom = geometry.properties.z;
        const { aPosition, aPickingId } = geometry.data;
        const geoProps = geometry.properties;
        geoProps.oldPickingId = aPickingId;
        const contextCache = geoProps.contextCache = [];
        const textureCache = geoProps.textureCache = [];
        const count = aPickingId.length;
        const newCount = count * 6;
        const newPosition = new aPosition.constructor(newCount * positionSize);
        const aExtrude = new Int16Array(newCount * 2);
        const aQuat = new Float32Array(newCount * 4);
        const newPickingId = new aPickingId.constructor(newCount);

        const source = this.getSymbolDef({ index: 0 }).source;
        const bins = [];

        for (let i = 0; i < count; i++) {
            const pos = aPosition.subarray(i * positionSize, (i + 1) * positionSize);
            const pickingId = aPickingId[i];
            newPosition.set(pos, i * 6 * positionSize);
            newPosition.set(pos, (i * 6 + 1) * positionSize);
            newPosition.set(pos, (i * 6 + 2) * positionSize);
            newPosition.set(pos, (i * 6 + 3) * positionSize);
            newPosition.set(pos, (i * 6 + 4) * positionSize);
            newPosition.set(pos, (i * 6 + 5) * positionSize);

            newPickingId[i * 6] = pickingId;
            newPickingId[i * 6 + 1] = pickingId;
            newPickingId[i * 6 + 2] = pickingId;
            newPickingId[i * 6 + 3] = pickingId;
            newPickingId[i * 6 + 4] = pickingId;
            newPickingId[i * 6 + 5] = pickingId;
        }

        const isFnSource = isFunction(source);
        for (let i = 0; i < count; i++) {
            const pickingId = aPickingId[i];
            const feature = features[pickingId];

            let texture;
            if (isFnSource) {
                const context = contextCache[pickingId] = contextCache[pickingId] || {};
                const tex = source(context, feature && feature.feature && feature.feature.properties);
                texture = tex.data;
                textureCache[pickingId] = texture;
                bins.push({
                    id: pickingId,
                    w: texture.width,
                    h: texture.height
                });
            } else {
                texture = this._image;
            }
            this._fillExtrude(aExtrude, i, feature, tileZoom);
            this._fillQuat(aQuat, i, feature, tileZoom);
        }

        const aTexCoord = new Int16Array(newCount * 2);
        if (bins.length) {
            const image = this._fillFnTextureData(aTexCoord, geometry, bins);
            geoProps.billTexture = createAtlasTexture(this.regl, image, false, false);
        } else {
            const imageBin = { x: 0, y: 0, w: this._image.width, h: this._image.height };
            for (let i = 0; i < count; i++) {
                this._fillTexCoord(aTexCoord, i, imageBin, 1);
            }
            const image = this._image;
            geoProps.billTexture = this.regl.texture({
                width: image.width,
                height: image.height,
                data: image
            });
        }
        const eleCount = count * 6;
        const ctor = getIndexArrayType(eleCount);
        const elements = [];
        for (let i = 0; i < count; i++) {
            const base = i * 6;
            elements.push(base, base + 1, base + 2);
            elements.push(base + 3, base + 4, base + 5);
        }

        const data = {
            aPosition: newPosition,
            aPickingId: newPickingId,
            aExtrude,
            aQuat,
            aTexCoord
        };

        const { feaPickingIdMap, aFeaIds } = geometry.properties;
        const newFeaIds = new aFeaIds.constructor(newCount);
        for (let i = 0; i < newPickingId.length; i++) {
            newFeaIds[i] = feaPickingIdMap[newPickingId[i]];
        }
        geoProps.aFeaIds = newFeaIds;
        geoProps.aTexCoord = aTexCoord;
        const geo = new reshader.Geometry(data, new ctor(elements), 0, { positionSize });
        geo.properties = geometry.properties;
        return geo;
    }

    _fillQuat(aQuat, i, feature, tileZoom) {
        let rotationX = this._rotationX || 0;
        let rotationY = this._rotationY || 0;
        let rotationZ = this._rotationZ || 0;
        const properties = feature && feature.feature && feature.feature.properties;
        if (this._rotationXFn) {
            rotationX = this._rotationXFn(tileZoom, properties);
        }
        if (this._rotationYFn) {
            rotationY = this._rotationYFn(tileZoom, properties);
        }
        if (this._rotationZFn) {
            rotationZ = this._rotationZFn(tileZoom, properties);
        }

        quat.fromEuler(OUT_QUAT, rotationX, rotationY, -rotationZ);
        for (let j = 0; j < 6; j++) {
            aQuat.set(OUT_QUAT, (i + j) * 4);
        }

    }

    _fillExtrude(aExtrude, i, feature, tileZoom) {
        let width = this._width || 0;
        let height = this._height || 0;
        const properties = feature && feature.feature && feature.feature.properties;
        if (this._widthFn) {
            width = this._widthFn(tileZoom, properties);
        }
        if (this._heightFn) {
            height = this._heightFn(tileZoom, properties);
        }
        // to centimeter
        const hw = width / 2 * 100;
        const hh = height / 2 * 100;

        // 左下
        sizeOut[0] = -hw;
        sizeOut[1] = -hh;
        aExtrude.set(sizeOut, i * 2);

        // 右上
        sizeOut[0] = hw;
        sizeOut[1] = hh;
        aExtrude.set(sizeOut, i * 2 + 2);

        // 左上
        sizeOut[0] = -hw;
        sizeOut[1] = hh;
        aExtrude.set(sizeOut, i * 2 + 4);

        // 左下
        sizeOut[0] = -hw;
        sizeOut[1] = -hh;
        aExtrude.set(sizeOut, i * 2 + 6);

        // 右下
        sizeOut[0] = hw;
        sizeOut[1] = -hh;
        aExtrude.set(sizeOut, i * 2 + 8);

        // 右上
        sizeOut[0] = hw;
        sizeOut[1] = hh;
        aExtrude.set(sizeOut, i * 2 + 10);
    }

    _fillFnTextureData(aTexCoord, geometry, bins) {
        const geoProps = geometry.properties;
        const { textureCache, oldPickingId } = geoProps;
        const count = oldPickingId.length;
        const pack = new ShelfPack(0, 0, { autoResize: true });

        const ctx = canvas.getContext('2d');
        pack.pack(bins, { inPlace: true });
        const limit = this.sceneConfig.textureLimit || 1024;
        let ratio = 1;
        if (pack.w * pack.h > limit * limit) {
            ratio = Math.sqrt(limit * limit / (pack.w * pack.h));
            pack.resize(Math.floor(pack.w * ratio), Math.floor(pack.h * ratio));
        }
        const image = new RGBAImage({ width: pack.w, height: pack.h });
        for (let i = 0; i < count; i++) {
            const bin = bins[i];
            if (aTexCoord) {
                this._fillTexCoord(aTexCoord, i, bin, ratio);
            }
            const texture = textureCache[bin.id];
            if (!texture) {
                continue;
            }
            const w = Math.floor(bin.w * ratio);
            const h = Math.floor(bin.h * ratio);
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(texture, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h);
            RGBAImage.copy(
                data, image, { x: 0, y: 0 },
                { x: Math.floor(bin.x * ratio), y: Math.floor(bin.y * ratio) },
                { width: w, height: h }
            );
        }
        image.format = 'rgba';
        return image;
    }

    _fillTexCoord(aTexCoord, i, bin, ratio) {
        const { x, y, w, h } = bin;

        const left = Math.floor(x * ratio);
        const right = Math.floor((x + w) * ratio);
        const top = Math.floor(y * ratio);
        const bottom = Math.floor((y + h) * ratio);

        // 左下
        sizeOut[0] = left;
        sizeOut[1] = bottom;
        aTexCoord.set(sizeOut, i * 2);

        // 右上
        sizeOut[0] = right;
        sizeOut[1] = top;
        aTexCoord.set(sizeOut, i * 2 + 2);

        // 左上
        sizeOut[0] = left;
        sizeOut[1] = top;
        aTexCoord.set(sizeOut, i * 2 + 4);

        // 左下
        sizeOut[0] = left;
        sizeOut[1] = bottom;
        aTexCoord.set(sizeOut, i * 2 + 6);

        // 右下
        sizeOut[0] = right;
        sizeOut[1] = bottom;
        aTexCoord.set(sizeOut, i * 2 + 8);

        // 右上
        sizeOut[0] = right;
        sizeOut[1] = top;
        aTexCoord.set(sizeOut, i * 2 + 10);
    }

    init() {
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return this.canvas ? this.canvas.width : 1;
            },
            height: () => {
                return this.canvas ? this.canvas.height : 1;
            }
        };
        const projViewModelMatrix = [];
        const config = {
            vert,
            frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                        return projViewModelMatrix;
                    }
                }
            ],
            defines: null,
            extraCommandProps: {
                viewport,
                // stencil: {
                //     enable: false,
                //     func: {
                //         cmp: () => {
                //             return stencil ? '=' : '<=';
                //         },
                //         ref: (context, props) => {
                //             return stencil ? props.stencilRef : props.level;
                //         },
                //         mask: 0xFF
                //     },
                //     op: {
                //         fail: 'keep',
                //         zfail: 'keep',
                //         zpass: () => {
                //             return stencil ? 'zero' : 'replace';
                //         }
                //     }
                // },
                depth: {
                    enable: true,
                    range: this.sceneConfig.depthRange || [0, 1],
                    func: this.sceneConfig.depthFunc || '<='
                },
                blend: {
                    enable: true,
                    func: this.getBlendFunc(),
                    equation: 'add'
                },
                cull: {
                    enable: false
                }
            }
        };

        this.shader = new reshader.MeshShader(config);
        this.shader.version = 300;

        if (this.pickingFBO) {
            const projViewModelMatrix = [];
            this.picking = [new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + pickingVert,
                    uniforms: [
                        {
                            name: 'projViewModelMatrix',
                            type: 'function',
                            fn: function (context, props) {
                                mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                                return projViewModelMatrix;
                            }
                        }
                    ],
                    extraCommandProps: {
                        viewport: this.pickingViewport,
                        depth: {
                            enable: true,
                            range: this.sceneConfig.depthRange || [0, 1],
                            func: this.sceneConfig.depthFunc || '<='
                        },
                        cull: {
                            enable: false
                        }
                    }
                },
                this.pickingFBO,
                this.getMap()
            )];
        }
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix;
        return {
            projViewMatrix
        };
    }

    deleteMesh(meshes, keepGeometry) {
        if (Array.isArray(meshes)) {
            for (let i = 0; i < meshes.length; i++) {
                const mesh = meshes[i];
                if (mesh.geometry) {
                    const props = mesh.geometry.properties;
                    const textureCache = props.textureCache;
                    if (textureCache) {
                        delete props.billTexture;
                        delete props.textureCache;
                        delete props.contextCache;
                    }
                }
            }
        } else {
            if (meshes.geometry) {
                const props = meshes.geometry.properties;
                const textureCache = props.textureCache;
                if (textureCache) {
                    delete props.billTexture;
                    delete props.textureCache;
                    delete props.contextCache;
                }
            }
        }
        return super.deleteMesh(meshes, keepGeometry);
    }
}
