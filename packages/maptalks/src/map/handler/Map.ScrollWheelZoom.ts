import { isNil, isNumber } from '../../core/util';
import { addDomEvent, removeDomEvent, getEventContainerPoint, preventDefault, stopPropagation } from '../../core/util/dom';
import Map from '../Map';
import MapBaseHandler from './MapBaseHandler';

/*!
 * Contains code from mapbox-gl-js
 * http://github.com/mapbox/mapbox-gl-js
 * License BSD-3-Clause
 */

const wheelZoomDelta = 4.000244140625;

const defaultZoomRate = 1 / 100;
const wheelZoomRate = 1 / 450;

const maxScalePerFrame = 2;

class MapScrollWheelZoomHandler extends MapBaseHandler {
    //@internal
    _thisScrollZoom: () => void
    //@internal
    _thisCheckIfEndZoom: () => void
    //@internal
    _wheelZoomRate: number
    //@internal
    _defaultZoomRate: number
    //@internal
    _delta: number
    //@internal
    _zooming: boolean
    //@internal
    _trackPadSuspect: number
    //@internal
    _ensureTrackpad: boolean
    //@internal
    _active: boolean
    //@internal
    _requesting: number
    //@internal
    _startZoom: number
    //@internal
    _origin: any
    //@internal
    _zoomOrigin: any
    //@internal
    _lastWheelEvent: any
    //@internal
    _scrollTime: number

    constructor(target) {
        super(target);
        this._thisScrollZoom = this._scrollZoom.bind(this);
        this._thisCheckIfEndZoom = this._checkIfEndZoom.bind(this);
        this._wheelZoomRate = wheelZoomRate;
        this._defaultZoomRate = defaultZoomRate;
        this._delta = 0;
    }

    addHooks() {
        addDomEvent(this.target._containerDOM, 'wheel', this._onWheelScroll, this);
    }

    removeHooks() {
        removeDomEvent(this.target._containerDOM, 'wheel', this._onWheelScroll);
    }

    //@internal
    _currentZoomCanScroll(value: number) {
        if (isNumber(value)) {
            const map = this.target;
            const zoom = map.getZoom();
            const minZoom = map.getMinZoom();
            const maxZoom = map.getMaxZoom();
            if (zoom === minZoom && value > 0) {
                return false;
            }
            if (zoom === maxZoom && value < 0) {
                return false;
            }
        }
        return true;
    }

    //@internal
    _onWheelScroll(evt) {
        const map = this.target;
        if (map.options['preventWheelScroll']) {
            preventDefault(evt);
            stopPropagation(evt);
        }

        if (map._ignoreEvent(evt) || !map.options['zoomable']) {
            return false;
        }
        const container = map.getContainer();
        const origin = map._checkZoomOrigin(getEventContainerPoint(evt, container));
        if (map.options['seamlessZoom']) {
            if (!this._zooming) {
                this._trackPadSuspect = 0;
                this._ensureTrackpad = false;
            }
            return this._seamless(evt, origin);
        } else {
            return this._interval(evt, origin);
        }
    }

    //@internal
    _seamless(evt, origin) {
        let value = evt.deltaMode === window.WheelEvent.DOM_DELTA_LINE ? evt.deltaY * 60 : evt.deltaY;
        if (value % wheelZoomDelta !== 0) {
            //according to https://archive.fo/ZV8gz
            //value % wheelDelta === 0 means it must be  mouse on Mac OS X
            if (!this._ensureTrackpad) {
                if (Math.abs(value) < 60) {
                    this._trackPadSuspect++;
                } else {
                    this._trackPadSuspect = 0;
                }
                //repeated very small delta value ensure it's a trackpad
                if (this._trackPadSuspect >= 2) {
                    this._ensureTrackpad = true;
                }
            }
            if (this._ensureTrackpad) {
                value *= 14;
            }
        }

        if (evt.shiftKey && value) value = value / 4;

        this._lastWheelEvent = evt;
        //is undefined ,the _interval will delete it
        if (isNil(this._delta)) {
            this._delta = 0;
        }
        this._delta -= value;
        if (!this._currentZoomCanScroll(value)) {
            return;
        }
        if (!this._zooming && this._delta) {
            const map = this.target;
            this._zoomOrigin = origin;
            map.onZoomStart(null, origin);
        }
        this._start();
    }

    //@internal
    _start() {
        if (!this._delta) return;
        this._zooming = true;
        const map = this.target;
        if (!this._active) {
            map.getRenderer().callInNextFrame(this._thisScrollZoom);
            this._active = true;
        }
    }

    //@internal
    _scrollZoom() {
        this._active = false;
        if (!this._delta) {
            return;
        }
        const zoomRate = (Math.abs(this._delta) > wheelZoomDelta) ? this._wheelZoomRate : this._defaultZoomRate;
        let scale = maxScalePerFrame / (1 + Math.exp(-Math.abs(this._delta * zoomRate)));
        if (this._delta < 0 && scale !== 0) {
            scale = 1 / scale;
        }
        const map = this.target;
        const zoom = map.getZoom();
        const targetZoom = map.getZoomForScale(scale, zoom, true);
        this._delta = 0;
        map.onZooming(targetZoom, this._zoomOrigin);
        this._scrollTime = performance.now();
        map.getRenderer().callInNextFrame(this._thisCheckIfEndZoom);
    }

    //@internal
    _checkIfEndZoom() {
        if (!this._zooming) {
            return;
        }
        const map = this.target;

        const currentTime = performance.now();
        if (currentTime - this._scrollTime > 210) {
            this._zooming = false;
            map.onZoomEnd(map.getZoom(), this._zoomOrigin);
        } else {
            map.getRenderer().callInNextFrame(this._thisCheckIfEndZoom);
        }
    }

    //@internal
    _interval(evt, origin) {
        const map = this.target;
        if (this._zooming) {
            this._requesting++;
            return false;
        }
        this._requesting = 0;
        let levelValue = (evt.deltaY ? evt.deltaY * -1 : evt.wheelDelta ? evt.wheelDelta : evt.detail) > 0 ? 1 : -1;
        if (evt.detail) {
            levelValue *= -1;
        }
        const zoom = map.getZoom();
        let nextZoom = zoom + levelValue;
        nextZoom = map._checkZoom(levelValue > 0 ? Math.ceil(nextZoom) : Math.floor(nextZoom));
        if (nextZoom === zoom) {
            return false;
        }
        this._zooming = true;
        if (!this._delta) {
            map.onZoomStart(null, origin);
            this._origin = origin;
            this._delta = levelValue;
            this._startZoom = map.getZoom();
        }
        const duration = 90;
        map._animateTo({
            'zoom': nextZoom - this._delta * 1 / 2,
            'around': this._origin
        }, {
            'continueOnViewChanged': true,
            'easing': 'linear',
            'duration': duration,
            'wheelZoom': true
        }, frame => {
            if (frame.state.playState !== 'finished') {
                if (frame.state.playState !== 'running') {
                    delete this._zooming;
                    delete this._requesting;
                }
                return;
            }
            if (this._requesting < 1 || Math.abs(nextZoom - this._startZoom) > 2 ||
                //finish zooming if target zoom hits min/max
                nextZoom === map.getMaxZoom() || nextZoom === map.getMinZoom()) {

                map._animateTo({
                    'zoom': nextZoom,
                    'around': this._origin
                }, {
                    'continueOnViewChanged': true,
                    'duration': 100
                }, frame => {
                    if (frame.state.playState !== 'running') {
                        // setTimeout(() => {
                        //     delete this._zooming;
                        //     delete this._requesting;
                        // }, 100);
                        delete this._zooming;
                        delete this._requesting;
                    }
                });
                delete this._startZoom;
                delete this._origin;
                delete this._delta;
                this._requesting = 0;
            } else if (!isNil(this._requesting)) {
                delete this._zooming;
                this._onWheelScroll(evt);
            }
        });
        return false;
    }
}

Map.mergeOptions({
    'scrollWheelZoom': true,
    'seamlessZoom': true
});

Map.addOnLoadHook('addHandler', 'scrollWheelZoom', MapScrollWheelZoomHandler);

export default MapScrollWheelZoomHandler;
