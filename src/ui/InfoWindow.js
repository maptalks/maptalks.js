import { isString } from '../core/util';
import { createEl } from '../core/util/dom';
import Point from '../geo/Point';
import { Geometry, Marker } from '../geometry';
import UIComponent from './UIComponent';


/**
 * @property {Object} options
 * @property {Boolean} [options.autoPan=true]  - set it to false if you don't want the map to do panning animation to fit the opened window.
 * @property {Boolean} [options.autoCloseOn=null] - Auto close infowindow on map's events, e.g. "click contextmenu" will close infowindow with click or right click on map.
 * @property {Boolean} [options.autoOpenOn=null]  - Auto open infowindow on owner's events, e.g. "click" will open infowindow with click or right click on window's owner.
 * @property {Number}  [options.width=300]     - default width
 * @property {Number}  [options.minHeight=120] - minimun height
 * @property {Boolean} [options.custom=false]  - set it to true if you want a customized infowindow, customized html codes or a HTMLElement is set to content.
 * @property {String}  [options.title=null]    - title of the infowindow.
 * @property {String|HTMLElement}  options.content - content of the infowindow.
 * @memberOf ui.InfoWindow
 * @instance
 */
const options = {
    'autoPan': true,
    'autoCloseOn' : null,
    'autoOpenOn' : 'click',
    'width': 300,
    'minHeight': 120,
    'custom': false,
    'title': null,
    'content': null
};

/**
 * @classdesc
 * Class for info window, a popup on the map to display any useful infomation you wanted.
 * @category ui
 * @extends ui.UIComponent
 * @param {Object} options - options defined in [InfoWindow]{@link InfoWindow#options}
 * @memberOf ui
 */
class InfoWindow extends UIComponent {

    // TODO: obtain class in super
    _getClassName() {
        return 'InfoWindow';
    }

    /**
     * Adds the UI Component to a geometry or a map
     * @param {Geometry|Map} owner - geometry or map to addto.
     * @returns {UIComponent} this
     * @fires UIComponent#add
     */
    addTo(owner) {
        if (owner instanceof Geometry) {
            if (owner.getInfoWindow() && owner.getInfoWindow() !== this) {
                owner.removeInfoWindow();
            }
            owner._infoWindow = this;
        }
        return super.addTo(owner);
    }

    /**
     * Set the content of the infowindow.
     * @param {String|HTMLElement} content - content of the infowindow.
     * return {InfoWindow} this
     * @fires InfoWindow#contentchange
     */
    setContent(content) {
        const old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event InfoWindow#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {InfoWindow} target - InfoWindow
         * @property {String|HTMLElement} old      - old content
         * @property {String|HTMLElement} new      - new content
         */
        this.fire('contentchange', {
            'old': old,
            'new': content
        });
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    }

    /**
     * Get content of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getContent() {
        return this.options['content'];
    }

    /**
     * Set the title of the infowindow.
     * @param {String|HTMLElement} title - title of the infowindow.
     * return {InfoWindow} this
     * @fires InfoWindow#titlechange
     */
    setTitle(title) {
        const old = title;
        this.options['title'] = title;
        /**
         * titlechange event.
         *
         * @event InfoWindow#titlechange
         * @type {Object}
         * @property {String} type - titlechange
         * @property {InfoWindow} target - InfoWindow
         * @property {String} old      - old content
         * @property {String} new      - new content
         */
        this.fire('contentchange', {
            'old': old,
            'new': title
        });
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    }

    /**
     * Get title of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getTitle() {
        return this.options['title'];
    }

    buildOn() {
        if (this.options['custom']) {
            if (isString(this.options['content'])) {
                const dom = createEl('div');
                dom.innerHTML = this.options['content'];
                return dom;
            } else {
                return this.options['content'];
            }
        }
        const dom = createEl('div');
        dom.className = 'maptalks-msgBox';
        dom.style.width = this._getWindowWidth() + 'px';
        let content = '<em class="maptalks-ico"></em>';
        if (this.options['title']) {
            content += '<h2>' + this.options['title'] + '</h2>';
        }
        const onClose = '"this.parentNode.style.display=\'none\';return false;"';
        content += '<a href="javascript:void(0);" onclick=' + onClose +
            ' ontouchend=' + onClose +
            ' class="maptalks-close"></a><div class="maptalks-msgContent">' + this.options['content'] + '</div>';
        dom.innerHTML = content;
        return dom;
    }

    /**
     * Gets InfoWindow's transform origin for animation transform
     * @protected
     * @return {Point} transform origin
     */
    getTransformOrigin() {
        const size = this.getSize();
        const o = new Point(size['width'] / 2, size['height']);
        if (!this.options['custom']) {
            o._add(4, 12);
        }
        return o;
    }

    getOffset() {
        const size = this.getSize();
        const o = new Point(-size['width'] / 2, -size['height']);
        if (!this.options['custom']) {
            o._sub(4, 12);
        }
        if (this.getOwner() instanceof Marker) {
            const markerSize = this.getOwner().getSize();
            if (markerSize) {
                o._add(0, -markerSize['height']);
            }
        }
        return o;
    }

    show(coordinate) {
        if (!this.getMap()) {
            return this;
        }
        if (!this.getMap().options['enableInfoWindow']) {
            return this;
        }
        return super.show(coordinate);
    }

    getEvents() {
        if (!this.options['autoCloseOn']) {
            return null;
        }
        const events = {};
        events[this.options['autoCloseOn']] = this.hide;
        return events;
    }

    getOwnerEvents() {
        const owner = this.getOwner();
        if (!this.options['autoOpenOn'] || !owner) {
            return null;
        }
        const events = {};
        events[this.options['autoOpenOn']] = this._onAutoOpen;
        return events;
    }

    _onAutoOpen(e) {
        const owner = this.getOwner();
        setTimeout(() => {
            if (owner instanceof Marker) {
                this.show(owner.getCoordinates());
            } else {
                this.show(e.coordinate);
            }
        }, 1);
    }

    _getWindowWidth() {
        const defaultWidth = 300;
        let width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    }
}

InfoWindow.mergeOptions(options);

export default InfoWindow;
