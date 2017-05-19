import { isString } from 'core/util';
import { createEl } from 'core/util/dom';
import Point from 'geo/Point';
import { Geometry, Marker } from 'geometry';
import UIComponent from './UI';


/**
 * @property {Object} defaults
 * @property {Boolean} [defaults.autoPan=true]  - set it to false if you don't want the map to do panning animation to fit the opened window.
 * @property {Number}  [defaults.width=300]     - default width
 * @property {Number}  [defaults.minHeight=120] - minimun height
 * @property {Boolean} [defaults.custom=false]  - set it to true if you want a customized infowindow, customized html codes or a HTMLElement is set to content.
 * @property {String}  [defaults.title=null]    - title of the infowindow.
 * @property {String|HTMLElement}  defaults.content - content of the infowindow.
 * @memberOf ui.InfoWindow
 * @instance
 */
const defaults = {
    'width': 150,
    'minHeight': 30,
    'custom': false,
    'title': null,
    'content': null
};
/**
 * @classdesc
 * Class for tooltips, a tooltips used for showing some useful infomation attached to geometries on the map.
 * @category ui
 * @extends ui.UIComponent
 * @param {Object} options - options defined in [tooltips]{@link tooltips#options}
 * @memberOf ui 
 */
class Tooltips extends UIComponent {
    // TODO:obtain class in super
    _getClassName() {
        return 'Tooltips';
    }

    /**
   * set the tooltips to a geometry or a map,and it needs some infomation to show
   * @param {Geometry} owner - geometry to addto.
   * @param {String} owner - information  to show in tooltips.
   * @returns {UIComponent} this
    **/
    setTo(geometry,info) {
        this._infomation = info;
        this._addTo(geometry);
    } 
    /**
   * Adds the UI Component to a geometry or a map
   * @param {Geometry|Map} owner - geometry or map to addto.
   * @returns {UIComponent} this
   * @fires UIComponent#add
   */
    _addTo(owner) {
        if(owner instanceof Geometry) {
            owner._tooltips = this;
            let mouseHandler=function(e) {
                switch(e.type) {
                    case 'mouseover':
                        if(!this.isVisible()) {
                           const map = e.target.getMap();
                           const zoom=map.getZoom();
                           const mousescreen = map.coordinateToPoint(e.coordinate,zoom);
                           const tipPosition = new maptalks.Point(mousescreen.x+25,mousescreen.y-45);
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
            this._mouseHandler=mouseHandler;
            owner.on('mouseover mouseout',mouseHandler.bind(this));
        }
       return super.addTo(owner);
    }

    /**
    * get the UI Component's content
    * @returns {String} tooltips's content
    */
    getContent(){
      return this._infomation;
    }

    buildOn() {
        const dom = createEl('div');
        dom.className = 'maptalks-msgBox';
        dom.id = "tipDiv";
        dom.style.width = defaults.width + 'px';
        let content = '';
        content += '<div class="maptalks-msgContent">' + this. _infomation+ '</div>';
        dom.innerHTML = content;
        return dom;
    }

    show(coordinate) {
        return super.show(coordinate);
    }
    /**
   * cancel the tooltips effect
   * @returns {UIComponent} this
   */
    cancelTips() {
        if(this._owner){
            this._owner.off('mouseover mouseout',this._mouseHandler);
            delete this._owner._tooltips;
            delete this._owner;
            delete this._mouseHandler;
        }
        this.remove();
        return this;
    }
}

Tooltips.mergeOptions(defaults);

export default Tooltips;