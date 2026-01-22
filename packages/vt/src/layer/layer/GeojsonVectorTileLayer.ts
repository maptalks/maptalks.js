import * as maptalks from "maptalks";

import { isNumber, isObject, isString } from "../../common/Util";

import Ajax from "../../worker/util/Ajax";
import type { ArrayExtent, Callback, LayerJSONType } from "maptalks";
import VectorTileLayer, { VectorTileLayerOptionsType } from "./VectorTileLayer";

const options = {
    //feature data to return from worker
    //for geojson layer, only need to return id of features
    features: true,
    tileBuffer: 64,
    extent: 8192,
    pyramidMode: 1,
    simplifyTolerance: 3,
    tileStackDepth: 0,
    generateOMBB: true,
};

function get3857SpatialReference(maxZoom: number) {
    return {
        projection: "EPSG:3857",
        resolutions: (function () {
            const resolutions = [];
            const d = 6378137 * Math.PI;
            for (let i = 0; i <= maxZoom + 1; i++) {
                resolutions[i] = d / (256 * Math.pow(2, i));
            }
            return resolutions;
        })(),
        fullExtent: {
            top: 6378137 * Math.PI,
            left: -6378137 * Math.PI,
            bottom: -6378137 * Math.PI,
            right: 6378137 * Math.PI,
        },
    };
}

function get4326SpatialReference(maxZoom: number, code: string) {
    return {
        projection: code,
        fullExtent: {
            top: 90,
            left: -180,
            bottom: -90,
            right: 180,
        },
        resolutions: (function () {
            const resolutions = [];
            for (let i = 0; i <= maxZoom + 1; i++) {
                resolutions[i] = 180 / 2 / (Math.pow(2, i) * 128);
            }
            return resolutions;
        })(),
    };
}

class GeoJSONVectorTileLayer extends VectorTileLayer {
    options: GeoJSONVectorTileLayerOptionsType;
    features: Record<string, any>;

    //@internal
    _dataExtent: maptalks.Extent;
    //@internal
    _idMaps: Map<string | number, any>;

    constructor(id: string, options: GeoJSONVectorTileLayerParamOptionsType) {
        // use map's spatial reference
        options = options || {};
        options.spatialReference = null;
        super(id, options as GeoJSONVectorTileLayerOptionsType);
        //use map for query perf
        this._idMaps = new Map();
        this.setData(options["data"]);
    }

    _prepareOptions() {
        const map = this.getMap();
        const maxNativeZoom = map.getMaxNativeZoom();
        const projection = map.getProjection();
        const is4326 =
            projection.code === "EPSG:4326" || projection.code === "EPSG:4490";
        if (is4326) {
            this.options.tileSystem = [1, -1, -180, 90];
        }
        this.options.spatialReference = is4326
            ? get4326SpatialReference(maxNativeZoom, projection.code)
            : get3857SpatialReference(maxNativeZoom);
    }

    getWorkerOptions() {
        const options = super.getWorkerOptions();
        let workerData = this.options.data;
        if (isString(workerData) || (workerData && workerData.url)) {
            if (workerData.url) {
                workerData = JSON.parse(JSON.stringify(workerData));
            }
            workerData = convertUrl(workerData, this.getURLModifier());
        } else {
            workerData = this.features;
        }
        options.data = workerData;
        options.tileBuffer = this.options.tileBuffer;
        options.extent = this.options.extent;
        options.hasAltitude = this.options.enableAltitude;
        options.simplifyTolerance = this.options.simplifyTolerance;
        options.projection = this.getSpatialReference().getProjection().code;
        options.generateOMBB = this.options.generateOMBB;
        options.convertFn = this.options.convertFn
            ? this.options.convertFn + ""
            : null;
        return options;
    }

    setData(data: any) {
        this.options.data = data;
        if (data && (isString(data) || data.url)) {
            const renderInited = !!this.getRenderer();
            if (renderInited) {
                this._updateWorker();
            }
            return this;
        }
        this._setData(data);
        this._updateWorker();
        return this;
    }

    //@internal
    _setData(data: unknown) {
        if (this.options.convertFn) {
            const fn = new Function(
                "data",
                this.options.convertFn + "\nreturn convert(data)"
            );
            data = fn(data);
        }
        this.features = data;
        this._generateIdMap();

        return this;
    }

    //@internal
    _updateWorker() {
        const renderer = this.getRenderer();
        if (renderer) {
            const workerConn = (renderer as any).getWorkerConnection();
            if (workerConn) {
                let workerData = this.options.data;
                if (isString(workerData) || (workerData && workerData.url)) {
                    if (workerData.url) {
                        workerData = JSON.parse(JSON.stringify(workerData));
                    }
                    workerData = convertUrl(workerData, this.getURLModifier());
                } else {
                    workerData = this.features;
                }
                workerConn.setData(workerData, (err, params) => {
                    renderer.clear();
                    this.onWorkerReady(null, params);
                    renderer.setToRedraw();
                    setTimeout(() => {
                        // 解决偶发性不重绘的问题
                        renderer.setToRedraw();
                    }, 500);
                });
            }
        }
    }

    getExtent() {
        return this._dataExtent;
    }

    onWorkerReady(err?: any, params?: any) {
        if (err) {
            this.fire("dataerror", { error: err });
            return;
        }
        if (params) {
            if (params.extent) {
                this._setExtent(params.extent);
            }
            if (params.idMap) {
                this._idMaps = params.idMap;
            }
        }
        this.fire("dataload", { extent: params && params.extent });
    }

    //@internal
    _setExtent(extent: ArrayExtent) {
        this._dataExtent = new maptalks.Extent(...extent);
    }

    //@internal
    _fetchData(data: any, cb: Callback) {
        if (isString(data)) {
            Ajax.getJSON(data, cb);
        } else {
            Ajax.getJSON(data.url, data, cb);
        }
    }

    getData() {
        return this.features || null;
    }

    getTileUrl(x: number, y: number, z: number) {
        return this.getId() + "," + x + "," + y + "," + z;
    }

    getFeature(id: number | string) {
        if (!this._idMaps) {
            return null;
        }
        return this._idMaps.get(id);
    }

    static fromJSON(layerJSON: LayerJSONType): GeoJSONVectorTileLayer | null {
        if (!layerJSON || layerJSON["type"] !== "GeoJSONVectorTileLayer") {
            return null;
        }

        return new GeoJSONVectorTileLayer(layerJSON["id"], layerJSON["options"] as any);
    }

    getGeometryById(id: number) {
        return this.getFeature(id);
    }

    //@internal
    _generateIdMap() {
        if (!this.features) {
            return;
        }
        this.features = JSON.parse(JSON.stringify(this.features));
        if (!this.features) {
            return;
        }
        let uid = 0;
        // this._idMaps = {};
        this._idMaps.clear();
        const feaIdProp = this.options.featureIdProperty;
        const data = this.features;
        const features = data.features || data.data || data;
        if (Array.isArray(features)) {
            for (let i = 0, len = features.length; i < len; i++) {
                const f = features[i];
                if (!f) {
                    continue;
                }
                if (!isNumber(f.id)) {
                    f.id = uid++;
                }
                f.properties = f.properties || {};
                if (feaIdProp) {
                    let idProp = feaIdProp;
                    if (isObject(feaIdProp)) {
                        idProp = feaIdProp[f.layer || "0"];
                    }
                    f.id = f.properties[idProp];
                }
                // this._idMaps[f.id] = f;
                this._idMaps.set(f.id, f);
            }
        }
    }
}

GeoJSONVectorTileLayer.registerJSONType("GeoJSONVectorTileLayer");

GeoJSONVectorTileLayer.mergeOptions(options);

export default GeoJSONVectorTileLayer;

function toAbsoluteURL(url) {
    let a = document.createElement("a");
    a.href = url;
    url = a.href;
    a = null;
    return url;
}

function convertUrl(data, urlModifier) {
    if (data.url) {
        if (urlModifier) {
            data.url = urlModifier(data.url);
        } else {
            data.url = toAbsoluteURL(data.url);
        }
    } else {
        if (urlModifier) {
            data = urlModifier(data);
        } else {
            data = toAbsoluteURL(data);
        }
    }
    return data;
}

type OmitUrlTemplate = Omit<VectorTileLayerOptionsType, 'urlTemplate'>;

type OptionsType = {
    features?: string,
    tileBuffer?: number,
    extent?: number,
    pyramidMode?: 1,
    simplifyTolerance?: number,
    tileStackDepth?: number,
    generateOMBB?: boolean,
    data?: any;
    convertFn?: (data: any) => any;
};

export type GeoJSONVectorTileLayerParamOptionsType = OptionsType & OmitUrlTemplate;
export type GeoJSONVectorTileLayerOptionsType = OptionsType & VectorTileLayerOptionsType;
