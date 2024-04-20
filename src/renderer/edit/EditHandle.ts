import Eventable from '../../core/Eventable';
import Class from '../../core/Class';
import Point, { type PointJson } from '../../geo/Point';
import { ResourceCache } from '../layer/CanvasRenderer';
import { drawVectorMarker } from '../../core/util/draw';
import { isNil } from '../../core/util/';
import { getSymbolHash } from '../../core/util';
import { getEventContainerPoint } from '../../core/util/dom';
import DragHandler from '../../handler/Drag';
import { BBOX, bufferBBOX, getDefaultBBOX } from '../../core/util/bbox';
import type Map from '../../map/Map';
import type GeometryEditor from '../../geometry/editor/GeometryEditor';

const resources = new ResourceCache();
let prevX, prevY;

type EventParams = any;

export interface EditHandleOptions {
    symbol: Record<string, any>;
    events: string[];
    cursor: string;
    zIndex?: number;
}

export default class EditHandle extends Eventable<any>(Class) {
    target: GeometryEditor;
    map: Map;
    w: number;
    h: number;
    opacity: number;
    events: string[];

    url: string;
    bbox: BBOX;
    _point: Point;
    _img: any;
    _dragger: DragHandler;

    constructor(target: GeometryEditor, map: Map, options: EditHandleOptions) {
        super(options);
        this.target = target;
        target.once('remove', this.delete, this);
        const symbol = this.options['symbol'];
        const lineWidth = symbol['markerLineWidth'] || 1;
        this.w = symbol['markerWidth'] + lineWidth;
        this.h = symbol['markerHeight'] + lineWidth;
        this.opacity = isNil(symbol['opacity']) ? 1 : symbol['opacity'];
        this.map = map;
        this.events = options.events;
        this._fetchImage();
        this.addTo(map);
    }

    getCursor() {
        return this.options['cursor'] || 'default';
    }

    _fetchImage() {
        const map = this.map;
        const symbol = this.options.symbol;
        const { markerFile } = symbol;
        this.url = markerFile || getSymbolHash(symbol);
        let img = resources.getImage(this.url);
        if (!img) {
            const w = this.w;
            const h = this.h;
            if (markerFile) {
                img = new Image();
                img.onload = () => {
                    const renderer = map.getRenderer();
                    if (renderer) {
                        renderer.setToRedraw();
                    }
                };
                img.src = this.url;
            } else {
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                // vector marker
                // 不同的vector，point不同
                img = drawVectorMarker(ctx, { x: w / 2, y: h / 2 }, symbol, resources);
            }
            resources.addResource([this.url, w, h], img);
        }
        resources.login(this.url);
        this._img = img;
    }

    setContainerPoint(cp: Point) {
        this._point = cp;
        this._point._sub(this.w / 2, this.h / 2);
    }

    getContainerPoint() {
        return this._point.add(this.w / 2, this.h / 2);
    }

    offset(p: Point | PointJson) {
        // dragging
        this._point._add(p);
    }

    render(ctx) {
        if (!this._img) {
            return false;
        }
        const symbol = this.options['symbol'];
        const dx = symbol['markerDx'] || 0;
        const dy = symbol['markerDy'] || 0;
        const map = this.map;
        const { x, y } = this._point;
        const w = this.w;
        const h = this.h;
        if (x + w > 0 && x < map.width && y + h > 0 && y < map.height) {
            const dpr = map.getDevicePixelRatio();
            ctx.globalAlpha = this.opacity;
            ctx.drawImage(this._img, Math.round((x + dx) * dpr), Math.round((y + dy) * dpr), Math.round(w * dpr), Math.round(h * dpr));
            return true;
        }
        return false;
    }

    delete() {
        if (this.map) {
            const renderer = this.map.getRenderer();
            if (renderer) {
                renderer.removeTopElement(this);
            }
        }
        resources.logout(this.url);
        if (this._dragger) {
            this._dragger.disable();
            delete this._dragger;
        }
        delete this.map;
    }

    hitTest(p: Point | PointJson): boolean {
        const symbol = this.options['symbol'];
        const dx = symbol['markerDx'] || 0;
        const dy = symbol['markerDy'] || 0;
        const w = this.w;
        const h = this.h;
        const x = this._point.x + dx;
        const y = this._point.y + dy;
        return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
    }

    addTo(map: Map) {
        this.map = map;
        const renderer = map.getRenderer();
        renderer.addTopElement(this);
    }

    onEvent(e: EventParams) {
        this.fire(e.type, e);
    }

    mousedown(e: EventParams) {
        const map = e.target;
        const cursor = this.options['cursor'];
        if (cursor) {
            map.setCursor(cursor);
        }
        this.onDragstart(e);
    }

    onDragstart(e: EventParams) {
        const { containerPoint, target: map } = e;
        const dom = map.getPanels().mapWrapper || map.getContainer();

        const dragHandler = this._dragger = new DragHandler(dom);
        dragHandler.on('dragging', this.onDragging, this)
            .on('mouseup', this.onDragend, this)
            .enable();

        dragHandler.onMouseDown(e['domEvent']);
        prevX = containerPoint.x;
        prevY = containerPoint.y;
        this.fire('dragstart', {
            containerPoint
        });
    }

    onDragging(e: EventParams) {
        if (!this._dragger) {
            return;
        }
        const activeMap = this.map;
        const containerPoint = getEventContainerPoint(e.domEvent, activeMap.getContainer());
        const offset = {
            x: containerPoint.x - prevX,
            y: containerPoint.y - prevY,
        };
        const prevCoord = activeMap.containerPointToCoord(new Point(prevX, prevY));
        const currentCoord = activeMap.containerPointToCoord(containerPoint);
        prevX = containerPoint.x;
        prevY = containerPoint.y;
        this.offset(offset);
        this.fire('dragging', {
            containerPoint,
            coordOffset: currentCoord._sub(prevCoord)
        });
    }

    onDragend(e: EventParams) {
        if (!this._dragger) {
            return;
        }
        const map = this.map;
        map.resetCursor();
        const containerPoint = getEventContainerPoint(e.domEvent, map.getContainer());
        const offset = {
            x: containerPoint.x - prevX,
            y: containerPoint.y - prevY,
        };
        this.offset(offset);
        this._dragger.disable();
        delete this._dragger;
        this.fire('dragend', {
            containerPoint
        });
    }

    needCollision(): boolean {
        const { target } = this;
        return target && target.options && target.options.collision;
    }

    getRenderBBOX(dpr?: number) {
        const { target, map } = this;
        if (!target || !target.options || !map) {
            return null;
        }
        const symbol = this.options['symbol'];
        const dx = symbol['markerDx'] || 0;
        const dy = symbol['markerDy'] || 0;
        const { x, y } = this._point;
        const w = this.w;
        const h = this.h;
        dpr = dpr || map.getDevicePixelRatio();
        this.bbox = this.bbox || getDefaultBBOX();
        const x1 = Math.round((x + dx) * dpr);
        const y1 = Math.round((y + dy) * dpr);
        const width = Math.round(w * dpr);
        const height = Math.round(h * dpr);
        this.bbox[0] = x1;
        this.bbox[1] = y1;
        this.bbox[2] = x1 + width;
        this.bbox[3] = y1 + height;

        const { options } = target;
        const collisionBufferSize = options.collisionBufferSize || 0;
        bufferBBOX(this.bbox, collisionBufferSize);
        return this.bbox;
    }

    setZIndex(zIndex: number) {
        this.options.zIndex = zIndex;
    }
}
