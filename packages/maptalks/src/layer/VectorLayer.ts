import Browser from '../core/Browser';
import { isNil, isNumber } from '../core/util';
import Extent from '../geo/Extent';
import Geometry from '../geometry/Geometry';
import OverlayLayer, { OverlayLayerOptionsType } from './OverlayLayer';
import { LayerIdentifyOptionsType } from './Layer';
import Painter from '../renderer/geometry/Painter';
import CollectionPainter from '../renderer/geometry/CollectionPainter';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import { LineString, Curve, Marker } from '../geometry';
import PointExtent from '../geo/PointExtent';
import { VectorLayerCanvasRenderer } from '../renderer';
import { LayerJSONType } from './Layer';
import DrawToolLayer from './DrawToolLayer';

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
    'enableAltitude': true,
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
    isVectorLayer: boolean = true;
    /**
     * @param id                    - layer's id
     * @param geometries=null       - geometries to add
     * @param options=null          - construct options
     * @param options.style=null    - vectorlayer's style
     * @param options.*=null        - options defined in [VectorLayer]{@link VectorLayer#options}
     */
    constructor(id: string, geometries?: VectorLayerOptionsType | Array<Geometry>, options?: VectorLayerOptionsType) {
        super(id, geometries, options);
    }

    onAdd() {
        super.onAdd();
    }

    onRemove() {
        super.onRemove();
    }

    onConfig(conf: Record<string, any>) {
        super.onConfig(conf);
        if (!isNil(conf['enableAltitude'])) {
            const geos = this.getGeometries() || [];
            for (let i = 0, len = geos.length; i < len; i++) {
                const geo = geos[i];
                if (geo) {
                    geo._clearAltitudeCache();
                    geo.fire('positionchange');
                }
            }
        }
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

    //@internal
    _hitGeos(geometries: Array<Geometry>, cp: Point, options: LayerIdentifyOptionsType = {}) {
        if (!geometries || !geometries.length) {
            return [];
        }
        const filterGeos = [];
        let idx = 0;
        for (let i = 0, len = geometries.length; i < len; i++) {
            const geo = geometries[i];
            // Ignore collided Points
            if (geo.isPoint && (geo as Marker)._collided === true) {
                continue;
            }
            filterGeos[idx] = geo;
            idx++;
        }
        geometries = filterGeos;

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

    // ==================== Spider Marker Methods ====================
    // 蛛网标记：解决多个 POI 坐标相同时的重叠问题。
    // 相同坐标的多个点位只显示一个堆叠标记，点击后螺旋散开显示全部点位。
    // 使用方式：addSpiderMarker() 添加标记，点击堆叠标记展开，点击空白处折叠。

    //@internal
    _spiderCoordGroups: Map<string, any[]> = new Map();        // 按坐标分组的点位数据
    //@internal
    _spiderStackMarkers: Map<string, { marker: Marker }> = new Map();  // 堆叠标记引用
    //@internal
    _spiderExpandedMarkers: Marker[] = [];   // 当前展开的标记
    //@internal
    _spiderExpandedLines: LineString[] = [];  // 当前展开的连接线
    //@internal
    _spiderActiveCoord: string | null = null;  // 当前展开的坐标

    /**
     * 批量设置蛛网标记数据
     * @english
     * Set marker data for spider display. Markers with same coordinates will be stacked.
     *
     * @param data - Array of marker data
     * @param options - Spider options
     * @param options.spiderRadius - Expansion radius in pixels
     * @param options.spiderLineColor - Line color between stacked markers
     * @param options.defaultMarkerSymbol - Default symbol for markers
     * @param options.stackSymbol - Symbol for stack indicator
     * @param options.onSpiderMarkerClick - Callback when clicking an expanded marker
     */
    setSpiderData(data: any[], options?: SpiderOptions): this {
        options = options || {};
        const spiderRadius = options['spiderRadius'] || 60;
        const spiderLineColor = options['spiderLineColor'] || '#DE3333';
        const defaultMarkerSymbol = options['markerSymbol'] || null;
        const onSpiderMarkerClick = options['onSpiderMarkerClick'];

        // Store options for later use
        (this as any)._spiderOptions = { spiderRadius, spiderLineColor, defaultMarkerSymbol, onSpiderMarkerClick };

        // Clear existing spider markers
        this._clearSpider();

        // Group by coordinate
        this._spiderCoordGroups.clear();
        data.forEach(item => {
            const key = this._coordKey(item.coord);
            if (!this._spiderCoordGroups.has(key)) {
                this._spiderCoordGroups.set(key, []);
            }
            const group = this._spiderCoordGroups.get(key);
            if (group) {
                group.push(item);
            }
        });

        // Render - 只显示一个 marker，不显示数量
        this._spiderCoordGroups.forEach((group, key) => {
            const coord = group[0].coord;
            // 使用第一个 item 的 symbol 或默认样式，堆叠时用 stackSymbol
            const itemSymbol = group[0].symbol || defaultMarkerSymbol || {
                markerType: 'ellipse',
                markerWidth: 30,
                markerHeight: 30,
                markerFill: '#4CAF50'
            };
            const marker = new Marker(coord, {
                id: group[0].id,
                symbol: itemSymbol as any
            });

            if (group.length > 1) {
                // 有多个点位重叠，使用 stackSymbol
                const stackSymbol = (this as any)._spiderOptions?.stackSymbol || itemSymbol;
                marker.setSymbol(stackSymbol as any);
                (marker as any)._isSpiderStack = true;
                (marker as any)._spiderGroup = group;
                (marker as any)._spiderKey = key;
                (marker as any)._spiderCoord = coord;
                this._spiderStackMarkers.set(key, { marker });
            } else {
                // 只有一个点位
                (marker as any)._spiderItem = group[0];
            }

            this.addGeometry(marker);
        });

        return this;
    }

    /**
     * 添加单个蛛网标记
     * @english
     * Add a single marker. If multiple markers share the same coordinate, they will be
     * automatically stacked and expandable.
     *
     * @param coord - Coordinate array [lng, lat] or properties object
     * @param properties - Marker properties { id, name, symbol, ... } (if first param is coord)
     * @param options - Spider options (only effective on first marker at a coordinate)
     *
     * @example
     * // 方式1：坐标在前，属性在后（推荐）
     * vectorLayer.addSpiderMarker([121.507, 31.247], {
     *   id: 1,
     *   name: 'Coffee Shop',
     *   symbol: { markerFile: './marker.png', markerWidth: 32, markerHeight: 32 }
     * });
     *
     * // 方式2：直接传对象（兼容旧版）
     * vectorLayer.addSpiderMarker({
     *   id: 2,
     *   coord: [121.508, 31.248],
     *   name: 'Tea House'
     * });
     */
    addSpiderMarker(coord: number[] | any, properties?: any, options?: SpiderOptions): this {
        // 判断是旧版格式 { coord, ... } 还是新版格式 [lng, lat], { ... }
        let item: any;
        let opts = options;

        if (Array.isArray(coord)) {
            // 新版格式：坐标在前
            item = properties || {};
            item.coord = coord;
        } else {
            // 旧版格式：直接是对象
            item = coord;
            opts = properties;
        }

        // Merge spider options from first call
        if (opts) {
            const spiderOpts = (this as any)._spiderOptions || {};
            if (!spiderOpts.spiderRadius) {
                spiderOpts.spiderRadius = opts['spiderRadius'] || 60;
                spiderOpts.spiderLineColor = opts['spiderLineColor'] || '#DE3333';
                spiderOpts.defaultMarkerSymbol = opts['markerSymbol'] || null;
                spiderOpts.stackSymbol = opts['stackSymbol'] || null;
                spiderOpts.onSpiderMarkerClick = opts['onSpiderMarkerClick'];
                (this as any)._spiderOptions = spiderOpts;
            }
        }

        const key = this._coordKey(item.coord);
        const existingGroup = this._spiderCoordGroups.get(key);

        if (!existingGroup) {
            // First marker at this coordinate
            this._spiderCoordGroups.set(key, [item]);

            // Create the marker
            const spiderOpts = (this as any)._spiderOptions || {};
            const itemSymbol = item.symbol || spiderOpts.defaultMarkerSymbol || {
                markerType: 'ellipse',
                markerWidth: 30,
                markerHeight: 30,
                markerFill: '#4CAF50'
            };
            const marker = new Marker(item.coord, {
                id: item.id,
                symbol: itemSymbol as any
            });
            (marker as any)._spiderItem = item;
            this.addGeometry(marker);
            this._spiderStackMarkers.set(key, { marker });

        } else {
            // Already has marker(s) at this coordinate
            existingGroup.push(item);

            // Check if we need to convert to stack
            if (existingGroup.length === 2) {
                // Was a single marker, now need stack
                const stack = this._spiderStackMarkers.get(key);
                if (stack) {
                    const group = existingGroup;
                    const coord = group[0].coord;

                    // Use stackSymbol if provided
                    const spiderOpts = (this as any)._spiderOptions || {};
                    const stackSymbol = (opts && opts['stackSymbol']) || spiderOpts.stackSymbol || group[0].symbol || {
                        markerType: 'ellipse',
                        markerWidth: 36,
                        markerHeight: 36,
                        markerFill: '#FF5722',
                        markerLineColor: '#fff',
                        markerLineWidth: 2
                    };

                    // Update marker to be a stack
                    stack.marker.setSymbol(stackSymbol as any);
                    (stack.marker as any)._isSpiderStack = true;
                    (stack.marker as any)._spiderGroup = group;
                    (stack.marker as any)._spiderKey = key;
                    (stack.marker as any)._spiderCoord = coord;
                    delete (stack.marker as any)._spiderItem;
                }
            } else {
                // Already a stack, just update the group reference
                const stack = this._spiderStackMarkers.get(key);
                if (stack) {
                    (stack.marker as any)._spiderGroup = existingGroup;
                }
            }
        }

        return this;
    }

    /**
     * 处理堆叠标记点击，展开或折叠
     * @param coordinate - 被点击的坐标
     * @returns 是否处理了点击事件
     */
    handleSpiderClick(coordinate: number[]): boolean {
        const coordKey = this._coordKey(coordinate);
        const group = this._spiderCoordGroups.get(coordKey);
        if (!group || group.length <= 1) {
            return false;
        }

        const opts = (this as any)._spiderOptions || {};
        const { spiderRadius, spiderLineColor, defaultMarkerSymbol } = opts;

        const isExpanded = this._spiderActiveCoord === coordKey;
        if (isExpanded) {
            // Collapse
            this._collapseSpider();
            return true;
        }

        // Collapse any other first
        this._collapseSpider();

        // Expand this one
        const positions = this._getSpiderPositions(coordinate, group.length, spiderRadius || 60);

        // Create lines
        group.forEach((item, i) => {
            const line = new LineString([coordinate, positions[i]], {
                symbol: {
                    lineColor: spiderLineColor || '#DE3333',
                    lineWidth: 2,
                    lineOpacity: 0.6
                } as any
            });
            this._spiderExpandedLines.push(line);
            this.addGeometry(line);
        });

        // Create expanded markers - 使用每个 item 自己的 symbol
        group.forEach((item, i) => {
            const itemSymbol = item.symbol || defaultMarkerSymbol || {
                markerType: 'ellipse',
                markerWidth: 30,
                markerHeight: 30,
                markerFill: '#4CAF50',
                markerLineColor: '#fff',
                markerLineWidth: 2
            };
            const marker = new Marker(positions[i], {
                id: 'spider_' + item.id,
                symbol: itemSymbol as any
            });
            (marker as any)._spiderItem = item;
            (marker as any)._spiderParentKey = coordKey;

            this._spiderExpandedMarkers.push(marker);
            this.addGeometry(marker);
        });

        // Hide stack
        const stack = this._spiderStackMarkers.get(coordKey);
        if (stack) {
            stack.marker.hide();
        }

        this._spiderActiveCoord = coordKey;

        return true;
    }

    /**
     * 处理展开后标记的点击，显示详情
     * @param marker - 被点击的标记
     */
    handleExpandedMarkerClick(marker: Marker): void {
        const opts = (this as any)._spiderOptions || {};
        const { onSpiderMarkerClick } = opts;
        const item = (marker as any)._spiderItem;
        if (item && onSpiderMarkerClick) {
            onSpiderMarkerClick(item);
        }
    }

    /**
     * 折叠当前展开的蛛网
     */
    collapseSpider(): void {
        this._collapseSpider();
    }

    //@internal
    private _coordKey(coord: number[]): string {
        return `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
    }

    //@internal
    private _clearSpider(): void {
        this._collapseSpider();
        this._spiderStackMarkers.forEach((stack) => {
            this.removeGeometry(stack.marker);
        });
        this._spiderStackMarkers.clear();
        this._spiderCoordGroups.clear();
    }

    //@internal
    private _collapseSpider(): void {
        if (!this._spiderActiveCoord) return;

        this._spiderExpandedMarkers.forEach(m => {
            this.removeGeometry(m);
            m.remove();
        });
        this._spiderExpandedMarkers = [];

        this._spiderExpandedLines.forEach(l => {
            this.removeGeometry(l);
            l.remove();
        });
        this._spiderExpandedLines = [];

        const stack = this._spiderStackMarkers.get(this._spiderActiveCoord);
        if (stack) {
            stack.marker.show();
            (stack.marker as any)._spiderExpanded = false;
        }

        this._spiderActiveCoord = null;
    }

    //@internal
    // 计算螺旋散开位置，使用黄金角度（37.5°）实现均匀分布
    private _getSpiderPositions(center: number[], count: number, radius: number): number[][] {
        const positions: number[][] = [];

        if (count === 1) {
            return [center];
        }

        const map = this.getMap();
        if (!map) {
            return [center];
        }

        const centerCoord = new Coordinate(center[0], center[1]);
        const centerPoint = map.coordToContainerPoint(centerCoord);

        // 螺旋状散开
        const angleStep = 37.5; // 黄金角度，螺旋排列
        let r = radius * 0.5;

        for (let i = 0; i < count; i++) {
            const angle = (i * angleStep) * Math.PI / 180;
            r = radius * 0.3 + (i * radius * 0.15); // 逐渐增大半径
            const px = centerPoint.x + r * Math.cos(angle);
            const py = centerPoint.y + r * Math.sin(angle);
            const coord = map.containerPointToCoord(new Point(px, py));
            positions.push([coord.x, coord.y]);
        }

        return positions;
    }
}

interface SpiderOptions {
    spiderRadius?: number;
    spiderLineColor?: string;
    markerSymbol?: any;
    stackSymbol?: any;
    onSpiderMarkerClick?: (item: any) => void;
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

DrawToolLayer.setLayerClass(VectorLayer, VectorLayer, VectorLayer);
