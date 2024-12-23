import { Geometry, LineString, Marker, MultiLineString, MultiPoint, MultiPolygon, Polygon } from "../geometry/index";
import OverlayLayer, { OverlayLayerOptionsType } from "./OverlayLayer";

const options: DrawToolLayerOptionsType = {
    // disable renderer of DrawToolLayer
    renderer: null
};

export default class DrawToolLayer extends OverlayLayer {
    options: DrawToolLayerOptionsType;
    //@internal
    static markerLayerClazz: any;
    //@internal
    static lineLayerClazz: any;
    //@internal
    static polygonLayerClazz: any;
    //@internal
    _markerLayer: any;
    //@internal
    _lineLayer: any;
    //@internal
    _polygonLayer: any;

    //@internal
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
    constructor(id: string, geometries?: OverlayLayerOptionsType | Array<Geometry>,  options?: DrawToolLayerOptionsType) {
        super(id, geometries, options);
        const depthFunc = this.options.depthFunc || 'always';
        options.sceneConfig = { depthFunc };
        this._markerLayer = new DrawToolLayer.markerLayerClazz(id + '_marker', options);
        this._lineLayer = new DrawToolLayer.lineLayerClazz(id + '_line', options);
        this._polygonLayer = new DrawToolLayer.polygonLayerClazz(id + '_polygon', options);
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
        for (let i = 0; i < geometries.length; i++) {
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
            if (geometries[i] instanceof Marker || geometries[i] instanceof MultiPoint) {
                this._markerLayer.removeGeometry(geometries[i]);
            } else if (geometries[i] instanceof LineString || geometries[i] instanceof MultiLineString) {
                this._lineLayer.removeGeometry(geometries[i]);
            } else if (geometries[i] instanceof Polygon || geometries[i] instanceof MultiPolygon) {
                this._polygonLayer.removeGeometry(geometries[i]);
            }
        }
    }

    onRemove(): void {
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
        return super.onAdd();
    }
}

DrawToolLayer.mergeOptions(options);

type DrawToolLayerOptionsType = OverlayLayerOptionsType & {
    depthFunc?: string
    sceneConfig?: any
}
