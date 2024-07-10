import * as maptalks from 'maptalks';
import { reshader, MaskLayerMixin } from '@maptalks/gl';
import GLTFLayerRenderer from './GLTFLayerRenderer';
import GLTFMarker from './GLTFMarker';
import AbstractGLTFLayer from './common/AbstractGLTFLayer';
import { defined } from './common/Util';

const options = {
    markerTypes: ['gltfmarker', 'multigltfmarker'],
    pointSize: 1
};

export default class GLTFLayer extends MaskLayerMixin(AbstractGLTFLayer) {

    static initDefaultShader() {
        const phongShader = getPhongShader();
        GLTFLayer.registerShader('phong', 'PhongShader', phongShader.shader, phongShader.material.getUniforms());
        const pbrShader = getPBRShader();
        GLTFLayer.registerShader('pbr', 'pbr.StandardShader', pbrShader.shader, pbrShader.material.getUniforms());
        //内置StandardDepthShader，用于在taa阶段绘制，提高性能
        GLTFLayer.registerShader('depth', 'pbr.StandardDepthShader', pbrShader.shader, pbrShader.material.getUniforms());
        const pointLineShader = getPointLineShader();
        GLTFLayer.registerShader('pointline', 'PointLineShader', pointLineShader.shader, pointLineShader.material.getUniforms());
        const wireframeShader = getWireframeShader();
        GLTFLayer.registerShader('wireframe', 'EdgeShader', wireframeShader.shader, wireframeShader.material.getUniforms());
        const litShader = getStandardLiteShader();
        GLTFLayer.registerShader('pbr-lite', 'StandardLiteShader', litShader.shader, litShader.material.getUniforms());
    }

    static fromJSON(json) {
        if (!json || json['type'] !== 'GLTFLayer') {
            return null;
        }
        const layer = new GLTFLayer(json['id'], json['options']);
        const geoJSONs = json['geometries'];
        const geometries = [];
        for (let i = 0; i < geoJSONs.length; i++) {
            const geo = GLTFMarker.parseJSONData(geoJSONs[i]);
            if (geo) {
                geometries.push(geo);
            }
        }
        layer.addGeometry(geometries);
        if (json['style']) {
            layer.setStyle(json['style']);
        }
        return layer;
    }

    setURLModifier(urlModifier) {
        this._urlModifier = urlModifier;
        return this;
    }

    getURLModifier() {
        return this._urlModifier;
    }

    onAdd() {
        const map = this.getMap();
        const geoList = this['_geoList'];
        geoList.forEach(geo => {
            if (!defined(geo.getZoomOnAdded())) {
                geo.setZoomOnAdded(map.getZoom());
            }
        });
        super.onAdd();
    }

    onRemove() {
        super.onRemove();
        this.clear();
    }

    identify(coordinate, options) {
        const map = this.getMap();
        if (!map) {
            return [];
        }
        const containerPoint =  map.coordinateToContainerPoint(new maptalks.Coordinate(coordinate));
        return this.identifyAtPoint(containerPoint, options);
    }

    identifyAtPoint(point, options = {}) {
        const results = [];
        if (!options['excludeMasks']) {
            const identifyMasks = this.identifyMask(point, options);
            if (identifyMasks && identifyMasks.length) {
                maptalks.Util.pushIn(results, identifyMasks);
            }
        }
        const map = this.getMap();
        if (!map) {
            return [];
        }
        const dpr = map.getDevicePixelRatio();
        const x = point.x * dpr, y = point.y * dpr;
        const picked = this._pick(x, y, options);
        if (picked && (picked.data || picked.length)) {
            if (options['includeInternals'] && !options['excludeMasks']) { //由事件抛出
                results.push(picked.data);
                const domEvent = options.domEvent;
                if (domEvent) {
                    domEvent.gltfPickingInfo = domEvent.gltfPickingInfo || {};
                    domEvent.gltfPickingInfo[this.getId()] = picked;
                }
            } else {
                results.push(picked);
            }
        }
        if (options && options.filter) {
            return results.filter(g => options.filter(g));
        } else {
            return results;
        }
    }

    _updateMarkerMap() {
        this.pickingId = 0;
        const markerMap = {};
        for (const pickingId in this._markerMap) {
            const marker = this._markerMap[pickingId];
            marker._setPickingId(this.pickingId);
            marker._setDirty(true);
            markerMap[this.pickingId] = marker;
            const count = marker.getCount() || 1;
            this.pickingId += count;
        }
        this._markerMap = markerMap;
    }

    _onGeometryEvent(param) {
        if (!param || !param['target']) {
            return;
        }
        const type = param['type'];
        if (type === 'meshcreate') {
            this._onMeshCreate(param);
        } else if (type === 'modelerror') {
            this._onModelError(param);
        } else if (type === 'positionchange') {
            const renderer = this.getRenderer();
            if (renderer) {
                renderer.setToRedraw();
            }
        }
        super['_onGeometryEvent'](param);
    }

    _onModelError(param) {
        const { url, info } = param;
        console.error(info);
        this.fire('modelerror', { type: 'modelerror', url,  info });
    }

    _onMeshCreate(param) {
        const url = param.url;
        this._modelMap[url] = 1;
        this.getRenderer().setToRedraw();
        if (this['_isModelsLoadComplete']()) {
            this.fire('modelload', { models: this.getGLTFUrls() });
        }
    }
}

GLTFLayer.initDefaultShader();

GLTFLayer.mergeOptions(options);
GLTFLayer.registerJSONType('GLTFLayer');

GLTFLayer.registerRenderer('gl', GLTFLayerRenderer);

function getPhongShader() {
    const shader = {
        positionAttribute: 'POSITION',
        normalAttribute: 'NORMAL',
        extraCommandProps: {
            blend: {
                enable: true,
                func: {
                    src: 'src alpha',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            }
        }
    };
    const material = new reshader.PhongMaterial();
    return { shader, material };
}

function getPBRShader() {
    const shader = {
        positionAttribute : 'POSITION',
        normalAttribute : 'NORMAL',
        tangentAttribute : 'TANGENT',
        colorAttribute : 'COLOR_0',
        uv0Attribute : 'TEXCOORD_0',
        uv1Attribute : 'TEXCOORD_1',
        extraCommandProps: {
            cull: {
                enable: true
            },
            frontFace: 'ccw',
            // https://github.com/regl-project/regl/blob/gh-pages/API.md#blending
            blend: {
                enable: (_, props) => { return !!props.meshConfig.transparent; },
                func: {
                    srcRGB: 'src alpha',
                    srcAlpha: 1,
                    dstRGB: 'one minus src alpha',
                    dstAlpha: 'one minus src alpha'
                },
                equation: 'add'
            }
        }
    };
    const material = new reshader.pbr.StandardMaterial({});
    return { shader, material };
}

function getPointLineShader() {
    const shader = {
        positionAttribute : 'POSITION',
        color0Attribute : 'COLOR_0',
        extraCommandProps: {
            blend: {
                enable: false,
                func: {
                    src: 'src alpha',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            }
        }
    };
    const material = new reshader.Material();
    return { shader, material };
}

function getWireframeShader() {
    const shader = {
        positionAttribute : 'POSITION',
        extraCommandProps: {
            blend: {
                enable: true,
                func: {
                    srcRGB: 'src alpha',
                    srcAlpha: 1,
                    dstRGB: 'one minus src alpha',
                    dstAlpha: 'one minus src alpha'
                },
                equation: 'add'
            }
        }
    };
    const material = new reshader.Material({ lineColor: [0, 0, 0, 1], lineOpacity: 1 });
    return { shader, material };
}

function getStandardLiteShader() {
    const shader = {
        positionAttribute: 'POSITION',
        normalAttribute: 'NORMAL',
        extraCommandProps: {
            blend: {
                enable: true,
                func: {
                    src: 'src alpha',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            }
        }
    };
    const material = new reshader.StandardLiteMaterial();
    return { shader, material };
}
