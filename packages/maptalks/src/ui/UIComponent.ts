import { extend, isFunction, isNumber } from '../core/util';
import { trim } from '../core/util/strings';
import {
    on,
    off,
    removeDomNode,
    stopPropagation,
    TRANSFORM,
    TRANSFORMORIGIN,
    TRANSITION
} from '../core/util/dom';
import Browser from '../core/Browser';
import Class from '../core/Class';
import Eventable from '../core/Eventable';
import Size from '../geo/Size';
import Geometry from '../geometry/Geometry';
import Coordinate from '../geo/Coordinate';
import type { Map } from './../map/Map';
import { Point } from '../geo';

/**
 * @property {Object} options
 * @property {Boolean} [options.eventsPropagation=false]  - whether stop ALL events' propagation.
 * @property {Boolean} [options.eventsToStop=null]  - UI's dom events to stop propagation if eventsPropagation is true.
 * @property {Number}  [options.dx=0]     - pixel offset on x axis
 * @property {Number}  [options.dy=0]     - pixel offset on y axis
 * @property {Boolean} [options.autoPan=false]  - set it to false if you don't want the map to do panning animation to fit the opened UI.
 * @property {Boolean} [options.autoPanDuration=600]    - duration for auto panning animation.
 * @property {Boolean} [options.single=true]    - whether the UI is a global single one, only one UI will be shown at the same time if set to true.
 * @property {Boolean} [options.animation=null]         - fade | scale | fade,scale, add animation effect when showing and hiding.
 * @property {Number}  [options.animationDuration=300]  - animation duration, in milliseconds.
 * @property {Number}  [options.animationOnHide=false]  - if calls animation on hiding.
 * @property {Boolean}  [options.pitchWithMap=false]    - whether tilt with map
 * @property {Boolean}  [options.rotateWithMap=false]  - whether rotate with map
 * @property {Boolean}  [options.collision=false]  - whether collision
 * @property {Number}  [options.collisionBufferSize=2]  - collision buffer size
 * @property {Number}  [options.collisionWeight=0]  - Collision weight, large priority collision
 * @property {Boolean}  [options.collisionFadeIn=false]  - Collision fade in animation
 * @property {Number}  [options.zIndex=0]  - dom zindex
 * @memberOf ui.UIComponent
 * @instance
 */
const options: UIComponentOptionsType = {
    'eventsPropagation': false,
    'eventsToStop': null,
    'dx': 0,
    'dy': 0,
    'autoPan': false,
    'autoPanDuration': 600,
    'single': true,
    'animation': 'scale',
    'animationOnHide': false,
    'animationDuration': 500,
    'pitchWithMap': false,
    'rotateWithMap': false,
    'visible': true,
    'roundPoint': false,
    'collision': false,
    'collisionBufferSize': 2,
    'collisionWeight': 0,
    'collisionFadeIn': false,
    'zIndex': 0
};

/**
 * @classdesc
 * Base class for all the UI component classes, a UI component is a HTMLElement positioned with geographic coordinate. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @category ui
 * @abstract
 * @mixes Eventable
 * @memberOf ui
 * @extends Class
 */
class UIComponent extends Eventable(Class) {

    options: UIComponentOptionsType;
    //@internal
    _owner: Map | Geometry;
    //@internal
    _coordinate: Coordinate;
    //@internal
    _showBySymbolChange: boolean;
    //@internal
    _mapEventsOn: boolean;
    //@internal
    __uiDOM: HTMLElement;
    //@internal
    _pos: Point;
    //@internal
    _autoPanId: NodeJS.Timeout;
    //@internal
    _domContentRect: { width: number, height: number };
    //@internal
    _size: Size;
    //@internal
    _resizeObserver: ResizeObserver;

    /**
     *  Some instance methods subclasses needs to implement:  <br>
     *  <br>
     * 1. Optional, returns the Dom element's position offset  <br>
     * function getOffset : Point  <br>
     *  <br>
     * 2. Method to create UI's Dom element  <br>
     * function buildOn : HTMLElement  <br>
     *  <br>
     * 3 Optional, to provide an event map to register event listeners.  <br>
     * function getEvents : void  <br>
     * 4 Optional, a callback when dom is removed.  <br>
     * function onDomRemove : void  <br>
     * 5 Optional, a callback when UI Component is removed.  <br>
     * function onRemove : void  <br>
     * @param  {Object} options configuration options
     */
    constructor(options: UIComponentOptionsType) {
        super(options);
        this.proxyOptions();
    }

    //@internal
    _appendCustomClass(dom: HTMLElement) {
        if (!dom) {
            console.warn('dom is null:', dom);
            return this;
        }
        if (this.options.cssName) {
            let cssName = this.options.cssName;
            if (!Array.isArray(cssName)) {
                cssName = [cssName];
            }
            cssName.forEach(name => {
                dom.classList.add(name);
            });
        }
        return this;
    }


    onAdd() {

    }

    onRemove() {

    }

    onDomRemove() {

    }

    getEvents(): { [key: string]: () => void } {
        return {};
    }

    getOwnerEvents(): { [key: string]: () => void } {
        return {};
    }

    buildOn(): HTMLElement {
        return null;
    }

    /**
     * Adds the UI Component to a geometry or a map
     * @param {Geometry|Map} owner - geometry or map to addto.
     * @returns {ui.UIComponent} this
     * @fires ui.UIComponent#add
     */
    addTo(owner: Geometry | Map) {
        this._owner = owner;
        // first time
        this._switchEvents('on');
        if (this.onAdd) {
            this.onAdd();
        }
        /**
         * add event.
         *
         * @event ui.UIComponent#add
         * @type {Object}
         * @property {String} type - add
         * @property {ui.UIComponent} target - UIComponent
         */
        this.fire('add');
        return this;
    }

    /**
     * Get the map it added to
     * @return {Map} map instance
     * @override
     */
    getMap(): Map {
        if (!this._owner) {
            return null;
        }
        // is a map
        if ((this._owner as Map).getBaseLayer) {
            return this._owner as Map;
        }
        return (this._owner as Geometry).getMap();
    }

    //@internal
    _collides() {
        const map = this.getMap();
        if (!map) {
            return this;
        }
        map._addUI(this);
        map._insertUICollidesQueue();
        return this;
    }

    //@internal
    _collidesEffect(show: boolean) {
        const dom = this.getDOM();
        if (!dom) {
            return this;
        }
        const visibility = show ? 'visible' : 'hidden';
        dom.style.visibility = visibility;
        if (!dom.classList || !dom.classList.add) {
            return this;
        }
        if (!this.options['collisionFadeIn']) {
            return this;
        }
        const classList = dom.classList;
        const className = 'mtk-ui-fadein';
        const hasClass = classList.contains(className);
        if (show && !hasClass) {
            dom.classList.add(className);
        } else if (!show && hasClass) {
            dom.classList.remove(className);
        }
        return this;
    }

    /**
     * Show the UI Component, if it is a global single one, it will close previous one.
     * @param {Coordinate} [coordinate=null] - coordinate to show, default is owner's center
     * @return {ui.UIComponent} this
     * @fires ui.UIComponent#showstart
     * @fires ui.UIComponent#showend
     */
    show(coordinate: Coordinate) {
        const map = this.getMap();
        if (!map) {
            return this;
        }
        this.options['visible'] = true;

        coordinate = coordinate || this._coordinate || this._owner.getCenter();
        if (!(coordinate instanceof Coordinate)) {
            coordinate = new Coordinate(coordinate);
        }

        const visible = this.isVisible();

        /**
         * showstart event.
         *
         * @event ui.UIComponent#showstart
         * @type {Object}
         * @property {String} type - showstart
         * @property {ui.UIComponent} target - UIComponent
         */
        if (!this._showBySymbolChange) {
            this.fire('showstart');
        }
        const container = this._getUIContainer();
        this._coordinate = coordinate;
        //when single will off map events
        this._removePrevDOM();
        if (!this._mapEventsOn) {
            this._switchMapEvents('on');
        }
        const dom = this.__uiDOM = this.buildOn();
        dom['eventsPropagation'] = this.options['eventsPropagation'];
        this._observerDomSize(dom);
        const zIndex = this.options.zIndex;
        if (!dom) {
            /**
             * showend event.
             *
             * @event ui.UIComponent#showend
             * @type {Object}
             * @property {String} type - showend
             * @property {ui.UIComponent} target - UIComponent
             */
            if (!this._showBySymbolChange) {
                this.fire('showend');
            }
            this._collides();
            this.setZIndex(zIndex);
            return this;
        }

        this._measureSize(dom);

        if (this._singleton()) {
            (dom as any)._uiComponent = this;
            map[this._uiDomKey()] = dom;
        }

        this._setPosition();

        dom.style[TRANSITION as string] = null;

        container.appendChild(dom);


        const anim = this._getAnimation();

        if (visible) {
            anim.ok = false;
        }

        if (anim.ok) {
            if (anim.fade) {
                dom.style.opacity = 0 + '';
            }
            if (anim.scale) {
                if ((this as any).getTransformOrigin) {
                    const origin = (this as any).getTransformOrigin();
                    dom.style[TRANSFORMORIGIN as string] = origin;
                }
                dom.style[TRANSFORM as string] = this._toCSSTranslate(this._pos) + ' scale(0)';
            }
        }
        //not support zoom filter show dom
        if (!this.isSupportZoomFilter()) {
            dom.style.display = '';
        }

        if (this.options['eventsToStop']) {
            on(dom, this.options['eventsToStop'], stopPropagation);
        }

        // //autoPan
        // if (this.options['autoPan']) {
        //     this._autoPan();
        // }

        const transition = anim.transition;
        if (anim.ok && transition) {
            /* eslint-disable no-unused-expressions */
            // trigger transition
            dom.offsetHeight;
            /* eslint-enable no-unused-expressions */
            if (transition) {
                dom.style[TRANSITION as string] = transition;
            }
            if (anim.fade) {
                dom.style.opacity = 1 + '';
            }
            if (anim.scale) {
                dom.style[TRANSFORM] = this._toCSSTranslate(this._pos) + ' scale(1)';
            }
        }
        if (!this._showBySymbolChange) {
            this.fire('showend');
        }
        this._collides();
        //autoPan
        clearTimeout(this._autoPanId);
        if (this.options['autoPan']) {
            this._autoPanId = setTimeout(() => {
                this._autoPan();
            }, 32);
        }
        this.setZIndex(zIndex);
        return this;
    }

    /**
     * Hide the UI Component.
     * @return {ui.UIComponent} this
     * @fires ui.UIComponent#hide
     */
    hide() {
        if (!this.getDOM()) {
            return this;
        }
        if (this._onDomMouseout) {
            this._onDomMouseout();
        }
        this.options['visible'] = false;
        const anim = this._getAnimation(),
            dom = this.getDOM();
        if (!this.options['animationOnHide']) {
            anim.ok = false;
        }
        if (!anim.ok) {
            dom.style.display = 'none';
            /**
           * hide event.
           *
           * @event ui.UIComponent#hide
           * @type {Object}
           * @property {String} type - hide
           * @property {ui.UIComponent} target - UIComponent
           */
            this.fire('hide');
        } else {
            /* eslint-disable no-unused-expressions */
            dom.offsetHeight;
            /* eslint-enable no-unused-expressions */
            dom.style[TRANSITION] = anim.transition;
            setTimeout(() => {
                dom.style.display = 'none';
                this.fire('hide');
            }, this.options['animationDuration']);
        }
        if (anim.fade) {
            dom.style.opacity = 0 + '';
        }
        if (anim.scale) {
            dom.style[TRANSFORM] = this._toCSSTranslate(this._pos) + ' scale(0)';
        }
        //remove map bind events
        this._switchMapEvents('off');
        this._collides();
        return this;
    }

    /**
     * Decide whether the ui component is open
     * @returns {Boolean} true|false
     */
    isVisible() {
        if (!this.options['visible']) {
            return false;
        }
        const dom = this.getDOM();
        return this.getMap() && dom && dom.parentNode && dom.style.display !== 'none';
    }

    /**
     * Remove the UI Component
     * @return {ui.UIComponent} this
     * @fires ui.UIComponent#hide
     * @fires ui.UIComponent#remove
     */
    remove() {
        delete this._mapEventsOn;
        if (!this._owner) {
            return this;
        }
        const map = this.getMap();
        if (map) {
            map._removeUI(this);
        }
        this.hide();
        this._switchEvents('off');
        if (this.onRemove) {
            this.onRemove();
        }
        if (!this._singleton() && this.__uiDOM) {
            this._removePrevDOM();
        }
        delete this._owner;
        /**
         * remove event.
         *
         * @event ui.UIComponent#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {ui.UIComponent} target - UIComponent
         */
        this.fire('remove');
        this._collides();
        return this;
    }

    /**
     * Get pixel size of the UI Component.
     * @return {Size} size
     */
    getSize() {
        if (this._domContentRect && this._size) {
            //update size by resizeObserver result
            this._size.width = this._domContentRect.width;
            this._size.height = this._domContentRect.height;
        }
        if (this._size) {
            return this._size.copy();
        } else {
            return null;
        }
    }

    getOwner() {
        return this._owner;
    }

    /**
     * get Dom Node
     * @returns {HTMLDivElement} dom|null
     */
    getDOM() {
        return this.__uiDOM;
    }

    /**
     * set Dom Node zIndex
     *
     */
    setZIndex(zIndex: number) {
        if (!isNumber(zIndex)) {
            return this;
        }
        const dom = this.getDOM();
        if (!dom) {
            return this;
        }
        dom.style.zIndex = zIndex + '';
        if (zIndex !== this.options.zIndex) {
            this.options.zIndex = zIndex;
        }
        return this;
    }

    //@internal
    _roundPoint(point: Point) {
        if (this.options.roundPoint) {
            point = point._round();
        }
        return point;
    }

    getPosition() {
        if (!this.getMap()) {
            return null;
        }
        const p = this._roundPoint(this._getViewPoint());
        if ((this as any).getOffset) {
            const o = this._roundPoint((this as any).getOffset());
            if (o) {
                p._add(o);
            }
        }
        return p;
    }

    //@internal
    _getAnimation() {
        const anim = {
            'fade': false,
            'scale': false,
            'ok': false,
            'transition': ''
        };
        const animations = this.options['animation'] ? this.options['animation'].split(',') : [];
        for (let i = 0; i < animations.length; i++) {
            const trimed = trim(animations[i]);
            if (trimed === 'fade') {
                anim.fade = true;
            } else if (trimed === 'scale') {
                anim.scale = true;
            }
        }
        let transition = null;
        if (anim.fade) {
            transition = 'opacity ' + this.options['animationDuration'] + 'ms';
        }
        if (anim.scale) {
            transition = transition ? transition + ',' : '';
            transition += TRANSFORM + ' ' + this.options['animationDuration'] + 'ms';
        }
        anim.transition = transition;
        anim.ok = (transition !== null);
        return anim;
    }

    //@internal
    _getViewPoint() {
        let altitude = 0;
        //后期有了地形后，拿到的数据会带altitude，这里适配下,以后点击地图拿到的数据应该带海拔的（lng,lat,alt）
        const coordinates = this._coordinate || {};
        if (isNumber((coordinates as Coordinate).z)) {
            altitude = (coordinates as Coordinate).z;
        } else if (this._owner && (this._owner as Geometry).getAltitude) {
            altitude = (this._owner as Geometry).getAltitude() as number || 0;
            //altitude is array from linestring ,polygon etc when coordinates carry z value [[x,y,z],[x,y,z],....];
            if (!isNumber(altitude)) {
                altitude = 0;
            }
        }
        if (this._owner.getLayer) {
            const layer = (this._owner as Geometry).getLayer();
            //VectorLayer
            if (layer && (layer as any).isVectorLayer) {
                altitude = (this._owner as Geometry)._getAltitude() as number || 0;
                if (!isNumber(altitude)) {
                    altitude = 0;
                }
            }
        }
        const alt = this._meterToPoint(this._coordinate, altitude);
        return this.getMap().coordToViewPoint(this._coordinate, undefined, alt)
            ._add(this.options['dx'], this.options['dy']);
    }

    //@internal
    _meterToPoint(center: Coordinate, altitude: number) {
        return altitude;
        // const map = this.getMap();
        // return map.altitudeToPoint(altitude, map._getResolution()) * sign(altitude);
    }

    //@internal
    _autoPan() {
        const map = this.getMap(),
            dom = this.getDOM();
        if (!dom || !map || map.isMoving()) {
            return;
        }
        const point = this._getViewPoint()._round();
        const mapWidth = map.width;
        const mapHeight = map.height;
        const mapContainer = map.getContainer();
        if (dom && mapContainer && dom.getBoundingClientRect) {
            const mapRect = mapContainer.getBoundingClientRect();
            //map left ,top value
            const mapLeft = mapRect.left;
            const mapTop = mapRect.top;
            const margin = 50;
            const rect = dom.getBoundingClientRect();
            let offsetX = 0, offsetY = 0;

            let { left, right, top, bottom } = rect;
            const { width, height } = rect;
            //sub map left,top,Position values relative to the map should be used
            left -= mapLeft;
            right -= mapLeft;
            top -= mapTop;
            bottom -= mapTop;

            if (width > 0 && height > 0) {
                if (left < margin) {
                    offsetX = margin - left;
                }
                if (offsetX === 0 && (right + margin) > mapWidth) {
                    offsetX = -((right + margin) - mapWidth);
                }
                if (top < margin) {
                    offsetY = margin - top;
                }
                if (offsetY === 0 && (bottom + margin) > mapHeight) {
                    offsetY = -((bottom + margin) - mapHeight);
                }
                if (offsetX !== 0 || offsetY !== 0) {
                    const pitch = map.getPitch();
                    if (pitch > 40 && offsetY !== 0 && this._coordinate) {
                        map.animateTo({ center: this._coordinate }, { duration: map.options['panAnimationDuration'] });
                    } else {
                        map.panBy([Math.ceil(offsetX), Math.ceil(offsetY)]);
                    }
                }
                return;
            }
        }

        const containerPoint0 = map.viewPointToContainerPoint(point);
        const offset = (this as any).getOffset();
        const containerPoint = containerPoint0.add(offset);

        const prjCoord = map.viewPointToPrj(point);
        const domWidth = parseInt(dom.clientWidth + '');
        const domHeight = parseInt(dom.clientHeight + '');
        const margin = 50;
        let left = 0,
            top = 0;
        if ((containerPoint.x) < 0) {
            left = -containerPoint.x + margin;
        } else if ((containerPoint.x + domWidth) > mapWidth) {
            left = -((containerPoint.x + domWidth) - mapWidth) - margin;
        }
        if (containerPoint.y - domHeight < 0) {
            top = Math.abs(containerPoint.y - domHeight) + margin;
        } else if (containerPoint.y + domHeight > mapHeight) {
            top = (mapHeight - (containerPoint.y + domHeight)) - margin;
        }
        //if dom width > map width
        if (domWidth >= mapWidth) {
            left = mapWidth / 2 - containerPoint0.x;
        }

        if (top !== 0 || left !== 0) {
            const newContainerPoint = containerPoint0.add(left, top);
            const t = map._containerPointToPoint(newContainerPoint)._sub(map._prjToPoint(map._getPrjCenter()));
            const target = map._pointToPrj(map._prjToPoint(prjCoord).sub(t));
            // map.panBy(new Point(left, top), { 'duration': this.options['autoPanDuration'] });
            map._panAnimation(target);
        }
    }

    /**
     * Measure dom's size
     * @param  {HTMLElement} dom - element to measure
     * @return {Size} size
     * @private
     */
    //@internal
    _measureSize(dom: HTMLElement) {
        const container = this._getUIContainer();
        dom.style.position = 'absolute';
        // dom.style.left = -99999 + 'px';
        const anchor = dom.style.bottom ? 'bottom' : 'top';
        // dom.style[anchor] = -99999 + 'px';
        dom.style.display = '';
        container.appendChild(dom);
        if (dom.getBoundingClientRect) {
            const rect = dom.getBoundingClientRect();
            this._size = new Size(rect.width, rect.height);
        } else {
            this._size = new Size(dom.clientWidth, dom.clientHeight);
        }
        dom.style.display = 'none';
        dom.style.left = '0px';
        dom.style[anchor] = '0px';
        return this._size;
    }

    /**
     * Remove previous UI DOM if it has.
     *
     * @private
     */
    //@internal
    _removePrevDOM() {
        if (this.onDomRemove) {
            this.onDomRemove();
        }
        const eventsToStop = this.options['eventsToStop'];
        if (this._singleton()) {
            const map = this.getMap(),
                key = this._uiDomKey();
            if (map[key]) {
                if (eventsToStop) {
                    off(map[key], eventsToStop, stopPropagation);
                }
                const uiComponent = map[key]._uiComponent;
                //fire pre uicomponent(when it isVisible) hide event
                if (uiComponent && uiComponent !== this && uiComponent.isVisible()) {
                    uiComponent.fire('hide');
                }
                removeDomNode(map[key]);
                //remove map bind events
                if (uiComponent && !(this as any).hideDom) {
                    uiComponent._switchMapEvents('off');
                }
                delete map[key];
            }
            delete this.__uiDOM;
        } else if (this.__uiDOM) {
            if (eventsToStop) {
                off(this.__uiDOM, eventsToStop, stopPropagation);
            }
            removeDomNode(this.__uiDOM);
            delete this.__uiDOM;
        }
        if (this._resizeObserver) {
            //dispose resizeObserver
            this._resizeObserver.disconnect();
            delete this._resizeObserver;
            delete this._domContentRect;
        }
    }

    /**
     * generate the cache key to store the singletong UI DOM
     * @private
     * @return {String} cache key
     */
    //@internal
    _uiDomKey() {
        return '__ui_' + this._getClassName();
    }

    //@internal
    _singleton() {
        return this.options['single'];
    }

    //@internal
    _getUIContainer() {
        return this.getMap().getPanels()['ui'];
    }

    //@internal
    _getClassName() {
        return 'UIComponent';
    }

    //@internal
    _switchMapEvents(to: string) {
        const map = this.getMap();
        if (!map) {
            return;
        }
        this._mapEventsOn = (to === 'on');
        const events = this._getDefaultEvents();
        if (this.getEvents) {
            extend(events, this.getEvents());
        }
        if (events) {
            for (const p in events) {
                if (events.hasOwnProperty(p)) {
                    map[to](p, events[p], this);
                }
            }
        }
    }

    //@internal
    _switchEvents(to: string) {
        //At the beginning,not bind map events,bind evetns when show
        // this._switchMapEvents(to);
        const ownerEvents = this._getOwnerEvents();
        if (this._owner) {
            for (const p in ownerEvents) {
                if (ownerEvents.hasOwnProperty(p)) {
                    this._owner[to](p, ownerEvents[p], this);
                }
            }
        }
    }

    //@internal
    _getDefaultEvents() {
        return {
            'zooming rotate pitch': this.onEvent,
            'zoomend': this.onZoomEnd,
            'moving': this.onMoving,
            'moveend': this.onMoving,
            'resize': this.onResize
        };
    }

    //@internal
    _getOwnerEvents() {
        const events: { [key: string]: (...args) => void } = {};
        if (this._owner && (this._owner instanceof Geometry)) {
            events.positionchange = this.onGeometryPositionChange;
            events.symbolchange = this._updatePosition;
        }
        if (this.getOwnerEvents) {
            extend(events, this.getOwnerEvents());
        }
        return events;
    }

    onGeometryPositionChange(param) {
        if (this._owner && this.isVisible()) {
            this._showBySymbolChange = true;
            const target = param.target;
            const center = target.getCenter();
            if (target._getAltitude) {
                const altitude = target._getAltitude();
                if (isNumber(altitude)) {
                    center.z = altitude;
                }
            }
            this.show(center);
            delete this._showBySymbolChange;
        }
    }

    onMoving() {
        if (this.isVisible() && this.getMap().isTransforming()) {
            this._updatePosition();
        }
    }

    onEvent() {
        if (this.isVisible()) {
            this._updatePosition();
        }
    }

    onZoomEnd() {
        if (this.isVisible()) {
            // when zoomend, map container is reset, position should be updated in current frame
            this._setPosition();
        }
    }

    onResize() {
        if (this.isVisible()) {
            //when map resize , update position
            this._setPosition();
        }
    }

    onDomSizeChange() {
        if (this.isVisible()) {
            //when dom resize , update position
            this._setPosition();
            this._collides();
        }
    }

    //@internal
    _updatePosition() {
        if (!this.getMap()) {
            return this;
        }
        // update position in the next frame to sync with layers
        const renderer = this.getMap()._getRenderer();
        renderer.callInNextFrame(this._setPosition.bind(this));
        return this;
    }

    //@internal
    _setPosition() {
        const dom = this.getDOM();
        if (!dom) return;
        dom.style[TRANSITION] = null;
        const p = this.getPosition();
        this._pos = p;
        dom.style[TRANSFORM] = this._toCSSTranslate(p) + ' scale(1)';
    }

    //@internal
    _toCSSTranslate(p: Point) {
        if (!p) {
            return '';
        }
        if (Browser.any3d) {
            const map = this.getMap(),
                bearing = map ? map.getBearing() : 0,
                pitch = map ? map.getPitch() : 0;
            let r = '';
            if (this.options['pitchWithMap'] && pitch) {
                r += ` rotateX(${Math.round(pitch)}deg)`;
            }
            if (this.options['rotateWithMap'] && bearing) {
                r += ` rotateZ(${Math.round(-bearing)}deg)`;
            }
            return 'translate3d(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px, 0px)' + r;
        } else {
            return 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px)';
        }
    }

    //@internal
    _observerDomSize(dom: HTMLElement) {
        if (!dom || !Browser.resizeObserver || this._resizeObserver) {
            return this;
        }
        this._resizeObserver = new ResizeObserver((entries) => {
            if (entries.length) {
                const borderBoxSize = entries[0].borderBoxSize;
                if (borderBoxSize && borderBoxSize.length) {
                    this._domContentRect = {
                        width: borderBoxSize[0].inlineSize,
                        height: borderBoxSize[0].blockSize
                    };
                } else {
                    this._domContentRect = entries[0].contentRect;
                }
            } else {
                delete this._domContentRect;
            }
            //update dom position
            if (this.onDomSizeChange) {
                this.onDomSizeChange();
            }
        });
        this._resizeObserver.observe(dom);
        return this;
    }

    isSupportZoomFilter() {
        return false;
    }

    onConfig() {
        this._updatePosition();
        return this;
    }

    /*
     *
     * @param {Geometry||ui.UIMarker} owner
     * @return {Boolean}
     */
    static isSupport(owner: Geometry | Map) {
        if (owner && isFunction(owner.on) && isFunction(owner.off) && isFunction(owner.getCenter)) {
            return true;
        }
        return false;
    }

    //@internal
    _bindDomEvents(dom: HTMLElement, to: string) {
        if (!dom) {
            return;
        }
        const events = this._getDomEvents() || {};
        const bindEvent = to === 'on' ? on : off;
        for (const eventName in events) {
            if (to === 'on') {
                //remove old  handler
                off(dom, eventName, events[eventName]);
            }
            bindEvent(dom, eventName, events[eventName], this);
        }
    }

    //@internal
    _getDomEvents() {
        return {
            'mouseover': this._onDomMouseover,
            'mouseout': this._onDomMouseout
        };
    }

    //@internal
    _configMapPreventWheelScroll(preventWheelScroll: boolean) {
        const map = this.getMap();
        if (!map) {
            return;
        }
        if (this.options.eventsPropagation) {
            return;
        }
        map.options['preventWheelScroll'] = preventWheelScroll;
    }

    // eslint-disable-next-line no-unused-vars
    //@internal
    _onDomMouseover() {
        this._configMapPreventWheelScroll(false);
    }

    // eslint-disable-next-line no-unused-vars
    //@internal
    _onDomMouseout() {
        this._configMapPreventWheelScroll(true);
    }
}

UIComponent.mergeOptions(options);

export default UIComponent;

export type UIComponentOptionsType = {
    eventsPropagation?: boolean;
    eventsToStop?: string;
    dx?: number;
    dy?: number;
    autoPan?: boolean;
    autoPanDuration?: number;
    single?: boolean;
    animation?: string;
    animationOnHide?: boolean;
    animationDuration?: number;
    pitchWithMap?: boolean;
    rotateWithMap?: boolean;
    visible?: boolean;
    roundPoint?: boolean;
    collision?: boolean;
    collisionBufferSize?: number;
    collisionWeight?: number;
    collisionFadeIn?: boolean;
    zIndex?: number;
    cssName?: string | Array<string>;
}
