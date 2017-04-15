import { isNumber } from 'core/util';
import Handler from 'handler/Handler';
import Browser from 'core/Browser';
import { on, off } from 'core/util/dom';
import Point from 'geo/Point';

const START_EVENTS = Browser.touch ? 'touchstart mousedown' : 'mousedown';
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

    constructor(dom, options) {
        super(null);
        this.dom = dom;
        this.options = options || {};
    }

    enable() {
        if (!this.dom) {
            return;
        }
        on(this.dom, START_EVENTS, this.onMouseDown, this);
    }


    disable() {
        if (!this.dom) {
            return;
        }
        off(this.dom, START_EVENTS, this.onMouseDown);
    }

    onMouseDown(event) {
        if (!this.options['rightclick'] && event.button === 2) {
            //ignore right mouse down
            return;
        }
        if (this.options['cancelOn'] && this.options['cancelOn'](event) === true) {
            return;
        }
        var dom = this.dom;
        if (dom.setCapture) {
            dom.setCapture();
        } else if (window.captureEvents) {
            window.captureEvents(window['Event'].MOUSEMOVE | window['Event'].MOUSEUP);
        }
        dom['ondragstart'] = function () {
            return false;
        };
        this.moved = false;
        var actual = event.touches ? event.touches[0] : event;
        this.startPos = new Point(actual.clientX, actual.clientY);
        on(document, MOVE_EVENTS[event.type], this.onMouseMove, this);
        on(document, END_EVENTS[event.type], this.onMouseUp, this);
        on(this.dom, 'mouseleave', this.onMouseUp, this);
        this.fire('mousedown', {
            'domEvent': event,
            'mousePos': new Point(actual.clientX, actual.clientY)
        });
    }

    onMouseMove(event) {
        if (event.touches && event.touches.length > 1) {
            return;
        }
        var actual = event.touches ? event.touches[0] : event;

        var newPos = new Point(actual.clientX, actual.clientY),
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
                'mousePos': new Point(actual.clientX, actual.clientY)
            });
        }
    }

    onMouseUp(event) {
        var dom = this.dom;
        var actual = event.changedTouches ? event.changedTouches[0] : event;
        for (var i in MOVE_EVENTS) {
            off(document, MOVE_EVENTS[i], this.onMouseMove, this);
            off(document, END_EVENTS[i], this.onMouseUp, this);
        }
        off(this.dom, 'mouseleave', this.onMouseUp, this);
        if (dom['releaseCapture']) {
            dom['releaseCapture']();
        } else if (window.captureEvents) {
            window.captureEvents(window['Event'].MOUSEMOVE | window['Event'].MOUSEUP);
        }
        var param = {
            'domEvent': event
        };
        if (isNumber(actual.clientX)) {
            param['mousePos'] = new Point(parseInt(actual.clientX, 0), parseInt(actual.clientY, 0));
        }
        if (this.moved/* && this.moving*/) {
            this.fire('dragend', param);
        }

        this.fire('mouseup', param);
    }
}

export default DragHandler;
