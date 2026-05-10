import VectorLayer from './layer/VectorLayer';
import Coordinate from './geo/Coordinate';
import Point from './geo/Point';
import { LineString, Marker } from './geometry';

export interface SpiderMarkerItem {
    coord: number[];
    id?: string | number;
    symbol?: any;
    [key: string]: any;
}

export interface SpiderOptions {
    spiderRadius?: number;
    spiderLineColor?: string;
    markerSymbol?: any;
    stackSymbol?: any;
    onSpiderMarkerClick?: (item: SpiderMarkerItem) => void;
}

// 内部属性接口
interface SpiderMarker extends Marker {
    _spiderItem?: SpiderMarkerItem;
    _spiderParentKey?: string;
    _isSpiderExpanded?: boolean;
    _targetPosition?: number[];
    _targetSymbol?: any;
    _isSpiderStack?: boolean;
    _spiderGroup?: SpiderMarkerItem[];
    _spiderKey?: string;
    _spiderCoord?: number[];
}

// 正在进行的动画信息
interface AnimationState {
    activeKey: string;
    stackMarker: SpiderMarker | undefined;
    markersToRemove: SpiderMarker[];
    linesToRemove: LineString[];
}

export class SpiderManager {
    // 常量
    private static readonly DEFAULT_SPIDER_RADIUS = 60;
    private static readonly DEFAULT_LINE_COLOR = '#DE3333';
    private static readonly GOLDEN_ANGLE = 37.5;
    private static readonly EXPAND_DURATION = 400;
    private static readonly COLLAPSE_DURATION = 250;
    private static readonly ANIMATION_DELAY_STEP = 30;

    private layer: VectorLayer;
    private coordGroups: Map<string, SpiderMarkerItem[]> = new Map();
    private stackMarkers: Map<string, SpiderMarker> = new Map();
    private expandedMarkers: SpiderMarker[] = [];
    private expandedLines: LineString[] = [];
    private activeCoord: string | null = null;
    private options: SpiderOptions = {};
    private idIndex: Map<string | number, { coordKey: string; itemIndex: number }> = new Map();
    private _isAnimating = false;
    private _animationState: AnimationState | null = null;

    constructor(layer: VectorLayer, options?: SpiderOptions) {
        this.layer = layer;
        if (options) {
            this.options = {
                spiderRadius: options.spiderRadius ?? SpiderManager.DEFAULT_SPIDER_RADIUS,
                spiderLineColor: options.spiderLineColor ?? SpiderManager.DEFAULT_LINE_COLOR,
                markerSymbol: options.markerSymbol ?? null,
                stackSymbol: options.stackSymbol ?? null,
                onSpiderMarkerClick: options.onSpiderMarkerClick ?? null
            };
        }
    }

    /**
     * 添加单个标记到蛛网
     * @param coord - 坐标 [lng, lat]
     * @param properties - 标记属性 { id, symbol, ... }
     */
    addMarker(coord: number[], properties?: any): this {
        const item: SpiderMarkerItem = properties || {};
        item.coord = coord;

        const key = this._coordKey(coord);
        const existingGroup = this.coordGroups.get(key);

        if (!existingGroup) {
            this.coordGroups.set(key, [item]);
            this._createStackMarker(key, item);
            if (item.id != null) {
                this.idIndex.set(item.id, { coordKey: key, itemIndex: 0 });
            }
        } else {
            const itemIndex = existingGroup.length;
            existingGroup.push(item);
            if (item.id != null) {
                this.idIndex.set(item.id, { coordKey: key, itemIndex });
            }
            if (existingGroup.length === 2) {
                this._convertToStack(key, existingGroup);
            } else {
                const marker = this.stackMarkers.get(key);
                if (marker) {
                    marker._spiderGroup = existingGroup;
                }
            }
        }

        return this;
    }

    /**
     * 批量设置标记数据
     * @param data - 标记数据数组
     */
    setData(data: SpiderMarkerItem[]): this {
        this.clear();

        const groups = new Map<string, SpiderMarkerItem[]>();
        for (const item of data) {
            const key = this._coordKey(item.coord);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            const group = groups.get(key);
            if (group) {
                group.push(item);
                if (item.id != null) {
                    this.idIndex.set(item.id, { coordKey: key, itemIndex: group.length - 1 });
                }
            }
        }

        for (const [key, group] of groups) {
            this.coordGroups.set(key, group);
            this._createStackMarker(key, group[0], group.length > 1 ? group : undefined);
        }

        return this;
    }

    /**
     * 展开指定坐标的蛛网
     * @param coord - 要展开的坐标 [lng, lat]
     */
    spiderfy(coord: number[], options?: { animation?: boolean }): void {
        if (this._isAnimating) return;

        const key = this._coordKey(coord);
        const group = this.coordGroups.get(key);

        if (!group || group.length <= 1) {
            return;
        }

        // 如果点击的是当前已展开的坐标，直接返回
        if (this.activeCoord === key) {
            return;
        }

        // 先设置 activeCoord，防止 unspiderfy 时状态错误
        const prevActiveCoord = this.activeCoord;
        this.activeCoord = key;

        // 如果有前一个展开的坐标，先清理其展开标记
        if (prevActiveCoord && prevActiveCoord !== key) {
            const prevMarkers = this.expandedMarkers.filter(m => m._spiderParentKey === prevActiveCoord);
            const prevLines = this.expandedLines.filter(l => {
                const coords = (l as any).getCoordinates();
                const startCoord = Array.isArray(coords) ? coords[0] : coords;
                return this._coordKey([startCoord.x, startCoord.y]) === prevActiveCoord;
            });
            for (const m of prevMarkers) {
                this.layer.removeGeometry(m);
                m.remove();
            }
            for (const l of prevLines) {
                this.layer.removeGeometry(l);
                l.remove();
            }
            this.expandedMarkers = this.expandedMarkers.filter(m => m._spiderParentKey !== prevActiveCoord);
            this.expandedLines = this.expandedLines.filter(l => {
                const coords = (l as any).getCoordinates();
                const startCoord = Array.isArray(coords) ? coords[0] : coords;
                return this._coordKey([startCoord.x, startCoord.y]) !== prevActiveCoord;
            });
            const prevStackMarker = this.stackMarkers.get(prevActiveCoord);
            if (prevStackMarker) {
                prevStackMarker.show();
            }
        }

        const { spiderRadius, spiderLineColor } = this.options;
        const positions = this._getSpiderPositions(coord, group.length, spiderRadius ?? SpiderManager.DEFAULT_SPIDER_RADIUS);
        const enableAnimation = options?.animation !== false;

        // 创建连接线
        for (let i = 0; i < group.length; i++) {
            const line = new LineString([coord, positions[i]], {
                symbol: {
                    lineColor: spiderLineColor ?? SpiderManager.DEFAULT_LINE_COLOR,
                    lineWidth: 2,
                    lineOpacity: 0
                } as any
            });
            this.expandedLines.push(line);
            this.layer.addGeometry(line);
            if (enableAnimation) {
                line.animate({
                    symbol: { lineOpacity: 0.6 }
                }, {
                    duration: 300,
                    easing: 'out'
                });
            } else {
                line.setSymbol({ lineOpacity: 0.6 } as any);
            }
        }

        // 创建展开的标记
        const newMarkers: SpiderMarker[] = [];
        const defaultSymbol = this.options.markerSymbol || this._getDefaultSymbol();

        for (let i = 0; i < group.length; i++) {
            const item = group[i];
            const itemSymbol = item.symbol || defaultSymbol;
            const marker = new Marker(coord, {
                id: 'spider_' + item.id,
                symbol: {
                    ...itemSymbol as object,
                    markerOpacity: 0,
                    markerSize: 0
                } as any
            }) as SpiderMarker;
            marker._spiderItem = item;
            marker._spiderParentKey = key;
            marker._isSpiderExpanded = true;
            marker._targetPosition = positions[i];
            marker._targetSymbol = itemSymbol;

            newMarkers.push(marker);
            this.expandedMarkers.push(marker);
            this.layer.addGeometry(marker);
        }

        // 隐藏堆叠标记
        const stackMarker = this.stackMarkers.get(key);
        if (stackMarker) {
            stackMarker.hide();
        }

        if (enableAnimation) {
            this._isAnimating = true;
            this._animateExpand(newMarkers, positions);
        } else {
            for (let i = 0; i < newMarkers.length; i++) {
                const marker = newMarkers[i];
                marker.setCoordinates(positions[i]);
                marker.setSymbol({
                    ...marker._targetSymbol,
                    markerOpacity: 1,
                    markerSize: 1
                } as any);
            }
        }
    }

    private _animateExpand(markers: SpiderMarker[], positions: number[][]): void {
        const duration = SpiderManager.EXPAND_DURATION;
        const startTime = performance.now();
        const delayStep = SpiderManager.ANIMATION_DELAY_STEP;

        const animateFrame = () => {
            const elapsed = performance.now() - startTime;
            let allDone = true;

            for (let i = 0; i < markers.length; i++) {
                const marker = markers[i];
                const markerElapsed = Math.max(0, elapsed - i * delayStep);
                const t = Math.min(1, markerElapsed / duration);
                const ease = this._easeOutBack(t);

                const startCoord = marker.getCoordinates();
                const targetCoord = positions[i];
                marker.setCoordinates([
                    startCoord.x + (targetCoord[0] - startCoord.x) * ease,
                    startCoord.y + (targetCoord[1] - startCoord.y) * ease
                ]);

                const symbol = marker.getSymbol() || {};
                marker.setSymbol({
                    ...symbol,
                    markerOpacity: ease,
                    markerSize: ease
                } as any);

                if (t < 1) {
                    allDone = false;
                }
            }

            if (!allDone) {
                requestAnimationFrame(animateFrame);
            } else {
                this._isAnimating = false;
            }
        };

        requestAnimationFrame(animateFrame);
    }

    private _easeOutBack(t: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    /**
     * 折叠当前展开的蛛网
     */
    unspiderfy(options?: { animation?: boolean }): void {
        // 检查是否有展开的标记需要折叠
        const markersToRemove = this.expandedMarkers.filter(m => m._spiderParentKey === this.activeCoord);

        if (!this.activeCoord || markersToRemove.length === 0) {
            // 没有活动的展开，不需要折叠
            return;
        }

        const enableAnimation = options?.animation !== false;
        const activeKey = this.activeCoord;
        const stackMarker = this.stackMarkers.get(activeKey);

        const linesToRemove = this.expandedLines.filter(l => {
            const coords = (l as any).getCoordinates();
            const startCoord = Array.isArray(coords) ? coords[0] : coords;
            return this._coordKey([startCoord.x, startCoord.y]) === activeKey;
        });

        if (!enableAnimation) {
            // 立即清理
            this.expandedMarkers = this.expandedMarkers.filter(m => m._spiderParentKey !== activeKey);
            this.expandedLines = this.expandedLines.filter(l => {
                const coords = (l as any).getCoordinates();
                const startCoord = Array.isArray(coords) ? coords[0] : coords;
                return this._coordKey([startCoord.x, startCoord.y]) !== activeKey;
            });
            for (const m of markersToRemove) {
                this.layer.removeGeometry(m);
                m.remove();
            }
            for (const l of linesToRemove) {
                this.layer.removeGeometry(l);
                l.remove();
            }
            if (stackMarker) {
                stackMarker.show();
            }
            this.activeCoord = null;
            return;
        }

        // 折叠动画 - 保存状态，动画完成后清理
        this._animationState = {
            activeKey,
            stackMarker,
            markersToRemove,
            linesToRemove
        };

        const duration = SpiderManager.COLLAPSE_DURATION;
        const startTime = performance.now();

        const animateFrame = () => {
            // 检查是否是当前有效的动画
            if (this._animationState?.activeKey !== activeKey) {
                return;
            }

            const elapsed = performance.now() - startTime;
            const t = Math.min(1, elapsed / duration);
            const ease = this._easeInBack(t);

            for (const marker of markersToRemove) {
                const targetCoord = marker._spiderParentKey
                    ? this._coordKeyToCoord(marker._spiderParentKey)
                    : marker.getCoordinates();

                if (t < 1) {
                    const currentCoord = marker.getCoordinates();
                    marker.setCoordinates([
                        currentCoord.x + (targetCoord[0] - currentCoord.x) * ease,
                        currentCoord.y + (targetCoord[1] - currentCoord.y) * ease
                    ]);

                    const symbol = marker.getSymbol() || {};
                    marker.setSymbol({
                        ...symbol,
                        markerOpacity: 1 - ease,
                        markerSize: 1 - ease
                    } as any);
                }
            }

            for (const line of linesToRemove) {
                const symbol = line.getSymbol() || {};
                line.setSymbol({
                    ...symbol,
                    lineOpacity: 0.6 * (1 - ease)
                } as any);
            }

            if (t < 1) {
                requestAnimationFrame(animateFrame);
            } else {
                // 从数组中移除
                this.expandedMarkers = this.expandedMarkers.filter(m => m._spiderParentKey !== activeKey);
                this.expandedLines = this.expandedLines.filter(l => {
                    const coords = (l as any).getCoordinates();
                    const startCoord = Array.isArray(coords) ? coords[0] : coords;
                    return this._coordKey([startCoord.x, startCoord.y]) !== activeKey;
                });

                for (const m of markersToRemove) {
                    this.layer.removeGeometry(m);
                    m.remove();
                }
                for (const l of linesToRemove) {
                    this.layer.removeGeometry(l);
                    l.remove();
                }
                if (stackMarker) {
                    stackMarker.show();
                }
                this.activeCoord = null;
                this._isAnimating = false;
                this._animationState = null;
            }
        };

        this._isAnimating = true;
        requestAnimationFrame(animateFrame);
    }

    private _cleanupAllExpanded(): void {
        // 取消正在进行的动画
        this._animationState = null;

        for (const m of this.expandedMarkers) {
            this.layer.removeGeometry(m);
            m.remove();
        }
        for (const l of this.expandedLines) {
            this.layer.removeGeometry(l);
            l.remove();
        }
        this.expandedMarkers = [];
        this.expandedLines = [];
    }

    private _coordKeyToCoord(key: string): number[] {
        const parts = key.split(',');
        return [parseFloat(parts[0]), parseFloat(parts[1])];
    }

    private _easeInBack(t: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    }

    /**
     * 获取当前展开的坐标
     */
    getActiveCoord(): number[] | null {
        if (!this.activeCoord) return null;
        const parts = this.activeCoord.split(',');
        return [parseFloat(parts[0]), parseFloat(parts[1])];
    }

    /**
     * 获取组内标记数量
     */
    getGroupCount(coord: number[]): number {
        const key = this._coordKey(coord);
        return this.coordGroups.get(key)?.length || 0;
    }

    /**
     * 检查坐标是否有多个标记
     */
    isStacked(coord: number[]): boolean {
        return this.getGroupCount(coord) > 1;
    }

    /**
     * 是否已展开
     */
    isExpanded(coord?: number[]): boolean {
        if (coord) {
            return this._coordKey(coord) === this.activeCoord;
        }
        return this.activeCoord !== null;
    }

    /**
     * 清除所有蛛网标记
     */
    clear(): void {
        this.unspiderfy();

        this.stackMarkers.forEach(marker => {
            this.layer.removeGeometry(marker);
        });
        this.stackMarkers.clear();
        this.coordGroups.clear();
        this.idIndex.clear();
    }

    /**
     * 释放资源，清理所有监听器和引用
     */
    dispose(): void {
        this.clear();
        this.stackMarkers.forEach(marker => {
            this.layer.removeGeometry(marker);
        });
        this.stackMarkers.clear();
        this.coordGroups.clear();
        this.idIndex.clear();
        this.layer = null as any;
        this.options = {};
    }

    /**
     * 通过 ID 获取标记的 item 数据
     * @param id - 标记 ID
     */
    getMarkerById(id: string | number): SpiderMarkerItem | null {
        const idx = this.idIndex.get(id);
        if (!idx) return null;
        const group = this.coordGroups.get(idx.coordKey);
        if (!group) return null;
        return group[idx.itemIndex] || null;
    }

    /**
     * 通过 ID 获取标记的 Geometry
     * @param id - 标记 ID
     */
    getGeometryById(id: string | number): SpiderMarker | null {
        const idx = this.idIndex.get(id);
        if (!idx) return null;

        if (this.activeCoord !== idx.coordKey) {
            return this.stackMarkers.get(idx.coordKey) || null;
        }
        return this.expandedMarkers.find(m => m._spiderItem?.id === id) || null;
    }

    /**
     * 通过 ID 移除标记
     * @param id - 标记 ID
     */
    removeMarker(id: string | number): boolean {
        const idx = this.idIndex.get(id);
        if (!idx) return false;

        const { coordKey, itemIndex } = idx;
        const group = this.coordGroups.get(coordKey);
        if (!group) return false;

        if (group.length <= 1) {
            this._removeCoordGroup(coordKey);
            return true;
        }

        group.splice(itemIndex, 1);
        for (let i = itemIndex; i < group.length; i++) {
            const item = group[i];
            if (item.id != null) {
                this.idIndex.set(item.id, { coordKey, itemIndex: i });
            }
        }
        this.idIndex.delete(id);

        if (this.activeCoord === coordKey) {
            this.unspiderfy();
            if (group.length > 1) {
                this.spiderfy(group[0].coord);
            }
        } else if (group.length === 1) {
            const marker = this.stackMarkers.get(coordKey);
            if (marker) {
                const sym = group[0].symbol || this.options.markerSymbol || this._getDefaultSymbol(false);
                marker.setSymbol(sym as any);
                marker._isSpiderStack = false;
                marker._spiderGroup = undefined;
                marker._spiderItem = group[0];
            }
        } else {
            const marker = this.stackMarkers.get(coordKey);
            if (marker) {
                marker._spiderGroup = group;
            }
        }

        return true;
    }

    private _removeCoordGroup(coordKey: string): void {
        // 折叠该组
        if (this.activeCoord === coordKey) {
            this.unspiderfy();
        }
        // 移除标记
        const marker = this.stackMarkers.get(coordKey);
        if (marker) {
            this.layer.removeGeometry(marker);
            this.stackMarkers.delete(coordKey);
        }
        // 清除该组所有 id 索引
        const group = this.coordGroups.get(coordKey);
        if (group) {
            group.forEach(item => {
                if (item.id != null) {
                    this.idIndex.delete(item.id);
                }
            });
        }
        this.coordGroups.delete(coordKey);
    }

    /**
     * 更新选项
     */
    setOptions(options: SpiderOptions): this {
        this.options = {
            ...this.options,
            ...options
        };
        return this;
    }

    /**
     * 获取选项
     */
    getOptions(): SpiderOptions {
        return { ...this.options };
    }

    // ==================== 私有方法 ====================

    private _coordKey(coord: number[]): string {
        return `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
    }

    private _createStackMarker(key: string, item: SpiderMarkerItem, group?: SpiderMarkerItem[]): void {
        const isStacked = group && group.length > 1;
        const { stackSymbol, markerSymbol } = this.options;

        let symbol: any;
        if (isStacked && stackSymbol) {
            symbol = stackSymbol;
        } else if (item.symbol) {
            symbol = item.symbol;
        } else if (markerSymbol) {
            symbol = markerSymbol;
        } else {
            symbol = this._getDefaultSymbol(isStacked);
        }

        const marker = new Marker(item.coord, {
            id: String(item.id),
            symbol
        }) as SpiderMarker;

        if (isStacked) {
            marker._isSpiderStack = true;
            marker._spiderGroup = group;
            marker._spiderKey = key;
            marker._spiderCoord = item.coord;
        } else {
            marker._spiderItem = item;
        }

        this.stackMarkers.set(key, marker);
        this.layer.addGeometry(marker);
    }

    private _convertToStack(key: string, group: SpiderMarkerItem[]): void {
        const marker = this.stackMarkers.get(key);
        if (!marker) return;

        const { stackSymbol, markerSymbol } = this.options;
        const stackSym = stackSymbol || group[0].symbol || markerSymbol || this._getDefaultSymbol(true);

        marker.setSymbol(stackSym as any);
        marker._isSpiderStack = true;
        marker._spiderGroup = group;
        marker._spiderKey = key;
        marker._spiderCoord = group[0].coord;
        delete marker._spiderItem;
    }

    private _getSpiderPositions(center: number[], count: number, radius: number): number[][] {
        if (count === 1) return [center];

        const map = this.layer.getMap();
        if (!map) return [center];

        const centerCoord = new Coordinate(center[0], center[1]);
        const centerPoint = map.coordToContainerPoint(centerCoord);
        const angleStepRad = SpiderManager.GOLDEN_ANGLE * Math.PI / 180;

        const positions: number[][] = new Array(count);
        for (let i = 0; i < count; i++) {
            const r = radius * (0.3 + i * 0.15);
            const angle = i * angleStepRad;
            const px = centerPoint.x + r * Math.cos(angle);
            const py = centerPoint.y + r * Math.sin(angle);
            const coord = map.containerPointToCoord(new Point(px, py));
            positions[i] = [coord.x, coord.y];
        }

        return positions;
    }

    private _getDefaultSymbol(stacked = false): any {
        return {
            markerType: 'ellipse',
            markerWidth: stacked ? 36 : 30,
            markerHeight: stacked ? 36 : 30,
            markerFill: stacked ? '#FF5722' : '#4CAF50',
            markerLineColor: '#fff',
            markerLineWidth: 2
        };
    }
}

export default SpiderManager;