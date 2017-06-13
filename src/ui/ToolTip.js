import { createEl } from 'core/util/dom';
import { isString } from 'core/util';
import { Geometry } from 'geometry';
import UIComponent from './UI';


/**
 * @property {Object} options
 * @property {Number}  [options.width=300]     - default width
 * @property {String}  [options.animation='fade']     - default fade, scale | fade,scale are an alternative to set
 * @memberOf ui.ToolTip
 * @instance
 */
const options = {
    'width': 150,
    'animation': 'fade',
    'cssclass': ''
};
/**
 * @classdesc
 * Class for tooltip, a tooltip used for showing some useful infomation attached to geometries on the map.
 * @category ui
 * @extends ui.UIComponent
 * @param {Object} options - options defined in [ToolTip]{@link tooltip#options}
 * @member of ui
 */
class ToolTip extends UIComponent {
    // TODO:obtain class in super
    _getClassName() {
        return 'ToolTip';
    }
    constructor(info) {
        super(options);
        if (isString(info)) {
            this._content = info;
        }
    }

    /**
   * Adds the UI Component to a geometry
   * @param {Geometry} owner - geometry to add.
   * @returns {UIComponent} this
   * @fires UIComponent#add
   */
    addTo(owner) {
        if (owner instanceof Geometry) {
            owner._tooltip = this;
            owner.on('mouseover', this.onMouseOver, this);
            owner.on('mouseout', this.onMouseOut, this);
            return super.addTo(owner);
        } else {
            throw new Error('Invalid Geometry when add a tooltip.');
        }
    }

    /*
    * set the ToolTip's content's css class name.
    * @param {String} css class name - set for ToolTip's content.
    */
    setStyle(cssclassName) {
        this._cssclassName = cssclassName;
    }
    /**
    * get the UI Component's content
    * @returns {String} tooltip's content
    */
    getContent() {
        return this._content;
    }

    /**
    * get the ToolTip's dom content
    * @returns {Object} ToolTip's dom content
    */
    getDom() {
        return this._dom;
    }

    buildOn() {
        const dom = createEl('div');
        dom.className = 'maptalks-msgBox';
        dom.id = 'tipDiv';
        dom.style.width = options.width + 'px';
        //default css name is 'maptalks-msgContent'
        this._cssclassName = this._cssclassName || 'maptalks-msgContent';
        const content = `<div class="${this._cssclassName}">${this._content}</div>`;
        dom.innerHTML = content;
        this._dom = dom;
        return dom;
    }

    onMouseOver(e) {
        if (!this.isVisible()) {
            const map = e.target.getMap();
            const zoom = map.getZoom();
            const mousescreen = map.coordinateToPoint(e.coordinate, zoom);
            const tipPosition = new maptalks.Point(mousescreen.x + 25, mousescreen.y - 45);
            this.show(map.pointToCoordinate(tipPosition, zoom));
        }
    }

    onMouseOut() {
        if (this.isVisible()) {
            this.hide();
        }
    }

    /**
    * remove the tooltip, this method will be called by 'this.remove()'
    */
    onRemove() {
        if (this._owner) {
            this._owner.off('mouseover', this.onMouseOver, this);
            this._owner.off('mouseout', this.onMouseOut, this);
            delete this._owner._tooltip;
        }
    }
}

ToolTip.mergeOptions(options);

export default ToolTip;
