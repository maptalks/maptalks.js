import { requestAnimFrame, cancelAnimFrame } from 'core/util';
import { on, off } from 'core/util/dom';
import Handler from 'handler/Handler';
import Point from 'geo/Point';
import Map from '../Map';

class MapAutoBorderPanningHandler extends Handler {
    constructor(target) {
        super(target);
        //threshold to trigger panning, in px
        this.threshold = 10;
        //number of px to move when panning is triggered
        this.step = 4;
    }

    addHooks() {
        this.dom = this.target._containerDOM;
        on(this.dom, 'mousemove', this._onMouseMove, this);
        on(this.dom, 'mouseout', this._onMouseOut, this);
    }

    removeHooks() {
        this._cancelPan();
        off(this.dom, 'mousemove', this._onMouseMove, this);
        off(this.dom, 'mouseout', this._onMouseOut, this);
    }

    _onMouseMove(event) {
        const eventParam = this.target._parseEvent(event);
        const mousePos = eventParam['containerPoint'];
        const size = this.target.getSize();
        const tests = [
            mousePos.x, size['width'] - mousePos.x,
            mousePos.y, size['height'] - mousePos.y
        ];

        const min = Math.min.apply(Math, tests),
            absMin = Math.abs(min);

        if (absMin === 0 || absMin > this.threshold) {
            this._cancelPan();
            return;
        }
        const step = this.step;
        const offset = new Point(0, 0);
        if (tests[0] === min) {
            offset.x = -step;
        } else if (tests[1] === min) {
            offset.x = step;
        }
        if (tests[2] === min) {
            offset.y = -step;
        } else if (tests[3] === min) {
            offset.y = step;
        }
        this._stepOffset = offset;
        this._pan();
    }

    _onMouseOut() {
        this._cancelPan();
    }

    _cancelPan() {
        delete this._stepOffset;
        if (this._animationId) {
            cancelAnimFrame(this._animationId);
            delete this._animationId;
        }
    }

    _pan() {
        if (this._stepOffset) {
            this.target.panBy(this._stepOffset, {
                'animation': false
            });
            this._animationId = requestAnimFrame(this._pan.bind(this));
        }
    }
}

Map.mergeOptions({
    'autoBorderPanning': false
});

Map.addOnLoadHook('addHandler', 'autoBorderPanning', MapAutoBorderPanningHandler);

export default MapAutoBorderPanningHandler;
