import Eventable from '../../core/Eventable';
import Class from '../../core/Class';
import Point from '../../geo/Point';
import { ResourceCache } from '../layer/CanvasRenderer';
import { drawVectorMarker } from '../../core/util/draw';
import { isNil } from '../../core/util/';
import { getSymbolHash } from '../../core/util/style';
import { getEventContainerPoint } from '../../core/util/dom';
import DragHandler from '../../handler/Drag';

const resources = new ResourceCache();
let prevX, prevY;

export default class EditHandle extends Eventable(Class) {
    constructor(target, map, options) {
        super(options);
        this.target = target;
        target.once('remove', this.delete, this);
        const symbol = this.options['symbol'];
        const lineWidth = symbol['markerLineWidth'] || 1;
        this.w = symbol['markerWidth'] + lineWidth;
        this.h = symbol['markerHeight'] + lineWidth;
        this.dx = symbol['markerDx'] || 0;
        this.dy = symbol['markerDy'] || 0;
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

    setContainerPoint(cp) {
        this._point = cp;
        this._point._sub(this.w / 2, this.h / 2);
    }

    getContainerPoint() {
        return this._point.add(this.w / 2, this.h / 2);
    }

    offset(p) {
        // dragging
        this._point._add(p);
    }

    render(ctx) {
        if (!this._img) {
            return false;
        }
        const map = this.map;
        const { x, y } = this._point;
        const w = this.w;
        const h = this.h;
        if (x + w > 0 && x < map.width && y + h > 0 && y < map.height) {
            const dpr = map.getDevicePixelRatio();
            ctx.globalAlpha = this.opacity;
            ctx.drawImage(this._img, Math.round((x + this.dx) * dpr) + this.dx, Math.round((y  + this.dy) * dpr), Math.round(w * dpr), Math.round(h * dpr));
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

    hitTest(p) {
        const w = this.w;
        const h = this.h;
        const x = this._point.x + this.dx;
        const y = this._point.y + this.dy;
        return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
    }

    addTo(map) {
        this.map = map;
        const renderer = map.getRenderer();
        renderer.addTopElement(this);
    }

    onEvent(e) {
        this.fire(e.type, e);
    }

    mousedown(e) {
        const map = e.target;
        const cursor = this.options['cursor'];
        if (cursor) {
            map.setCursor(cursor);
        }
        this.onDragstart(e);
    }

    onDragstart(e) {
        const { containerPoint, target: map } = e;
        const dom = map._panels.mapWrapper || map._containerDOM;

        const dragHandler = this._dragger = new DragHandler(dom);
        dragHandler.on('dragging', this.onDragging, this)
            .on('mouseup', this.onDragend, this)
            .enable();
        dragHandler.type = 'handle';
        dragHandler.onMouseDown(e['domEvent']);
        prevX = containerPoint.x;
        prevY = containerPoint.y;
        this.fire('dragstart', {
            containerPoint
        });
    }

    onDragging(e) {
        if (!this._dragger) {
            return;
        }
        const activeMap = this.map;
        const containerPoint = getEventContainerPoint(e.domEvent, activeMap._containerDOM);
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

    onDragend(e) {
        if (!this._dragger) {
            return;
        }
        const map = this.map;
        map.resetCursor();
        const containerPoint = getEventContainerPoint(e.domEvent, map._containerDOM);
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
}
