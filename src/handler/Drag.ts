import { isNumber } from '../core/util';
import Handler from './Handler';
import { on, off } from '../core/util/dom';
import Point from '../geo/Point';

const START_EVENTS = 'touchstart mousedown';
const MOVE_EVENTS = {
    mousedown: 'mousemove',
    touchstart: 'touchmove',
    pointerdown: 'touchmove',
    MSPointerDown: 'touchmove'
};
const END_EVENTS = {
    mousedown: 'mouseup',
    touchstart: 'touchend',
    pointerdown: 'touchend',
    MSPointerDown: 'touchend'
};

/**
 * Drag handler
 * @category handler
 * @protected
 * @extends Handler
 */
class DragHandler extends Handler {
    options: object;
    _onMouseDown: any;
    moved: any;
    startPos: Point;
    interupted: boolean;

    constructor(dom, options = {}) {
        //@ts-ignore
        super();
        this.dom = dom;
        this.options = options;
    }

    enable() {
        if (!this.dom) {
            return this;
        }
        //create a dynamic method to resolve conflicts with other drag handler
        this._onMouseDown = function (e) {
            return this.onMouseDown(e);
        };
        on(this.dom, START_EVENTS, this._onMouseDown, this);
        return this;
    }


    disable() {
        if (!this.dom) {
            return this;
        }
        this._offEvents();
        off(this.dom, START_EVENTS, this._onMouseDown);
        delete this._onMouseDown;
        return this;
    }

    onMouseDown(event) {
        if (!this.options['rightclick'] && event.button === 2) {
            //ignore right mouse down
            return;
        }
        if (event.touches && event.touches.length > 1) {
            return;
        }
        if (this.options['cancelOn'] && this.options['cancelOn'](event) === true) {
            return;
        }
        const dom = this.dom;
        //@ts-ignore
        if (dom.setCapture) {
            //@ts-ignore
            dom.setCapture();
        } else if (window.captureEvents) {
            //@ts-ignore
            window.captureEvents(window['Event'].MOUSEMOVE | window['Event'].MOUSEUP);
        }
        dom['ondragstart'] = function () {
            return false;
        };
        delete this.moved;
        const actual = event.touches ? event.touches[0] : event;
        this.startPos = new Point(actual.clientX, actual.clientY);
        //@ts-ignore
        off(document, MOVE_EVENTS[event.type], this.onMouseMove, this);
        //@ts-ignore
        off(document, END_EVENTS[event.type], this.onMouseUp, this);
        //@ts-ignore
        on(document, MOVE_EVENTS[event.type], this.onMouseMove, this);
        //@ts-ignore
        on(document, END_EVENTS[event.type], this.onMouseUp, this);
        if (!this.options['ignoreMouseleave']) {
            //@ts-ignore
            off(this.dom, 'mouseleave', this.onMouseUp, this);
            on(this.dom, 'mouseleave', this.onMouseUp, this);
        }
        //@ts-ignore
        this.fire('mousedown', {
            'domEvent': event,
            'mousePos': new Point(actual.clientX, actual.clientY)
        });
    }

    onMouseMove(event) {
        if (event.touches && event.touches.length > 1) {
            if (this.moved) {
                this.interupted = true;
                this.onMouseUp(event);
            }
            return;
        }
        const actual = event.touches ? event.touches[0] : event;

        const newPos = new Point(actual.clientX, actual.clientY),
            offset = newPos.sub(this.startPos);
        if (!offset.x && !offset.y) {
            return;
        }
        if (!this.moved) {
            //@ts-ignore
            this.fire('dragstart', {
                'domEvent': event,
                'mousePos': this.startPos.copy()
            });
            this.moved = true;
        } else {
            //@ts-ignore
            this.fire('dragging', {
                'domEvent': event,
                'mousePos': new Point(actual.clientX, actual.clientY)
            });
        }
    }

    onMouseUp(event) {
        const actual = event.changedTouches ? event.changedTouches[0] : event;
        this._offEvents();
        const param = {
            'domEvent': event
        };
        if (isNumber(actual.clientX)) {
            param['mousePos'] = new Point(parseInt(actual.clientX, 0), parseInt(actual.clientY, 0));
        }
        if (this.moved/* && this.moving*/) {
            //@ts-ignore
            param.interupted = this.interupted;
            //@ts-ignore
            this.fire('dragend', param);
            //@ts-ignore
            delete this.interupted;
            delete this.moved;
        }
        //@ts-ignore
        this.fire('mouseup', param);
    }

    _offEvents() {
        const dom = this.dom;
        //@ts-ignore
        off(dom, 'mouseleave', this.onMouseUp, this);
        if ((typeof document === 'undefined') || (typeof window === 'undefined')) {
            return;
        }
        for (const i in MOVE_EVENTS) {
            //@ts-ignore
            off(document, MOVE_EVENTS[i], this.onMouseMove, this);
            //@ts-ignore
            off(document, END_EVENTS[i], this.onMouseUp, this);
        }

        if (dom['releaseCapture']) {
            dom['releaseCapture']();
        } else if (window.captureEvents) {
            //@ts-ignore
            window.captureEvents(window['Event'].MOUSEMOVE | window['Event'].MOUSEUP);
        }
    }
}

export default DragHandler;
