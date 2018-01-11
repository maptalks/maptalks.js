import { createEl } from '../core/util/dom';
import { Geometry } from '../geometry';
import UIComponent from './UIComponent';


/**
 * @property {Object} options
 * @property {Number}  [options.width=0]     - default width
 * @property {Number}  [options.height=0]     - default height
 * @property {String}  [options.animation='fade']     - default fade, scale | fade,scale are an alternative to set
 * @property {String}  [options.cssName=maptalks-tooltip]    - tooltip's css class name
 * @memberOf ui.ToolTip
 * @instance
 */
const options = {
    'width': 0,
    'height': 0,
    'animation': 'fade',
    'cssName': 'maptalks-tooltip'
};
/**
 * @classdesc
 * Class for tooltip, a tooltip used for showing some useful infomation attached to geometries on the map.
 * @category ui
 * @extends ui.UIComponent
 * @memberOf ui
 */
class ToolTip extends UIComponent {
    // TODO:obtain class in super
    _getClassName() {
        return 'ToolTip';
    }

    /**
     * @param {String} content         - content of tooltip
     * @param {Object} [options=null]  - options defined in [ToolTip]{@link ToolTip#options}
     */
    constructor(content, options = {}) {
        super(options);
        this._content = content;
    }

    /**
     * Adds the UI Component to a geometry
     * @param {Geometry} owner - geometry to add.
     * @returns {UIComponent} this
     * @fires UIComponent#add
     */
    addTo(owner) {
        if (owner instanceof Geometry) {
            owner.on('mouseover', this.onMouseOver, this);
            owner.on('mouseout', this.onMouseOut, this);
            return super.addTo(owner);
        } else {
            throw new Error('Invalid geometry the tooltip is added to.');
        }
    }

    /**
     * set ToolTip's content's css class name.
     * @param {String} css class name - set for ToolTip's content.
     */
    setStyle(cssName) {
        this.options.cssName = cssName;
        return this;
    }

    /**
     * get ToolTip's  content's css class name
     * @returns {String} css class name - set for ToolTip's content.
     */
    getStyle() {
        return this.options.cssName;
    }

    /**
     * get the UI Component's content
     * @returns {String} tooltip's content
     */
    getContent() {
        return this._content;
    }

    buildOn() {
        const dom = createEl('div');
        if (options.height) {
            dom.style.height = options.height + 'px';
        }
        if (options.width) {
            dom.style.width = options.width + 'px';
        }
        const cssName = this.options.cssName;
        if (!cssName && options.height) {
            dom.style.lineHeight = options.height + 'px';
        }
        dom.innerHTML = `<div class="${cssName}">${this._content}</div>`;
        return dom;
    }

    onMouseOver(e) {
        if (!this.isVisible()) {
            const map = this.getMap();
            this.show(map.locateByPoint(e.coordinate, -5, 25));
        }
    }

    onMouseOut() {
        if (this.isVisible()) {
            this._removePrevDOM();
        }
    }

    /**
     * remove the tooltip, this method will be called by 'this.remove()'
     */
    onRemove() {
        if (this._owner) {
            this._owner.off('mouseover', this.onMouseOver, this);
            this._owner.off('mouseout', this.onMouseOut, this);
        }
    }
}

ToolTip.mergeOptions(options);

export default ToolTip;
