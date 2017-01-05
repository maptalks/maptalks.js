import { now } from 'core/util';
import { preventDefault } from 'core/util/dom';
import Handler from 'handler/Handler';
import DragHandler from 'handler/Drag';
import Point from 'geo/Point';
import Map from '../Map';

class MapDragHandler extends Handler {
    addHooks() {
        var map = this.target;
        if (!map) {
            return;
        }
        var dom = map._panels.mapWrapper || map._containerDOM;
        this._dragHandler = new DragHandler(dom, {
            'cancelOn': this._cancelOn.bind(this)
        });
        this._dragHandler.on('mousedown', this._onMouseDown, this)
            .on('dragstart', this._onDragStart, this)
            .on('dragging', this._onDragging, this)
            .on('dragend', this._onDragEnd, this)
            .enable();
    }

    removeHooks() {
        this._dragHandler.off('mousedown', this._onMouseDown, this)
            .off('dragstart', this._onDragStart, this)
            .off('dragging', this._onDragging, this)
            .off('dragend', this._onDragEnd, this)
            .disable();
        this._dragHandler.remove();
        delete this._dragHandler;
    }

    _cancelOn(domEvent) {
        if (this._ignore(domEvent)) {
            return true;
        }
        return false;
    }

    _ignore(param) {
        if (!param) {
            return false;
        }
        if (param.domEvent) {
            param = param.domEvent;
        }
        return this.target._ignoreEvent(param);
    }


    _onMouseDown(param) {
        if (this.target._panAnimating) {
            this.target._enablePanAnimation = false;
        }
        preventDefault(param['domEvent']);
    }

    _onDragStart(param) {
        var map = this.target;
        this.startDragTime = now();
        var domOffset = map.offsetPlatform();
        this.startLeft = domOffset.x;
        this.startTop = domOffset.y;
        this.preX = param['mousePos'].x;
        this.preY = param['mousePos'].y;
        this.startX = this.preX;
        this.startY = this.preY;
        map.onMoveStart(param);
    }

    _onDragging(param) {
        //preventDefault(param['domEvent']);
        if (this.startLeft === undefined) {
            return;
        }
        var map = this.target;
        var mx = param['mousePos'].x,
            my = param['mousePos'].y;
        var nextLeft = (this.startLeft + mx - this.startX);
        var nextTop = (this.startTop + my - this.startY);
        var mapPos = map.offsetPlatform();
        var offset = new Point(nextLeft, nextTop)._substract(mapPos);
        map.offsetPlatform(offset);
        map._offsetCenterByPixel(offset);
        map.onMoving(param);
    }

    _onDragEnd(param) {
        //preventDefault(param['domEvent']);
        if (this.startLeft === undefined) {
            return;
        }
        var map = this.target;
        var t = now() - this.startDragTime;
        var domOffset = map.offsetPlatform();
        var xSpan = domOffset.x - this.startLeft;
        var ySpan = domOffset.y - this.startTop;

        delete this.startLeft;
        delete this.startTop;
        delete this.preX;
        delete this.preY;
        delete this.startX;
        delete this.startY;

        if (t < 280 && Math.abs(ySpan) + Math.abs(xSpan) > 5) {
            // var distance = new Point(xSpan * Math.ceil(500 / t), ySpan * Math.ceil(500 / t))._multi(0.5);
            var distance = new Point(xSpan, ySpan);
            t = 5 * t * (Math.abs(distance.x) + Math.abs(distance.y)) / 500;
            map._panAnimation(distance, t);
        } else {
            map.onMoveEnd(param);
        }
    }
}

Map.mergeOptions({
    'draggable': true
});

Map.addOnLoadHook('addHandler', 'draggable', MapDragHandler);

export default MapDragHandler;
