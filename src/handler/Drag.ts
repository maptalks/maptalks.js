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

    options: DragOptionsType;
    _onMouseDown: (e: any) => any;
    moved: boolean;
    startPos: Point;
    interupted: boolean;

    addHooks(): void {
        // throw new Error('Method not implemented.');
    }
    removeHooks(): void {
        // throw new Error('Method not implemented.');
    }

    constructor(dom: HTMLElement, options: DragOptionsType = {}) {
        super(null);
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

    onMouseDown(event: DragEventType) {
        if (!this.options['rightclick'] && (event as MouseEvent).button === 2) {
            //ignore right mouse down
            return;
        }
        const toucheEvent = event as TouchEvent;
        if (toucheEvent.touches && toucheEvent.touches.length > 1) {
            return;
        }
        if (this.options['cancelOn'] && this.options['cancelOn'](event) === true) {
            return;
        }
        const dom = this.dom;
        if ((dom as any).setCapture) {
            (dom as any).setCapture();
        } else if (window.captureEvents) {
            window.captureEvents();
            // window.captureEvents((window['Event'].MOUSEMOVE | window['Event'].MOUSEUP));
        }
        dom['ondragstart'] = function () {
            return false;
        };
        delete this.moved;
        const actual = toucheEvent.touches ? toucheEvent.touches[0] : event;
        this.startPos = new Point((actual as MouseEvent).clientX, (actual as MouseEvent).clientY);
        off(document, MOVE_EVENTS[event.type], this.onMouseMove);
        off(document, END_EVENTS[event.type], this.onMouseUp);
        on(document, MOVE_EVENTS[event.type], this.onMouseMove, this);
        on(document, END_EVENTS[event.type], this.onMouseUp, this);
        if (!this.options['ignoreMouseleave']) {
            off(this.dom, 'mouseleave', this.onMouseUp);
            on(this.dom, 'mouseleave', this.onMouseUp, this);
        }
        this.fire('mousedown', {
            'domEvent': event,
            'mousePos': new Point((actual as MouseEvent).clientX, (actual as MouseEvent).clientY)
        });
    }

    onMouseMove(event: DragEventType) {
        const toucheEvent = event as TouchEvent;
        if (toucheEvent.touches && toucheEvent.touches.length > 1) {
            if (this.moved) {
                this.interupted = true;
                this.onMouseUp(event);
            }
            return;
        }
        const actual = toucheEvent.touches ? toucheEvent.touches[0] : event;

        const newPos = new Point((actual as MouseEvent).clientX, (actual as MouseEvent).clientY),
            offset = newPos.sub(this.startPos);
        if (!offset.x && !offset.y) {
            return;
        }
        if (!this.moved) {
            this.fire('dragstart', {
                'domEvent': event,
                'mousePos': this.startPos.copy()
            });
            this.moved = true;
        } else {
            this.fire('dragging', {
                'domEvent': event,
                'mousePos': new Point((actual as MouseEvent).clientX, (actual as MouseEvent).clientY)
            });
        }
    }

    onMouseUp(event: DragEventType) {
        const toucheEvent = event as TouchEvent;
        const actual = toucheEvent.changedTouches ? toucheEvent.changedTouches[0] : event;
        this._offEvents();
        const param: { [key: string]: any } = {
            'domEvent': event
        };
        if (isNumber((actual as MouseEvent).clientX)) {
            param['mousePos'] = new Point(parseInt((actual as MouseEvent).clientX + '', 0), parseInt((actual as MouseEvent).clientY + '', 0));
        }
        if (this.moved/* && this.moving*/) {
            param.interupted = this.interupted;
            this.fire('dragend', param);
            delete this.interupted;
            delete this.moved;
        }

        this.fire('mouseup', param);
    }

    _offEvents() {
        const dom = this.dom;
        off(dom, 'mouseleave', this.onMouseUp);
        if ((typeof document === 'undefined') || (typeof window === 'undefined')) {
            return;
        }
        for (const i in MOVE_EVENTS) {
            off(document, MOVE_EVENTS[i], this.onMouseMove);
            off(document, END_EVENTS[i], this.onMouseUp);
        }

        if (dom['releaseCapture']) {
            dom['releaseCapture']();
        } else if (window.captureEvents) {
            window.captureEvents();
            // window.captureEvents(window['Event'].MOUSEMOVE | window['Event'].MOUSEUP);
        }
    }
}

export default DragHandler;

type DragOptionsType = {
    rightclick?: boolean;
    cancelOn?: (e: DragEventType) => boolean;
    ignoreMouseleave?: boolean;
}

type DragEventType = MouseEvent | TouchEvent;
