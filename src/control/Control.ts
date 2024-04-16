import { extend, isNil, isNumber, isString } from '../core/util';
import { createEl, setStyle, removeDomNode } from '../core/util/dom';
import Eventable from '../core/Eventable';
import Class from '../core/Class';
import Point from '../geo/Point';
import Map from '../map/Map';

/**
 * Base class for all the map controls, you can extend it to build your own customized Control.
 * It is abstract and not intended to be instantiated.
 * @category control
 * @memberOf control
 * @abstract
 * @extends Class
 * @mixes Eventable
 */
abstract class Control extends Eventable(Class) {


    _map: Map;
    __ctrlContainer: HTMLElement;
    _controlDom: HTMLElement;
    options: ControlOptionsType;
    static positions: { [key: string]: PositionType };

    /**
     * Methods needs to implement:  <br>
     *  <br>
     * 1. Method to create UI's Dom element  <br>
     * function buildOn : HTMLElement  <br>
     *  <br>
     * 2. Optional, a callback when the control is added.  <br>
     * function onAdd : void  <br>
     * 3. Optional, a callback when the control is removed.  <br>
     * function onRemove : void  <br>
     *  <br>
     * @param  {Object} [options=null] configuration options
     */
    constructor(options: ControlOptionsType) {
        if (options && options['position'] && !isString(options['position'])) {
            options['position'] = extend({}, options['position']);
        }
        super(options);
    }

    onAdd() {

    }

    onRemove() {

    }

    abstract buildOn(map?: Map): HTMLElement;

    /**
     * Adds the control to a map.
     * @param {Map} map
     * @returns {control.Control} this
     * @fires control.Control#add
     */
    addTo(map: Map) {
        this.remove();
        if (!map.options['control']) {
            return this;
        }
        this._map = map;
        const controlContainer = map.getPanels().control;
        this.__ctrlContainer = createEl('div');
        setStyle(this.__ctrlContainer, 'position:absolute;overflow:visible;');
        // on(this.__ctrlContainer, 'mousedown mousemove click dblclick contextmenu', stopPropagation)
        this.update();
        controlContainer.appendChild(this.__ctrlContainer);
        if (this.onAdd) {
            this.onAdd();
        }
        /**
         * add event.
         *
         * @event control.Control#add
         * @type {Object}
         * @property {String} type - add
         * @property {control.Control} target - the control instance
         */
        this.fire('add', {
            'dom': controlContainer
        });
        return this;
    }

    /**
     * update control container
     * @return {control.Control} this
     */
    update() {
        this.__ctrlContainer.innerHTML = '';
        this._controlDom = this.buildOn(this.getMap());
        if (this._controlDom) {
            this._updatePosition();
            this.__ctrlContainer.appendChild(this._controlDom);
        }
        return this;
    }

    /**
     * Get the map that the control is added to.
     * @return {Map}
     */
    getMap() {
        return this._map;
    }

    /**
     * Get the position of the control
     * @return {Object}
     */
    getPosition(): PositionType {
        return extend({}, this._parse(this.options['position']));
    }

    /**
     * update the control's position
     * @param {String|Object} position - can be one of 'top-left', 'top-right', 'bottom-left', 'bottom-right' or a position object like {'top': 40,'left': 60}
     * @return {control.Control} this
     * @fires control.Control#positionchange
     */
    setPosition(position: ControlPositionType) {
        if (isString(position)) {
            this.options['position'] = position;
        } else {
            this.options['position'] = extend({}, position);
        }
        this._updatePosition();
        return this;
    }

    /**
     * Get the container point of the control.
     * @return {Point}
     */
    getContainerPoint(): Point {
        const position = this.getPosition();

        const size = this.getMap().getSize();
        let x, y;
        if (!isNil(position['left'])) {
            x = parseInt(position['left'] + '');
        } else if (!isNil(position['right'])) {
            x = size['width'] - parseInt(position['right'] + '');
        }
        if (!isNil(position['top'])) {
            y = parseInt(position['top'] + '');
        } else if (!isNil(position['bottom'])) {
            y = size['height'] - parseInt(position['bottom'] + '');
        }
        return new Point(x, y);
    }

    /**
     * Get the control's container.
     * Container is a div element wrapping the control's dom and decides the control's position and display.
     * @return {HTMLElement}
     */
    getContainer() {
        return this.__ctrlContainer;
    }

    /**
     * Get html dom element of the control
     * @return {HTMLElement}
     */
    getDOM() {
        return this._controlDom;
    }

    /**
     * Show
     * @return {control.Control} this
     */
    show() {
        this.__ctrlContainer.style.display = '';
        return this;
    }

    /**
     * Hide
     * @return {control.Control} this
     */
    hide() {
        this.__ctrlContainer.style.display = 'none';
        return this;
    }

    /**
     * Whether the control is visible
     * @return {Boolean}
     */
    isVisible() {
        return (this.__ctrlContainer && this.__ctrlContainer.style.display === '');
    }

    /**
     * Remove itself from the map
     * @return {control.Control} this
     * @fires control.Control#remove
     */
    remove() {
        if (!this._map) {
            return this;
        }
        removeDomNode(this.__ctrlContainer);
        if (this.onRemove) {
            this.onRemove();
        }
        delete this._map;
        delete this.__ctrlContainer;
        delete this._controlDom;
        /**
         * remove event.
         *
         * @event control.Control#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {control.Control} target - the control instance
         */
        this.fire('remove');
        return this;
    }

    _parse(position: ControlPositionType): PositionType {
        let p = position;
        if (isString(position)) {
            p = Control['positions'][p as string];
        }
        return p as PositionType;
    }

    _updatePosition() {
        let position = this.getPosition();
        if (!position) {
            //default one
            position = {
                'top': 20,
                'left': 20
            };
        }
        for (const p in position) {
            if (position.hasOwnProperty(p)) {
                let v = position[p] || 0;
                if (isNumber(v)) {
                    (v as any) += 'px';
                }
                this.__ctrlContainer.style[p] = v;
            }
        }
        /**
         * Control's position update event.
         *
         * @event control.Control#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {control.Control} target - the control instance
         * @property {Object} position - Position of the control, eg:{"top" : 100, "left" : 50}
         */
        this.fire('positionchange', {
            'position': extend({}, position)
        });
    }

}

Control.positions = {
    'top-left': {
        'top': 20,
        'left': 20
    },
    'top-right': {
        'top': 20,
        'right': 20
    },
    'bottom-left': {
        'bottom': 20,
        'left': 20
    },
    'bottom-right': {
        'bottom': 20,
        'right': 20
    }
};

export type PositionType = {
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
};

export type ControlPositionType = string | PositionType;

export type ControlOptionsType = {
    position?: ControlPositionType
}

Map.mergeOptions({
    'control': true
});


declare module "./../map/Map" {
    interface Map {
        addControl(control: Control): this;
        removeControl(control: Control): this;
    }
}

Map.include(/** @lends Map.prototype */ {
    /**
     * Add a control on the map.
     * @param {control.Control} control - contorl to add
     * @return {Map} this
     */
    addControl: function (control: Control) {
        // if map container is a canvas, can't add control on it.
        if (this._containerDOM.getContext) {
            return this;
        }
        control.addTo(this);
        return this;
    },

    /**
     * Remove a control from the map.
     * @param {control.Control} control - control to remove
     * @return {Map} this
     */
    removeControl: function (control: Control) {
        if (!control || control.getMap() !== this) {
            return this;
        }
        control.remove();
        return this;
    }

});

export default Control;
