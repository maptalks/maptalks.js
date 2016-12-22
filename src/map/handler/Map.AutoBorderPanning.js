import { requestAnimFrame, cancelAnimFrame, bind } from 'core/util';
import { on, off } from 'core/util/dom';
import Handler from 'core/Handler';
import Point from 'geo/Point';
import Map from '../Map';

Map.mergeOptions({
    'autoBorderPanning': false
});

Map.AutoBorderPanning = Handler.extend({
    //threshold to trigger panning, in px
    threshold: 10,
    //number of px to move when panning is triggered
    step: 4,

    addHooks: function () {
        this.dom = this.target._containerDOM;
        on(this.dom, 'mousemove', this._onMouseMove, this);
        on(this.dom, 'mouseout', this._onMouseOut, this);
    },

    removeHooks: function () {
        this._cancelPan();
        off(this.dom, 'mousemove', this._onMouseMove, this);
        off(this.dom, 'mouseout', this._onMouseOut, this);
    },

    _onMouseMove: function (event) {
        var eventParam = this.target._parseEvent(event);
        var mousePos = eventParam['containerPoint'];
        var size = this.target.getSize();
        var tests = [mousePos.x, size['width'] - mousePos.x,
            mousePos.y, size['height'] - mousePos.y
        ];

        var min = Math.min.apply(Math, tests),
            absMin = Math.abs(min);

        if (absMin === 0 || absMin > this.threshold) {
            this._cancelPan();
            return;
        }
        var step = this.step;
        var offset = new Point(0, 0);
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
    },

    _onMouseOut: function () {
        this._cancelPan();
    },

    _cancelPan: function () {
        delete this._stepOffset;
        if (this._animationId) {
            cancelAnimFrame(this._animationId);
            delete this._animationId;
        }
    },

    _pan: function () {
        if (this._stepOffset) {
            this.target.panBy(this._stepOffset, {
                'animation': false
            });
            this._animationId = requestAnimFrame(bind(this._pan, this));
        }
    }
});

Map.addInitHook('addHandler', 'autoBorderPanning', Map.AutoBorderPanning);
