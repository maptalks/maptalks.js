import Browser from '../core/Browser';
import { isNil, isNumber } from '../core/util';
import Extent from '../geo/Extent';
import Geometry from '../geometry/Geometry';
import OverlayLayer, { LayerIdentifyOptionsType, OverlayLayerOptionsType } from './OverlayLayer';
import Painter from '../renderer/geometry/Painter';
import CollectionPainter from '../renderer/geometry/CollectionPainter';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import { LineString, Curve } from '../geometry';
import PointExtent from '../geo/PointExtent';
import { VectorLayerCanvasRenderer } from '../renderer';
import { LayerJSONType } from './Layer';

type VectorLayerToJSONOptions = {
    geometries: any,
    clipExtent: Extent
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore /src/geo/PointExtent.js -> Ts 支持不传参数
const TEMP_EXTENT = new PointExtent();
/**
 * 配置参数
 * 
 * @english
 * @property {Object}  options - VectorLayer's options
 * @property {Boolean} options.debug=false           - whether the geometries on the layer is in debug mode.
 * @property {Boolean} options.enableSimplify=true   - whether to simplify geometries before rendering.
 * @property {String}  options.cursor=default        - the cursor style of the layer
 * @property {Boolean} options.geometryEvents=true   - enable/disable firing geometry events, disable it to improve performance.
 * @property {Boolean} options.defaultIconSize=[20,20] - default size of a marker's icon
 * @property {Boolean} [options.enableAltitude=false]  - whether to enable render geometry with altitude, false by default
 * @property {Boolean} [options.altitudeProperty=altitude] - geometry's altitude property name, if enableAltitude is true, "altitude" by default
 * @property {Boolean} [options.drawAltitude=false]  - whether to draw altitude: a vertical line for marker, a vertical polygon for line
 * @property {Boolean} [options.sortByDistanceToCamera=false]  - markers Sort by camera distance
 * @property {Boolean} [options.roundPoint=false]  - round point before painting to improve performance, but will cause geometry shaking in animation
 * @property {Number} [options.altitude=0]           - layer altitude
 * @property {Boolean} [options.debug=false]         - whether the geometries on the layer is in debug mode.
 * @property {Boolean}  [options.collision=false]  - whether collision
 * @property {Number}  [options.collisionBufferSize=2]  - collision buffer size
 * @property {Number}  [options.collisionDelay=250]  - collision delay time when map Interacting
 * @property {String}  [options.collisionScope=layer]  - Collision range:layer or map
 * @property {Boolean}  [options.progressiveRender=false]  - progressive Render
 * @property {Number}  [options.progressiveRenderCount=1000]  - progressive Render page size
 * @property {Boolean}  [options.progressiveRenderDebug=false]  - progressive Render debug
 * @memberOf VectorLayer
 * @instance
 */
const options: VectorLayerOptionsType = {
    'debug': false,
    'enableSimplify': true,
    'defaultIconSize': [20, 20],
    'cacheVectorOnCanvas': true,
    'cacheSvgOnCanvas': Browser.gecko,
    'enableAltitude': false,
    'altitudeProperty': 'altitude',
    'drawAltitude': false,
    'sortByDistanceToCamera': false,
    'roundPoint': false,
    'altitude': 0,
    'clipBBoxBufferSize': 3,
    'collision': false,
    'collisionBufferSize': 2,
    'collisionDelay': 250,
    'collisionScope': 'layer',
    'progressiveRender': false,
    'progressiveRenderCount': 1000,
    'progressiveRenderDebug': false
};
// Polyline is for custom line geometry
// const TYPES = ['LineString', 'Polyline', 'Polygon', 'MultiLineString', 'MultiPolygon'];
/**
 * 用于管理、呈现 geometries 的 layer
 * 
 * @english
 * @classdesc
 * A layer for managing and rendering geometries.
 * @category layer
 * @extends OverlayLayer
 */
class VectorLayer extends OverlayLayer {

    options: VectorLayerOptionsType;
    /**
     * @param id                    - layer's id
     * @param geometries=null       - geometries to add
     * @param options=null          - construct options
     * @param options.style=null    - vectorlayer's style
     * @param options.*=null        - options defined in [VectorLayer]{@link VectorLayer#options}
     */
    constructor(id: string, geometries: VectorLayerOptionsType | Array<Geometry>, options?: VectorLayerOptionsType) {
        super(id, geometries, options);
    }

    onConfig(conf: Record<string, any>) {
        super.onConfig(conf);
        if (conf['enableAltitude'] || conf['drawAltitude'] || conf['altitudeProperty']) {
            const renderer = this.getRenderer();
            if (renderer && renderer.setToRedraw) {
                renderer.setToRedraw();
            }
        }
    }

    /**
     * 通过给定 coordinate 识别 geometries
     * 
     * @english
     * Identify the geometries on the given coordinate
     * @param  {maptalks.Coordinate} coordinate   - coordinate to identify
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.tolerance=0] - identify tolerance in pixel
     * @param  {Object} [options.count=null]  - result count
     * @return {Geometry[]} geometries identified
     */
    identify(coordinate: Coordinate, options?: LayerIdentifyOptionsType): Geometry[] {
        options = options || {};
        const renderer = this.getRenderer();
        if (!(coordinate instanceof Coordinate)) {
            coordinate = new Coordinate(coordinate);
        }
        const cp = this.getMap().coordToContainerPoint(coordinate);
        // only iterate drawn geometries when onlyVisible is true.
        if (options['onlyVisible'] && renderer && renderer.identifyAtPoint) {
            return renderer.identifyAtPoint(cp, options);
        }
        return this._hitGeos(this._geoList, cp, options);
    }

    /**
     * 通过给定 point 识别 geometries
     * 
     * @english
     * Identify the geometries on the given container point
     * @param  {maptalks.Point} point   - container point to identify
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.tolerance=0] - identify tolerance in pixel
     * @param  {Object} [options.count=null]  - result count
     * @return {Geometry[]} geometries identified
     */
    identifyAtPoint(point: Point, options?: LayerIdentifyOptionsType) {
        options = options || {};
        const renderer = this.getRenderer();
        if (!(point instanceof Point)) {
            point = new Point(point);
        }
        // only iterate drawn geometries when onlyVisible is true.
        if (options['onlyVisible'] && renderer && renderer.identifyAtPoint) {
            return renderer.identifyAtPoint(point, options);
        }
        return this._hitGeos(this._geoList, point, options);
    }

    _hitGeos(geometries: Array<Geometry>, cp: Point, options: LayerIdentifyOptionsType) {
        if (!geometries || !geometries.length) {
            return [];
        }
        const filter = options['filter'],
            hits: Geometry[] = [];
        const tolerance = options['tolerance'];
        const map = this.getMap();
        const renderer = this.getRenderer();
        const imageData = renderer && renderer.getImageData && renderer.getImageData();
        if (imageData) {
            let hitTolerance = 0;
            const maxTolerance = renderer.maxTolerance;
            //for performance
            if (isNumber(maxTolerance)) {
                hitTolerance = maxTolerance;
            } else {
                for (let i = geometries.length - 1; i >= 0; i--) {
                    const t = geometries[i]._hitTestTolerance() + (tolerance || 0);
                    if (t > hitTolerance) {
                        hitTolerance = t;
                    }
                }
            }

            const r = map.getDevicePixelRatio();
            (imageData as any).r = r;
            let hit = false;
            const cpx = cp.x - hitTolerance;
            const cpy = cp.y - hitTolerance;
            for (let i = -hitTolerance; i <= hitTolerance; i++) {
                for (let j = -hitTolerance; j <= hitTolerance; j++) {
                    const x = Math.round((cpx + i) * r),
                        y = Math.round((cpy + j) * r);
                    const idx = y * imageData.width * 4 + x * 4;
                    if (imageData.data[idx + 3] > 0) {
                        hit = true;
                        break;
                    }
                }
                if (hit) {
                    break;
                }
            }

            //空白的直接返回，避免下面的逻辑,假设有50%的概率不命中(要么命中,要么不命中)，可以节省大量的时间
            if (!hit) {
                return hits;
            }
        }
        const onlyVisible = options.onlyVisible;
        for (let i = geometries.length - 1; i >= 0; i--) {
            const geo = geometries[i];
            if (!geo || !geo.options['interactive']) {
                continue;
            }
            //当onlyVisible===false时才需要判断isVisible,因为渲染时已经判断过isVisible的值了
            if (!onlyVisible && (!geo.isVisible())) {
                continue;
            }
            const painter = geo._getPainter();
            if (!painter) {
                continue;
            }
            const bbox = painter.getRenderBBOX && painter.getRenderBBOX();
            if (bbox) {
                const { x, y } = cp;
                if (x < bbox[0] || y < bbox[1] || x > bbox[2] || y > bbox[3]) {
                    continue;
                }
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore /src/geometry/LineString.js -> ts LineString 无 _getArrowStyle 属性
            if (!(geo instanceof LineString) || (!geo._getArrowStyle() && !(geo instanceof Curve))) {
                // Except for LineString with arrows or curves
                let extent = geo.getContainerExtent(TEMP_EXTENT);
                if (tolerance) {
                    extent = extent._expand(tolerance);
                }
                if (!extent || !extent.contains(cp)) {
                    continue;
                }
            }
            if (geo._containsPoint(cp, tolerance) && (!filter || filter(geo))) {
                hits.push(geo);
                if (options['count']) {
                    if (hits.length >= options['count']) {
                        break;
                    }
                }
            }
        }
        return hits;
    }

    getAltitude() {
        return this.options['altitude'] || 0;
    }

    /**
     * 输出 VectorLayer 的 json
     * 
     * @english
     * Export the VectorLayer's JSON. <br>
     * @param  {Object} [options=null] - export options
     * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link OverlayLayer},
     *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
     * @param  {Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
     * @return layer's JSON
     */

    toJSON(options?: VectorLayerToJSONOptions): LayerJSONType {
        if (!options) {
            options = {
                'clipExtent': null,
                'geometries': null
            };
        }
        const profile = {
            'type': this.getJSONType(),
            'id': this.getId(),
            'options': this.config()
        };
        if (isNil(options['geometries']) || options['geometries']) {
            let clipExtent;
            if (options['clipExtent']) {
                const map = this.getMap();
                const projection = map ? map.getProjection() : null;
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore 需/src/geo/Extent.js -> ts 并支持只传两个个参数
                clipExtent = new Extent(options['clipExtent'], projection);
            }
            const geoJSONs = [];
            const geometries = this.getGeometries();
            for (let i = 0, len = geometries.length; i < len; i++) {
                const geo = geometries[i];
                const geoExt = geo.getExtent();
                if (!geoExt || (clipExtent && !clipExtent.intersects(geoExt))) {
                    continue;
                }
                const json = geo.toJSON(options['geometries']);
                geoJSONs.push(json);
            }
            profile['geometries'] = geoJSONs;
        }
        return profile;
    }

    getRenderer(): VectorLayerCanvasRenderer {
        return super.getRenderer() as VectorLayerCanvasRenderer;
    }

    /**
     * 通过 json 生成 VectorLayer
     * 
     * @english
     * Reproduce a VectorLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {VectorLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(json: Record<string, any>): VectorLayer {
        if (!json || json['type'] !== 'VectorLayer') {
            return null;
        }
        const layer = new VectorLayer(json['id'], json['options']);
        const geoJSONs = json['geometries'];
        const geometries = [];
        for (let i = 0; i < geoJSONs.length; i++) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore 未找到fromJSON属性
            const geo = Geometry.fromJSON(geoJSONs[i]);
            if (geo) {
                geometries.push(geo);
            }
        }
        layer.addGeometry(geometries);
        return layer;
    }

    static getPainterClass() {
        return Painter;
    }

    static getCollectionPainterClass() {
        return CollectionPainter;
    }
}

VectorLayer.mergeOptions(options);

VectorLayer.registerJSONType('VectorLayer');

export default VectorLayer;

export type VectorLayerOptionsType = OverlayLayerOptionsType & {
    debug?: boolean,
    enableSimplify?: boolean,
    cursor?: string,
    geometryEvents?: boolean
    defaultIconSize?: [number, number],
    cacheVectorOnCanvas?: boolean,
    cacheSvgOnCanvas?: boolean,
    enableAltitude?: boolean,
    altitudeProperty?: string,
    drawAltitude?: boolean,
    sortByDistanceToCamera?: boolean,
    roundPoint?: boolean,
    altitude?: number,
    clipBBoxBufferSize?: number,
    collision?: boolean,
    collisionBufferSize?: number,
    collisionDelay?: number,
    collisionScope?: 'layer' | 'map',
    progressiveRender?: boolean,
    progressiveRenderCount?: number,
    progressiveRenderDebug?: boolean
};