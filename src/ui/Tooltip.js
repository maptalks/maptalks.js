import { createEl } from 'core/util/dom';
import { isString } from 'core/util';
import { Geometry } from 'geometry';
import UIComponent from './UI';


/**
 * @property {Object} options
 * @property {Boolean} [options.autoPan=true]  - set it to false if you don't want the map to do panning animation to fit the opened window.
 * @property {Number}  [options.width=300]     - default width
 * @property {Number}  [options.minHeight=120] - minimun height
 * @property {Boolean} [options.custom=false]  - set it to true if you want a customized tooltip, customized html codes or a HTMLElement is set to content.
 * @property {String}  [options.title=null]    - title of the tooltip.
 * @property {String|HTMLElement}  options.content - content of the tooltip.
 * @memberOf ui.InfoWindow
 * @instance
 */
const options = {
    'width': 150,
    'minHeight': 30,
    'custom': false
};
/**
 * @classdesc
 * Class for tooltip, a tooltip used for showing some useful infomation attached to geometries on the map.
 * @category ui
 * @extends ui.UIComponent
 * @param {Object} options - options defined in [tooltip]{@link tooltip#options}
 * @memberOf ui
 */
class ToolTip extends UIComponent {
    // TODO:obtain class in super
    _getClassName() {
        return 'ToolTip';
    }
    constructor(info) {
        super(options);
        if (isString(info)) {
            this._infomation = info;
        }
    }
    /**
   * set the toolTip to a geometry or a map,and it needs some infomation to show
   * @param {Geometry} owner - geometry to addto.
   * @param {String} owner - information  to show in toolTip.
   * @returns {UIComponent} this
    **/
    addTo(geometry) {
        this._addTo(geometry);
    }
    /**
   * Adds the UI Component to a geometry or a map
   * @param {Geometry|Map} owner - geometry or map to addto.
   * @returns {UIComponent} this
   * @fires UIComponent#add
   */
    _addTo(owner) {
        if (owner instanceof Geometry) {
            owner._tooltip = this;
            const mouseHandler = function (e) {
                switch (e.type) {
                case 'mouseover':
                    if (!this.isVisible()) {
                        const map = e.target.getMap();
                        const zoom = map.getZoom();
                        const mousescreen = map.coordinateToPoint(e.coordinate, zoom);
                        const tipPosition = new maptalks.Point(mousescreen.x + 25, mousescreen.y - 45);
                        this.show(map.pointToCoordinate(tipPosition, zoom));
                    }
                    break;
                case 'mouseout':
                    this.hide();
                    break;
                default:
                    break;
                }
            };
            this._mouseHandler = mouseHandler;
            owner.on('mouseover mouseout', mouseHandler.bind(this));
        }
        return super.addTo(owner);
    }

    /**
    * get the UI Component's content
    * @returns {String} tooltip's content
    */
    getContent() {
        return this._infomation;
    }

    buildOn() {
        const dom = createEl('div');
        dom.className = 'maptalks-msgBox';
        dom.id = 'tipDiv';
        dom.style.width = options.width + 'px';
        const content = '<div class="maptalks-msgContent">' + this. _infomation + '</div>';
        dom.innerHTML = content;
        return dom;
    }

    /**
   * remove the tooltip effect
   * @returns {UIComponent} this
   */
    remove() {
        this.onRemove = function () {
            if (this._owner) {
                this._owner.off('mouseover mouseout', this._mouseHandler);
                delete this._owner._tooltip;
                delete this._owner;
                delete this._mouseHandler;
            }
        };
        super.remove();
        return this;
    }
}

ToolTip.mergeOptions(options);

export default ToolTip;
