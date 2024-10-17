import { now } from '../../core/util';
import { preventDefault, getEventContainerPoint } from '../../core/util/dom';
import Handler from '../../handler/Handler';
import DragHandler from '../../handler/Drag';
import Map from '../Map';
import { type Param } from './CommonType';
import Point from '../../geo/Point';


class MapDragHandler extends Handler {
    //@internal
    _dragHandler: DragHandler
    startDragTime: number
    startBearing: number
    //@internal
    _mode: 'rotatePitch' | 'move'
    preX: number
    preY: number
    startX: number
    startY: number
    // TODO:等待补充Coordinate类型定义
    //@internal
    _startPrjCenter: any
    // TODO:等待补充Coordinate类型定义
    startPrjCoord: any
    //@internal
    _rotateMode: 'rotate_pitch' | 'rotate' | 'pitch'
    //@internal
    _db: number
    //@internal
    private startContainerPoint: Point
    // TODO:等待补充Map类型定义
    // target: Map

    addHooks() {
        const map = this.target;
        if (!map) {
            return;
        }
        const dom = map.getPanels().mapWrapper || map.getContainer();
        this._dragHandler = new DragHandler(dom, {
            'cancelOn': this._cancelOn.bind(this),
            'rightclick': true
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

    //@internal
    _cancelOn(domEvent: any) {
        if (this.target.isZooming() || this._ignore(domEvent)) {
            return true;
        }
        return false;
    }

    //@internal
    _ignore(param: any) {
        if (!param) {
            return false;
        }
        if (param.domEvent) {
            param = param.domEvent;
        }
        return this.target._ignoreEvent(param);
    }

    //@internal
    _onMouseDown(param: any) {
        delete this.startDragTime;
        delete this._mode;
        const switchDragButton = this.target.options['switchDragButton'];
        const rotateModeButton = switchDragButton ? 0 : 2;
        const isTouch = param.domEvent.type === 'touchstart';
        const isRotatonMode = switchDragButton && isTouch || param.domEvent.button === rotateModeButton || param.domEvent.ctrlKey;
        if (isRotatonMode) {
            if (this.target.options['dragRotate'] || this.target.options['dragPitch']) {
                this._mode = 'rotatePitch';
            }
        } else if (this.target.options['dragPan']) {
            this._mode = 'move';
        }
        this.target._stopAnim(this.target._mapAnimPlayer);
        preventDefault(param['domEvent']);
    }

    //@internal
    _onDragStart(param) {
        this.startDragTime = now();
        if (this._mode === 'move') {
            this._moveStart(param);
        } else if (this._mode === 'rotatePitch') {
            this._rotateStart(param);
        }
    }

    //@internal
    _onDragging(param) {
        if (this._mode === 'move') {
            this._moving(param);
        } else if (this._mode === 'rotatePitch') {
            this._rotating(param);
        }
    }

    //@internal
    _onDragEnd(param) {
        if (this._mode === 'move') {
            this._moveEnd(param);
        } else if (this._mode === 'rotatePitch') {
            this._rotateEnd(param);
        }
        delete this.startDragTime;
        delete this.startBearing;
    }

    //@internal
    _start(param) {
        this.preX = param['mousePos'].x;
        this.preY = param['mousePos'].y;
        this.startX = this.preX;
        this.startY = this.preY;
        this._startPrjCenter = this.target._getPrjCenter().copy();
    }

    //@internal
    _moveStart(param) {
        delete this.startContainerPoint;
        this._start(param);
        const map = this.target as Map;
        map.onMoveStart(param);
        const p = getEventContainerPoint(map._getActualEvent(param.domEvent), map.getContainer());
        this.startPrjCoord = map.queryPrjCoordAtContainerPoint(p);
        // 如果 startPrjCoord.z 不为 undefined，说明是3dtiles或terrain上的查询结果
        if (map._isContainerPointOutOfMap(p) && this.startPrjCoord.z === undefined) {
            // containerPoint的射线不与地图相交，则以中心点作为拖拽基准
            this.startContainerPoint = p;
        }
    }

    //@internal
    _moving(param) {
        if (!this.startDragTime) {
            return;
        }
        const map = this.target as Map;
        const p = getEventContainerPoint(map._getActualEvent(param.domEvent), map.getContainer());
        if (this.startContainerPoint) {
            const offset = p._sub(this.startContainerPoint);
            p.set(map.width / 2 + offset.x, map.height / 2 + offset.y);
        }
        // 如果point的位置比相机高，地图的移动方向会相反
        const movingPoint = map._containerPointToPoint(p, undefined, undefined, this.startPrjCoord.z);
        const offset = movingPoint._sub(map._prjToPoint(map._getPrjCenter()));
        map._setPrjCoordAtOffsetToCenter(this.startPrjCoord, offset);
        map.onMoving(param);
    }

    //@internal
    _moveEnd(param: Param) {
        if (!this.startDragTime) {
            return;
        }
        const isTouch = param.domEvent.type === 'touchend';
        const map = this.target as Map;
        let t = now() - this.startDragTime;
        const mx = param['mousePos'].x,
            my = param['mousePos'].y;
        const dx = mx - this.startX;
        const dy = my - this.startY;
        const currentCenter = map._getPrjCenter();
        const dxy = currentCenter.sub(this._startPrjCenter);

        this._clear();

        if (map.options['panAnimation'] && !param.interupted && map._verifyExtent(map._getPrjCenter()) && t < 280 && Math.abs(dy) + Math.abs(dx) > 5) {
            t = 5 * t;
            const dscale = isTouch ? 5 : 2.8;
            const targetPrjCoord = currentCenter.add(dxy._multi(dscale));
            // map._fixPrjOnWorldWide(targetPrjCoord);
            map._panTo(targetPrjCoord, { 'duration': isTouch ? t * 3 : t * 2, 'easing': map.options.dragPanEasing || 'outExpo' });
        } else {
            map.onMoveEnd(param);
        }
    }

    //@internal
    _rotateStart(param: Param) {
        this._start(param);
        delete this._rotateMode;
        this.startBearing = this.target.getBearing();
        this.target.onDragRotateStart(param);
        this._db = 0;
    }

    //@internal
    _rotating(param: Param) {
        const map = this.target;
        const mx = param['mousePos'].x,
            my = param['mousePos'].y;
        const prePitch = map.getPitch(),
            preBearing = map.getBearing();
        const dx = Math.abs(mx - this.preX),
            dy = Math.abs(my - this.preY);

        if (!this._rotateMode) {
            if (map.options['dragRotatePitch']) {
                this._rotateMode = 'rotate_pitch';
            } else if (dx > dy) {
                this._rotateMode = 'rotate';
            } else if (dx < dy) {
                this._rotateMode = 'pitch';
            } else {
                this._rotateMode = 'rotate';
            }
        }

        if (this._rotateMode === 'pitch' && prePitch === 0 && dy < 10) {
            return;
        }

        if (this._rotateMode.indexOf('rotate') >= 0 && map.options['dragRotate']) {
            const factor = 0.15;
            let db = 0;
            if (map.options['dragPitch'] || dx > dy) {
                db = -factor * (this.preX - mx);
            } else if (mx > map.width / 2) {
                db = factor * (this.preY - my);
            } else {
                db = -factor * (this.preY - my);
            }
            const bearing = map.getBearing() + db;
            this._db = this._db || 0;
            this._db += db;

            map._setBearing(bearing);
        }
        if (this._rotateMode.indexOf('pitch') >= 0 && map.options['dragPitch']) {
            map._setPitch(map.getPitch() + (this.preY - my) * 0.15);
        }
        this.preX = mx;
        this.preY = my;
        if (map.getBearing() !== preBearing || map.getPitch() !== prePitch) {
            map.onDragRotating(param);
        }
    }

    //@internal
    _rotateEnd(param: Param) {
        const map = this.target;
        const bearing = map.getBearing();
        this._clear();
        const t = now() - this.startDragTime;
        map.onDragRotateEnd(param);
        if (map.options['rotateAnimation'] && Math.abs(bearing - this.startBearing) > 20 && (this._rotateMode === 'rotate' || this._rotateMode === 'rotate_pitch') && !param.interupted && t < 400) {
            const bearing = map.getBearing();
            map._animateTo({
                'bearing': bearing + this._db / 1.5
            }, {
                'easing': 'outQuint',
                'duration': 1600
            });
        }
    }

    //@internal
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
    'dragPan': true,
    'dragRotatePitch': true,
    'dragRotate': true,
    'dragPitch': true
});

Map.addOnLoadHook('addHandler', 'draggable', MapDragHandler);

export default MapDragHandler;
