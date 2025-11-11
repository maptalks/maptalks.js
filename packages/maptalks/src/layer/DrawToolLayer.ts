import { GEOJSON_TYPES } from "../core/Constants";
import { pushIn } from "../core/util/util";
import { Geometry, LineString, Marker, MultiLineString, MultiPoint, MultiPolygon, Polygon } from "../geometry/index";
import OverlayLayer, { isGeometry, OverlayLayerOptionsType } from "./OverlayLayer";

const options: DrawToolLayerOptionsType = {
    // disable renderer of DrawToolLayer
    renderer: null
};

export default class DrawToolLayer extends OverlayLayer {
    options: DrawToolLayerOptionsType;
    static markerLayerClazz: any;
    static lineLayerClazz: any;
    static polygonLayerClazz: any;
    //@internal
    _markerLayer: any;
    //@internal
    _lineLayer: any;
    //@internal
    _polygonLayer: any;

    static setLayerClass(markerLayerClass, lineLayerClass, polygonLayerClass) {
        DrawToolLayer.markerLayerClazz = markerLayerClass;
        DrawToolLayer.lineLayerClazz = lineLayerClass;
        DrawToolLayer.polygonLayerClazz = polygonLayerClass;
    }
    /**
     * @param id                    - layer's id
     * @param geometries=null       - geometries to add
     * @param options=null          - construct options
     * @param options.style=null    - drawToolLayer's style
     */
    constructor(id: string, geometries?: DrawToolLayerOptionsType | Array<Geometry>,  options: DrawToolLayerOptionsType = {}) {
        if (geometries && (!isGeometry(geometries) && !Array.isArray(geometries) && GEOJSON_TYPES.indexOf((geometries as any).type) < 0)) {
            options = geometries;
            geometries = null;
        }
        super(id, options);
        const depthFunc = this.options.depthFunc || 'always';
        options.sceneConfig = { depthFunc };
        this._markerLayer = new DrawToolLayer.markerLayerClazz(id + '_____________marker', options);
        this._lineLayer = new DrawToolLayer.lineLayerClazz(id + '_____________line', options);
        this._polygonLayer = new DrawToolLayer.polygonLayerClazz(id + '_____________polygon', options);
        if (geometries) {
            this.addGeometry(geometries as Array<Geometry>);
        }
    }

    clear() {
        super.clear();
        this._markerLayer.clear();
        this._lineLayer.clear();
        this._polygonLayer.clear();
        return this;
    }

    bringToFront() {
        this._polygonLayer.bringToFront();
        this._lineLayer.bringToFront();
        this._markerLayer.bringToFront();
        return this;
    }

    addGeometry(geometries: Geometry | Array<Geometry>) {
        if (!Array.isArray(geometries)) {
            geometries = [geometries];
        }
        pushIn(this._geoList, geometries);
        for (let i = 0; i < geometries.length; i++) {
            if (this._markerLayer.isVectorLayer) {
                this._markerLayer.addGeometry(geometries[i]);
                continue;
            }
            if (geometries[i] instanceof Marker || geometries[i] instanceof MultiPoint) {
                this._markerLayer.addGeometry(geometries[i]);
            } else if (geometries[i] instanceof LineString || geometries[i] instanceof MultiLineString) {
                this._lineLayer.addGeometry(geometries[i]);
            } else if (geometries[i] instanceof Polygon || geometries[i] instanceof MultiPolygon) {
                this._polygonLayer.addGeometry(geometries[i]);
            }
        }
    }

    removeGeometry(geometries: Geometry | Geometry[]) {
        if (!Array.isArray(geometries)) {
            geometries = [geometries];
        }
        for (let i = 0; i < geometries.length; i++) {
            this._geoList.splice(geometries[i] as any, 1);
            if (this._markerLayer.isVectorLayer) {
                this._markerLayer.removeGeometry(geometries[i]);
                continue;
            }
            if (geometries[i] instanceof Marker || geometries[i] instanceof MultiPoint) {
                this._markerLayer.removeGeometry(geometries[i]);
            } else if (geometries[i] instanceof LineString || geometries[i] instanceof MultiLineString) {
                this._lineLayer.removeGeometry(geometries[i]);
            } else if (geometries[i] instanceof Polygon || geometries[i] instanceof MultiPolygon) {
                this._polygonLayer.removeGeometry(geometries[i]);
            }
        }
    }

    _onRemoveDrawToolGeo(params) {
        const geometries = params.geometries;
        for (let i = 0; i < geometries.length; i++) {
            if (geometries[i]) {
                this._geoList.splice(geometries[i] as any, 1);
            }
        }
    }

    onRemove(): void {
        this._geoList = [];

        this._markerLayer.off('removegeo', this._onRemoveDrawToolGeo, this);
        this._lineLayer.off('removegeo', this._onRemoveDrawToolGeo, this);
        this._polygonLayer.off('removegeo', this._onRemoveDrawToolGeo, this);

        this._markerLayer.remove();
        this._lineLayer.remove();
        this._polygonLayer.remove();
        delete this._markerLayer;
        delete this._lineLayer;
        delete this._polygonLayer;
        return super.onRemove();
    }

    onAdd(): void {
        const map = this.getMap();
        // order is important
        this._polygonLayer.addTo(map);
        this._lineLayer.addTo(map);
        this._markerLayer.addTo(map);

        this._markerLayer.on('removegeo', this._onRemoveDrawToolGeo, this);
        this._lineLayer.on('removegeo', this._onRemoveDrawToolGeo, this);
        this._polygonLayer.on('removegeo', this._onRemoveDrawToolGeo, this);
        return super.onAdd();
    }

    getRenderer() {
        return this._getRenderer();
    }

    _getRenderer() {
        return this._markerLayer.getRenderer();
    }
}

DrawToolLayer.mergeOptions(options);

type DrawToolLayerOptionsType = OverlayLayerOptionsType & {
    depthFunc?: string
    sceneConfig?: any
    enableAltitude?: boolean
    enableSimplify?: boolean
}
