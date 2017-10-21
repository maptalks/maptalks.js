import { now } from 'core/util';
import { preventDefault, getEventContainerPoint } from 'core/util/dom';
import Handler from 'handler/Handler';
import DragHandler from 'handler/Drag';
import Point from 'geo/Point';
import Map from '../Map';

class MapDragHandler extends Handler {
    addHooks() {
        const map = this.target;
        if (!map) {
            return;
        }
        const dom = map._panels.mapWrapper || map._containerDOM;
        this._dragHandler = new DragHandler(dom, {
            'cancelOn': this._cancelOn.bind(this),
            'rightclick' : true
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
            .off('dragend', this._onDragEnd, this);
        this._dragHandler.remove();
        delete this._dragHandler;
    }

    _cancelOn(domEvent) {
        if (this.target.isZooming()) {
            return true;
        }
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
        delete this.startDragTime;
        delete this._mode;
        if (param.domEvent.button === 2 || param.domEvent.ctrlKey) {
            if (this.target.options['dragRotate'] || this.target.options['dragPitch']) {
                this._mode = 'rotatePitch';
            }
        } else if (this.target.options['dragPan']) {
            this._mode = 'move';
        }
        this.target._stopAnim();
        preventDefault(param['domEvent']);
    }

    _onDragStart(param) {
        if (this._mode === 'move') {
            this._moveStart(param);
        } else if (this._mode === 'rotatePitch') {
            this._rotateStart(param);
        }
    }

    _onDragging(param) {
        const map = this.target;
        if (map._isEventOutMap(param['domEvent'])) {
            return;
        }
        if (this._mode === 'move') {
            this._moving(param);
        } else if (this._mode === 'rotatePitch') {
            this._rotating(param);
        }
    }

    _onDragEnd(param) {
        if (this._mode === 'move') {
            this._moveEnd(param);
        } else if (this._mode === 'rotatePitch') {
            this._rotateEnd(param);
        }
    }

    _start(param) {
        this.startDragTime = now();
        this.preX = param['mousePos'].x;
        this.preY = param['mousePos'].y;
        this.startX = this.preX;
        this.startY = this.preY;
    }

    _moveStart(param) {
        this._start(param);
        const map = this.target;
        map.onMoveStart(param);
        const p = getEventContainerPoint(map._getActualEvent(param.domEvent), map.getContainer());
        this.startPrjCoord = map._containerPointToPrj(p);
    }

    _moving(param) {
        if (!this.startDragTime) {
            return;
        }
        const map = this.target;
        const p = getEventContainerPoint(map._getActualEvent(param.domEvent), map.getContainer());
        map._setPrjCoordAtContainerPoint(this.startPrjCoord, p);
        map.onMoving(param);
    }

    _moveEnd(param) {
        if (!this.startDragTime) {
            return;
        }
        const map = this.target;
        let t = now() - this.startDragTime;
        const mx = param['mousePos'].x,
            my = param['mousePos'].y;
        const dx = mx - this.startX;
        const dy = my - this.startY;

        this._clear();

        if (map._verifyExtent(map.getCenter()) && t < 280 && Math.abs(dy) + Math.abs(dx) > 5) {
            t = 5 * t * (Math.abs(dx) + Math.abs(dy)) / 500;
            map.panBy(new Point(dx, dy), { 'duration' : t });
        } else {
            map.onMoveEnd(param);
        }
    }

    _rotateStart(param) {
        this._start(param);
        delete this._rotateMode;
        this.target.onDragRotateStart(param);
    }

    _rotating(param) {
        const map = this.target;
        const mx = param['mousePos'].x,
            my = param['mousePos'].y;
        const prePitch = map.getPitch(),
            preBearing = map.getBearing();
        const dx = Math.abs(mx - this.preX),
            dy = Math.abs(my - this.preY);
        if (!this._rotateMode) {
            if (dx > dy) {
                this._rotateMode = 'rotate';
            } else if (dx < dy) {
                this._rotateMode = 'pitch';
            }
        }

        if (this._rotateMode === 'pitch' && prePitch === 0 && dy < 10) {
            return;
        }

        if (this._rotateMode === 'rotate' && map.options['dragRotate']) {
            map.setBearing(map.getBearing() + 3 * (mx > this.preX ? 1 : -1));
        } else if (this._rotateMode === 'pitch' && map.options['dragPitch']) {
            map.setPitch(map.getPitch() + (my > this.preY ? -1 : 1) * 3);
        }
        this.preX = mx;
        this.preY = my;
        if (map.getBearing() !== preBearing || map.getPitch() !== prePitch) {
            map.onDragRotating(param);
        }
    }

    _rotateEnd(param) {
        this._clear();
        this.target.onDragRotateEnd(param);
    }

    _clear() {
        delete this.startPrjCoord;
        delete this.preX;
        delete this.preY;
        delete this.startX;
        delete this.startY;
    }
}

Map.mergeOptions({
    'draggable': true,
    'dragPan' : true,
    'dragRotate' : true,
    'dragPitch' : true
});

Map.addOnLoadHook('addHandler', 'draggable', MapDragHandler);

export default MapDragHandler;
