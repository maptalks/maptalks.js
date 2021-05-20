import * as maptalks from 'maptalks';
import { createREGL, reshader, mat4, vec3 } from '@maptalks/gl';
import { convertToFeature, ID_PROP } from './util/build_geometry';
import { IconRequestor, GlyphRequestor, PointPack } from '@maptalks/vector-packer';
import { extend, isNumber } from '../../common/Util';
import { MARKER_SYMBOL, TEXT_SYMBOL, LINE_SYMBOL } from './util/symbols';
import { KEY_IDX } from '../../common/Constant';
import Promise from '../../common/Promise';
import Vector3DLayer from './Vector3DLayer';

// const SYMBOL_SIMPLE_PROPS = {
//     textFill: 1,
//     textSize: 1,
//     textOpacity: 1,
//     // textHaloRadius: 1,
//     textHaloFill: 1,
//     textHaloOpacity: 1,
//     textPitchAlignment: 1,
//     textRotationAlignment: 1,
//     textDx: 1, //TODO
//     textDy: 1, //TODO

//     // markerWidth: 1,
//     // markerHeight: 1,
//     markerOpacity: 1,
//     markerPitchAlignment: 1,
//     markerRotationAlignment: 1,
//     markerDx: 1, //TODO
//     markerDy: 1, //TODO

//     lineColor: 1,
//     lineWidth: 1,
//     lineOpacity: 1,
//     lineDx: 1, //TODO
//     lineDy: 1, //TODO
//     lineGapWidth: 1, //TODO
//     lineDasharray: null,

//     polygonFill: 1,
//     polygonOpacity: 1
// };

let meshUID = 1;

class Vector3DLayerRenderer extends maptalks.renderer.CanvasRenderer {
    constructor(...args) {
        super(...args);
        this.features = {};
        this._geometries = {};
        this._counter = 1;
        this._allFeatures = {};
        this._markerFeatures = {};
        this._textFeatures = {};
        this._lineFeatures = {};
        this._dirtyAll = true;
        this._kidGen = { id: 0 };
        this._markerSymbol = extend({}, MARKER_SYMBOL, TEXT_SYMBOL);
    }

    hasNoAARendering() {
        return true;
    }

    //always redraw when map is interacting
    needToRedraw() {
        const redraw = super.needToRedraw();
        if (!redraw) {
            return this.painter && this.painter.needToRedraw() ||
                this.markerPainter && this.markerPainter.needToRedraw() ||
                this.linePainter && this.linePainter.needToRedraw();
        }
        return redraw;
    }

    draw(timestamp, parentContext) {
        const layer = this.layer;
        this.prepareCanvas();
        this._zScale = this._getCentiMeterScale(this.getMap().getGLZoom()); // scale to convert meter to gl point
        if (this._dirtyAll) {
            this.buildMesh();
            this._buildMarkerMesh();
            this._buildLineMesh();
            this._dirtyAll = false;
            this._dirtyGeo = false;
            // this._dirtySymbol = false;
        } else if (this._dirtyGeo) {
            const atlas = this.atlas;
            const markerAtlas = this.markerAtlas;
            const lineAtlas = this.lineAtlas;
            delete this.atlas;
            delete this.markerAtlas;
            delete this.lineAtlas;
            this.buildMesh(atlas);
            this._buildMarkerMesh(markerAtlas);
            this._buildLineMesh(lineAtlas);
            this._dirtyGeo = false;
            // this._dirtySymbol = false;
        }/* else if (this._dirtySymbol) {
            this.updateSymbol();
            this._dirtySymbol = false;
        }*/
        if (!this.meshes && !this.markerMeshes && !this.lineMeshes) {
            this.completeRender();
            return;
        }
        if (layer.options['collision']) {
            layer.clearCollisionIndex();
        }
        this._frameTime = timestamp;
        this._parentContext = parentContext || {};
        const context = this._preparePaintContext();
        if (this.painter && this.meshes) {
            this.painter.startFrame(context);
            this.painter.addMesh(this.meshes);
            this.painter.prepareRender(context);
            this.painter.render(context);
        }

        if (this.lineMeshes) {
            this.linePainter.startFrame(context);
            this.linePainter.addMesh(this.lineMeshes);
            this.linePainter.prepareRender(context);
            this.linePainter.render(context);
        }

        if (this.markerMeshes) {
            this.markerPainter.startFrame(context);
            this.markerPainter.addMesh(this.markerMeshes);
            this.markerPainter.prepareRender(context);
            if (layer.options.collision) {
                this.markerPainter.updateCollision(context);
            }

            this.markerPainter.render(context);
        }

        this.completeRender();
        this.layer.fire('canvasisdirty');
    }

    supportRenderMode(mode) {
        return mode === 'noAa';
    }

    isForeground() {
        return true;
    }

    _preparePaintContext() {
        const context = {
            regl: this.regl,
            layer: this.layer,
            symbol: this._layerSymbol,
            gl: this.gl,
            sceneConfig: this.layer.options.sceneConfig,
            pluginIndex: 0,
            cameraPosition: this.getMap().cameraPosition,
            timestamp: this.getFrameTimestamp()
        };
        if (this._parentContext) {
            extend(context, this._parentContext);
        }
        return context;
    }

    drawOnInteracting(event, timestamp, parentContext) {
        this.draw(timestamp, parentContext);
    }

    getFrameTimestamp() {
        return this._frameTime;
    }

    // updateSymbol() {
    //     this.painter.updateSymbol(this.painterSymbol, this.painterSymbol);
    // }

    _getFeaturesToRender() {
        const features = [];
        const center = [0, 0, 0, 0];
        //为了解决UglifyJS对 feature[KEY_IDX] 不正确的mangle
        // const keyName = (KEY_IDX + '').trim();
        // let count = 0;
        for (const p in this.features) {
            if (this.features.hasOwnProperty(p)) {
                const feature = this.features[p];
                if (Array.isArray(feature)) {
                    // count = count++;
                    for (let i = 0; i < feature.length; i++) {
                        const fea = feature[i];
                        if (fea.visible) {
                            this.addCoordsToCenter(fea.geometry, center);
                            // fea[keyName] = count++;
                            features.push(fea);
                        }
                    }
                } if (feature.visible) {
                    this.addCoordsToCenter(feature.geometry, center);
                    // feature[keyName] = count++;
                    features.push(feature);
                }

            }
        }

        if (!features.length) {
            if (this.meshes && this.painter) {
                this.painter.deleteMesh(this.meshes);
                delete this.meshes;
            }
            if (this.markerMeshes) {
                this.markerPainter.deleteMesh(this.meshes);
                delete this.markerMeshes;
            }
            if (this.lineMeshes) {
                this.linePainter.deleteMesh(this.meshes);
                delete this.lineMeshes;
            }
        }
        if (center[3]) {
            center[0] /= center[3];
            center[1] /= center[3];
        }
        return {
            features,
            center
        };
    }

    buildMesh(atlas) {
        if (!this.painter) {
            return;
        }
        //TODO 更新symbol的优化
        //1. 如果只影响texture，则只重新生成texture
        //2. 如果不影响Geometry，则直接调用painter.updateSymbol
        //3. Geometry和Texture全都受影响时，则全部重新生成
        const { features, center } = this._getFeaturesToRender();
        if (!features.length) {
            return;
        }

        this.createMesh(features, atlas, center).then(m => {
            if (this.meshes) {
                this.painter.deleteMesh(this.meshes);
            }
            const { mesh, atlas } = m;
            this.meshes = mesh;
            this.atlas = atlas;
            this.setToRedraw();
        });
    }

    createMesh(painter, symbol, features, atlas, center) {
        if (!painter || !features || !features.length) {
            return Promise.resolve(null);
        }
        const options = {
            zoom: this.getMap().getZoom(),
            EXTENT: Infinity,
            requestor: this.requestor,
            atlas,
            center,
            positionType: Float32Array
        };

        const pack = new this.PackClass(features, symbol, options);
        const v0 = [], v1 = [];
        return pack.load().then(packData => {
            if (!packData) {
                return null;
            }
            const geometry = painter.prepareGeometry(packData.data, features.map(feature => { return { feature }; }));
            this.fillCommonProps(geometry.geometry);
            const posMatrix = mat4.identity([]);
            //TODO 计算zScale时，zoom可能和tileInfo.z不同
            mat4.translate(posMatrix, posMatrix, vec3.set(v1, center[0], center[1], 0));
            mat4.scale(posMatrix, posMatrix, vec3.set(v0, 1, 1, this._zScale));
            // mat4.scale(posMatrix, posMatrix, vec3.set(v0, glScale, glScale, this._zScale));
            // const transform = mat4.translate([], mat4.identity([]), center);

            // mat4.translate(posMatrix, posMatrix, vec3.set(v0, tilePos.x * glScale, tilePos.y * glScale, 0));
            const mesh = painter.createMesh(geometry, posMatrix, { tilePoint: [center[0], center[1]] });
            mesh.setUniform('level', 0);
            const defines = mesh.defines;
            //不开启ENABLE_TILE_STENCIL的话，frag中会用tileExtent剪切图形，会造成图形绘制不出
            defines['ENABLE_TILE_STENCIL'] = 1;
            mesh.setDefines(defines);
            mesh.properties.meshKey = this.layer.getId();
            return {
                mesh,
                atlas: {
                    iconAtlas: packData.data.iconAtlas
                }
            };
        });
    }

    addCoordsToCenter(geometry, center) {
        for (let i = 0; i < geometry.length; i++) {
            if (isNumber(geometry[i][0])) {
                center[0] += geometry[i][0];
                center[1] += geometry[i][1];
                center[3] += 1;
            } else {
                for (let ii = 0; ii < geometry[i].length; ii++) {
                    if (isNumber(geometry[i][ii][0])) {
                        center[0] += geometry[i][ii][0];
                        center[1] += geometry[i][ii][1];
                        center[3] += 1;
                    } else {
                        for (let iii = 0; iii < geometry[i][ii].length; iii++) {
                            center[0] += geometry[i][ii][iii][0];
                            center[1] += geometry[i][ii][iii][1];
                            center[3] += 1;
                        }
                    }
                }
            }
        }
    }

    fillCommonProps(geometry) {
        const map = this.getMap();
        const props = geometry.properties;
        Object.defineProperty(props, 'tileResolution', {
            enumerable: true,
            get: function () {
                return map.getResolution(map.getGLZoom());
            }
        });
        props.tileRatio = 1;
        props.z = map.getGLZoom();
        props.tileExtent = 1;
    }

    _isEnableWorkAround(key) {
        if (key === 'win-intel-gpu-crash') {
            return this.layer.options['workarounds']['win-intel-gpu-crash'] && isWinIntelGPU(this.gl);
        }
        return false;
    }

    prepareRequestors() {
        if (this._iconRequestor) {
            return;
        }
        const layer = this.layer;
        this._iconRequestor = new IconRequestor({ iconErrorUrl: layer.options['iconErrorUrl'] });
        const useCharBackBuffer = !this._isEnableWorkAround('win-intel-gpu-crash');
        this._glyphRequestor = new GlyphRequestor(fn => {
            layer.getMap().getRenderer().callInNextFrame(fn);
        }, layer.options['glyphSdfLimitPerFrame'], useCharBackBuffer);
        this.requestor = this._fetchPattern.bind(this);
        this._markerRequestor = this._fetchIconGlyphs.bind(this);
    }

    _fetchPattern(icons, glyphs, cb) {
        const dataBuffers = [];
        this._iconRequestor.getIcons(icons, (err, data) => {
            if (err) {
                throw err;
            }
            if (data.buffers) {
                dataBuffers.push(...data.buffers);
            }
            cb(null, { icons: data.icons }, dataBuffers);
        });
    }

    _fetchIconGlyphs(icons, glyphs, cb) {
        //error, data, buffers
        this._glyphRequestor.getGlyphs(glyphs, (err, glyphData) => {
            if (err) {
                throw err;
            }
            const dataBuffers = glyphData.buffers || [];
            this._iconRequestor.getIcons(icons, (err, data) => {
                if (err) {
                    throw err;
                }
                if (data.buffers && data.buffers.length) {
                    dataBuffers.push(...data.buffers);
                }
                cb(null, { icons: data.icons, glyphs: glyphData.glyphs }, dataBuffers);
            });
        });
        //error, data, buffers

    }

    _buildMarkerMesh(atlas) {
        const markerUIDs = Object.keys(this._markerFeatures);
        const textUIDs = Object.keys(this._textFeatures);
        if (!markerUIDs.length && !textUIDs.length) {
            if (this.markerMeshes) {
                this.markerPainter.deleteMesh(this.markerMeshes);
                delete this.markerMeshes;
            }
            return;
        }

        const  { features, center } = this._getFeaturesToRender();

        const keyName = (KEY_IDX + '').trim();
        const markerFeatures = [];
        const textFeatures = [];
        for (let i = 0; i < features.length; i++) {
            const kid = features[i][keyName];
            if (this._markerFeatures[kid]) {
                markerFeatures.push(features[i]);
            }
            if (this._textFeatures[kid]) {
                textFeatures.push(features[i]);
            }
        }
        if (!markerFeatures.length && !textFeatures.length) {
            if (this.markerMeshes) {
                this.markerPainter.deleteMesh(this.markerMeshes);
                delete this.markerMeshes;
            }
            return;
        }
        const markerOptions = {
            zoom: this.getMap().getZoom(),
            EXTENT: Infinity,
            requestor: this._markerRequestor,
            atlas,
            center,
            positionType: Float32Array,
            altitudeProperty: 'altitude',
            defaultAltitude: 0
        };
        const textOptions = extend({}, markerOptions);
        markerOptions.allowEmptyPack = 1;

        const symbols = PointPack.splitPointSymbol(this._markerSymbol);
        const pointPacks = symbols.map((symbol, idx) => new PointPack(idx === 0 ? markerFeatures : textFeatures, symbol, idx === 0 ? markerOptions : textOptions).load());
        this.markerAtlas = {
        };
        const v0 = [], v1 = [];
        Promise.all(pointPacks).then(packData => {
            if (this.markerMeshes) {
                this.markerPainter.deleteMesh(this.markerMeshes);
                delete this.markerMeshes;
            }
            if (!packData || !packData.length) {
                this.setToRedraw();
                return;
            }
            const geometries = this.markerPainter.prepareGeometry(packData.map(d => d && d.data), this._allFeatures);

            for (let i = 0; i < geometries.length; i++) {
                this.fillCommonProps(geometries[i].geometry, packData[i] && packData[i].data);
            }
            const iconAtlas = packData[0] && packData[0].data.iconAtlas;
            const glyphAtlas = packData[0] && packData[0].data.glyphAtlas || packData[1] && packData[1].data.glyphAtlas;
            if (iconAtlas) {
                this.markerAtlas.iconAtlas = iconAtlas;
            }
            if (glyphAtlas) {
                this.markerAtlas.glyphAtlas = glyphAtlas;
            }


            const posMatrix = mat4.identity([]);
            //TODO 计算zScale时，zoom可能和tileInfo.z不同
            mat4.translate(posMatrix, posMatrix, vec3.set(v1, center[0], center[1], 0));
            mat4.scale(posMatrix, posMatrix, vec3.set(v0, 1, 1, this._zScale));
            // mat4.scale(posMatrix, posMatrix, vec3.set(v0, glScale, glScale, this._zScale))
            const meshes = this.markerPainter.createMesh(geometries, posMatrix);
            if (Array.isArray(meshes)) {
                for (let i = 0; i < meshes.length; i++) {
                    meshes[i].setUniform('level', 0);
                    meshes[i].material.set('flipY', 1);
                    meshes[i].properties.meshKey = meshUID++;
                }
            } else {
                meshes.setUniform('level', 0);
                meshes.material.set('flipY', 1);
                meshes.properties.meshKey = meshUID++;
            }

            this.markerMeshes = meshes;
            this.setToRedraw();
        });
    }

    _buildLineMesh(atlas) {
        const lineUIDs = Object.keys(this._lineFeatures);
        if (!lineUIDs.length) {
            if (this.lineMeshes) {
                this.linePainter.deleteMesh(this.lineMeshes);
                delete this.lineMeshes;
            }
            return;
        }
        const { features, center } = this._getFeaturesToRender();
        if (!features.length) {
            return;
        }

        //因为有虚线和没有虚线的line绘制逻辑不同，需要分开创建mesh
        const feas = [];
        const dashFeas = [];
        for (let i = 0; i < features.length; i++) {
            const f = features[i];
            if (f.properties && f.properties['lineDasharray']) {
                dashFeas.push(f);
            } else {
                feas.push(f);
            }
        }

        const symbol = extend({}, LINE_SYMBOL);
        const promises = [
            this.createMesh(this.linePainter, symbol, feas, atlas && atlas[0], center),
            this.createMesh(this.linePainter, symbol, dashFeas, atlas && atlas[1], center)
        ];

        Promise.all(promises).then(mm => {
            if (this.lineMeshes) {
                this.linePainter.deleteMesh(this.lineMeshes);
            }
            const meshes = [];
            const atlas = [];
            for (let i = 0; i < mm.length; i++) {
                if (mm[i]) {
                    meshes.push(mm[i].mesh);
                    atlas[i] = mm[i].atlas;
                }
            }
            this.lineMeshes = meshes;
            this.lineAtlas = atlas;
            this.setToRedraw();
        });
    }

    _markRebuildGeometry() {
        this._dirtyGeo = true;
    }

    _markRebuild() {
        this._dirtyAll = true;
    }


    _convertGeometries(geometries) {
        const layerId = this.layer.getId();
        for (let i = 0; i < geometries.length; i++) {
            const geo = geometries[i];
            let hit = false;
            for (let ii = 0; ii < this.GeometryTypes.length; ii++) {
                if (geo instanceof this.GeometryTypes[ii]) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                throw new Error(`${geo.getJSONType()} can't be added to ${this.layer.getJSONType()}(id:${layerId}).`);
            }
            if (!geo[ID_PROP]) {
                geo[ID_PROP] = this._counter++;
            }
            const uid = geo[ID_PROP];
            if (this.features[uid]) {
                this._removeFeatures(uid);
            }
            this.features[uid] = convertToFeature(geo, this._kidGen);
            const feas = this.features[uid];
            this._refreshFeatures(feas);
            this.features[uid][ID_PROP] = uid;
            this._geometries[uid] = geo;
        }
    }

    _refreshFeatures(feas) {
        const keyName = (KEY_IDX + '').trim();
        const kid = Array.isArray(feas) ? feas[0][keyName] : feas[keyName];
        this._allFeatures[kid] = feas;
        if (Array.isArray(feas)) {
            // 但geometry多symbol时，markerFeatures中只会保存最后一个feature的属性
            for (let j = 0; j < feas.length; j++) {
                // kid 是painter内部用来
                const kid = feas[j][keyName];
                // const feaObj = { feature: feas[j] };
                if (hasMarkerSymbol(feas[j])) {
                    this._markerFeatures[kid] = 1;
                    // this._markerFeatures[kid].push(feaObj);
                }
                if (hasTextSymbol(feas[j])) {
                    this._textFeatures[kid] = 1;
                    // this._textFeatures[kid].push(feaObj);
                }
                if (hasLineSymbol(feas[j])) {
                    this._lineFeatures[kid] = 1;
                    // this._lineFeatures[uid].push(feaObj);
                }
            }
        } else {
            const kid = feas[keyName];
            const feaObj = { feature: feas };
            if (hasMarkerSymbol(feas)) {
                this._markerFeatures[kid] = 1;
            }
            if (hasTextSymbol(feas)) {
                this._textFeatures[kid] = 1;
            }
            if (hasLineSymbol(feas)) {
                this._lineFeatures[kid] = 1;
            }
            this._allFeatures[kid] = feaObj;
        }
    }

    _removeFeatures(uid) {
        const keyName = (KEY_IDX + '').trim();
        const features = this.features[uid];
        if (Array.isArray(features)) {
            for (let i = 0; i < features.length; i++) {
                const id = features[i][keyName];
                delete this._allFeatures[id];
                delete this._markerFeatures[id];
                delete this._textFeatures[id];
                delete this._lineFeatures[id];
            }
        } else {
            const id = features[keyName];
            delete this._allFeatures[id];
            delete this._markerFeatures[id];
            delete this._textFeatures[id];
            delete this._lineFeatures[id];
        }
    }

    pick(x, y, options) {
        const hits = [];
        const painters = [this.painter, this.markerPainter, this.linePainter];
        painters.forEach(painter => {
            if (!painter) {
                return;
            }
            const picked = painter.pick(x, y, options.tolerance);
            if (picked && picked.data && picked.data.feature) {
                const feature = picked.data.feature;
                hits.push(this._geometries[feature[ID_PROP]]);
            }
        });
        return hits;
    }

    onGeometryAdd(geometries) {
        if (!geometries || !geometries.length) {
            return;
        }
        this._convertGeometries(geometries);
        this._markRebuild();
        redraw(this);
    }

    onGeometryRemove(geometries) {
        if (!geometries || !geometries.length) {
            return;
        }
        for (let i = 0; i < geometries.length; i++) {
            const geo = geometries[i];
            if (geo[ID_PROP] !== undefined) {
                delete this.features[geo[ID_PROP]];
                delete this._geometries[geo[ID_PROP]];
            }
        }
        this._markRebuild();
        redraw(this);
    }

    onGeometrySymbolChange(e) {
        // const { properties } = e;
        //TODO 判断properties中哪些只需要调用painter.updateSymbol
        // 如果有，则更新 this.painterSymbol 上的相应属性，以触发painter中的属性更新
        const marker = e.target;
        const id = marker[ID_PROP];
        if (this.features[id]) {
            const symbol = marker['_getInternalSymbol']();
            const feaProps = this.features[id].properties;
            for (const p in feaProps) {
                if (p.indexOf('_symbol_') === 0) {
                    delete feaProps[p];
                }
            }
            for (const p in symbol) {
                feaProps['_symbol_' + p] = symbol[p];
            }
        }
        // this.features[id] = convertToFeature(marker);
        // TODO 实现geometry的局部更新
        this._markRebuild();
        redraw(this);

        // if (this._dirtyAll) {
        //     redraw(this);
        //     return;
        // }


        // let rebuild = false;
        // for (const p in properties) {
        //     if (properties[p] !== undefined && !SYMBOL_SIMPLE_PROPS[p]) {
        //         rebuild = true;
        //         break;
        //     }
        // }
        // if (!rebuild) {
        //     if (this.painterSymbol) {
        //         if (!this._dirtyGeo || !this._dirtySymbol) {
        //             for (const p in properties) {
        //                 const old = this.painterSymbol[p];
        //                 //new symbol property to force painter refresh geometry's attribute
        //                 this.painterSymbol[p] = {
        //                     type: old.type,
        //                     default: old.default,
        //                     property: old.property
        //                 };

        //             }
        //             this._markUpdateSymbol();
        //         }
        //     }

        // } else {
        //     this._markRebuild();
        // }
        // this._markRebuild();
        // redraw(this);
    }

    onGeometryShapeChange(e) {
        this._convertGeometries([e.target]);
        this._markRebuildGeometry();
        redraw(this);
    }

    onGeometryPositionChange(e) {
        this._convertGeometries([e.target]);
        this._markRebuildGeometry();
        redraw(this);
    }

    onGeometryZIndexChange() {
        // redraw(this);
    }

    onGeometryShow() {
        this._markRebuildGeometry();
        redraw(this);
    }

    onGeometryHide() {
        this._markRebuildGeometry();
        redraw(this);
    }

    onGeometryPropertiesChange(e) {
        //TODO 可能会更新textName
        // this._markRebuildGeometry();
        const geo = e.target;
        const uid = geo[ID_PROP];
        this.features[uid] = convertToFeature(geo, this._kidGen);
        if (Array.isArray(this.features[uid])) {
            const feature = this.features[uid];
            for (let i = 0; i < feature.length; i++) {
                feature[i][ID_PROP] = uid;
            }
        } else {
            this.features[uid][ID_PROP] = uid;
        }

        this._refreshFeatures(this.features[uid]);
        this._markRebuild();
        redraw(this);
    }

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            this._createREGLContext();
        }
        if (inGroup) {
            this.canvas.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        }
        this.prepareRequestors();
        this.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        this.painter = this.createPainter();
        const IconPainter = Vector3DLayer.get3DPainterClass('icon');
        const markerSymbol = extend({}, MARKER_SYMBOL, TEXT_SYMBOL);
        this.markerPainter = new IconPainter(this.regl, this.layer, markerSymbol, this.layer.options.sceneConfig, 0);

        const LinePainter = Vector3DLayer.get3DPainterClass('line');
        const lineSymbol = extend({}, LINE_SYMBOL);
        this.linePainter = new LinePainter(this.regl, this.layer, lineSymbol, this.layer.options.sceneConfig, 0);

        if (this.layer.getGeometries()) {
            this.onGeometryAdd(this.layer.getGeometries());
        }
    }

    createPainter() {

    }

    _createREGLContext() {
        const layer = this.layer;

        const attributes = layer.options.glOptions || {
            alpha: true,
            depth: true,
            antialias: false
            // premultipliedAlpha : false
        };
        attributes.preserveDrawingBuffer = true;
        attributes.stencil = true;
        this.glOptions = attributes;
        this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        this.regl = createREGL({
            gl: this.gl,
            attributes,
            extensions: reshader.Constants['WEBGL_EXTENSIONS'],
            optionalExtensions: reshader.Constants['WEBGL_OPTIONAL_EXTENSIONS']
        });
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) { }
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    clearCanvas() {
        super.clearCanvas();
        if (!this.regl) {
            return;
        }
        //这里必须通过regl来clear，如果直接调用webgl context的clear，则brdf的texture会被设为0
        this.regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
            stencil: 0xFF
        });
    }

    resizeCanvas(canvasSize) {
        super.resizeCanvas(canvasSize);
        const canvas = this.canvas;
        if (!canvas) {
            return;
        }
        if (this.pickingFBO && (this.pickingFBO.width !== canvas.width || this.pickingFBO.height !== canvas.height)) {
            this.pickingFBO.resize(canvas.width, canvas.height);
        }
        if (this.painter) {
            this.painter.resize(canvas.width, canvas.height);
        }
    }

    onRemove() {
        super.onRemove();
        if (this.painter) {
            this.painter.delete();
        }
        if (this.markerPainter) {
            this.markerPainter.delete();
        }
        if (this.linePainter) {
            this.linePainter.delete();
        }
    }

    drawOutline(fbo) {
        if (this._outlineAll) {
            if (this.painter) {
                this.painter.outlineAll(fbo);
            }
            this.markerPainter.outlineAll(fbo);
            this.linePainter.outlineAll(fbo);
        }
        if (this._outlineFeatures) {
            for (let i = 0; i < this._outlineFeatures.length; i++) {
                if (this.painter) {
                    this.painter.outline(fbo, this._outlineFeatures[i]);
                }
                this.markerPainter.outline(fbo, this._outlineFeatures[i]);
                this.linePainter.outline(fbo, this._outlineFeatures[i]);

            }
        }
    }

    outlineAll() {
        this._outlineAll = true;
        this.setToRedraw();
    }

    outline(geoIds) {
        if (!this._outlineFeatures) {
            this._outlineFeatures = [];
        }
        const keyName = (KEY_IDX + '').trim();
        const featureIds = [];
        for (let i = 0; i < geoIds.length; i++) {
            const geo = this.layer.getGeometryById(geoIds[i]);
            if (geo) {
                const features = this.features[geo[ID_PROP]];
                if (Array.isArray(features)) {
                    for (let j = 0; j < features.length; j++) {
                        featureIds.push(features[j][keyName]);
                    }
                } else {
                    featureIds.push(features[keyName]);
                }
            }
        }
        this._outlineFeatures.push(featureIds);
        this.setToRedraw();
    }

    cancelOutline() {
        delete this._outlineAll;
        delete this._outlineFeatures;
        this.setToRedraw();
    }

    isEnableWorkAround(key) {
        if (key === 'win-intel-gpu-crash') {
            return this.layer.options['workarounds']['win-intel-gpu-crash'] && isWinIntelGPU(this.gl);
        }
        return false;
    }

    _getCentiMeterScale(z) {
        const map = this.getMap();
        const p = map.distanceToPoint(1000, 0, z).x;
        return p / 1000 / 10;
    }
}

function redraw(renderer) {
    renderer.setToRedraw();
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

export default Vector3DLayerRenderer;

const prefix = '_symbol_';
function hasMarkerSymbol({ properties }) {
    return properties[prefix + 'markerFile'] || properties[prefix + 'markerType'];
}

function hasTextSymbol({ properties }) {
    return properties[prefix + 'textName'];
}

function hasLineSymbol({ properties }) {
    return !!properties[prefix + 'lineWidth'];
}
