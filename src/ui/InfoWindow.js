import { isString } from '../core/util';
import { createEl, addDomEvent, removeDomEvent } from '../core/util/dom';
import Point from '../geo/Point';
import { Geometry, Marker, MultiPoint, LineString, MultiLineString } from '../geometry';
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
    'containerClass': 'maptalks-msgBox',
    'autoPan': true,
    'autoCloseOn': null,
    'autoOpenOn': 'click',
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
        if (this.options['containerClass']) {
            dom.className = this.options['containerClass'];
        }
        dom.style.width = this._getWindowWidth() + 'px';
        dom.style.bottom = '0px'; // fix #657
        let content = '<em class="maptalks-ico"></em>';
        if (this.options['title']) {
            content += '<h2>' + this.options['title'] + '</h2>';
        }
        content += '<a href="javascript:void(0);" class="maptalks-close"></a><div class="maptalks-msgContent"></div>';
        dom.innerHTML = content;
        const msgContent = dom.querySelector('.maptalks-msgContent');
        if (isString(this.options['content'])) {
            msgContent.innerHTML = this.options['content'];
        } else {
            msgContent.appendChild(this.options['content']);
        }
        this._onCloseBtnClick = this.hide.bind(this);
        const closeBtn = dom.querySelector('.maptalks-close');
        addDomEvent(closeBtn, 'click touchend', this._onCloseBtnClick);

        return dom;
    }

    /**
     * Gets InfoWindow's transform origin for animation transform
     * @protected
     * @return {Point} transform origin
     */
    getTransformOrigin() {
        const size = this.getSize();
        return size.width / 2 + 'px bottom';
    }

    getOffset() {
        const size = this.getSize();
        const o = new Point(-size['width'] / 2, 0);
        if (!this.options['custom']) {
            o._sub(4, 12);
        } else {
            o._sub(0, size['height']);
        }
        const owner = this.getOwner();
        if (owner instanceof Marker || owner instanceof MultiPoint) {
            let painter, markerSize;
            if (owner instanceof Marker) {
                painter = owner._getPainter();
                markerSize = owner.getSize();
            } else {
                const children = owner.getGeometries();
                if (!children || !children.length) {
                    return o;
                }
                painter = children[0]._getPainter();
                markerSize = children[0].getSize();
            }
            if (painter) {
                const fixExtent = painter.getFixedExtent();
                o._add(fixExtent.xmax - markerSize.width / 2, fixExtent.ymin);
            } else {
                o._add(0, -markerSize.height);
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

    onRemove() {
        this.onDomRemove();
    }

    onDomRemove() {
        if (this._onCloseBtnClick) {
            const dom = this.getDOM();
            const closeBtn = dom.childNodes[2];
            removeDomEvent(closeBtn, 'click touchend', this._onCloseBtnClick);
            delete this._onCloseBtnClick;
        }
    }

    _onAutoOpen(e) {
        const owner = this.getOwner();
        setTimeout(() => {
            if (owner instanceof Marker || owner instanceof UIComponent) {
                this.show(owner.getCoordinates());
            } else if (owner instanceof MultiPoint) {
                this.show(owner.findClosest(e.coordinate));
            } else if ((owner instanceof LineString) || (owner instanceof MultiLineString)) {
                if (this.getMap().getScale() >= 8) {
                    e.coordinate = this._rectifyMouseCoordinte(owner, e.coordinate);
                }
                this.show(e.coordinate);
            } else {
                this.show(e.coordinate);
            }
        }, 1);
    }

    _rectifyMouseCoordinte(owner, mouseCoordinate) {
        if (owner instanceof LineString) {
            return this._rectifyLineStringMouseCoordinate(owner, mouseCoordinate).coordinate;
        } else if (owner instanceof MultiLineString) {
            return owner.getGeometries().map(lineString => {
                return this._rectifyLineStringMouseCoordinate(lineString, mouseCoordinate);
            }).sort((a, b) => {
                return a.dis - b.dis;
            })[0].coordinate;
        }
        // others
        return mouseCoordinate;
    }

    _rectifyLineStringMouseCoordinate(lineString, mouseCoordinate) {
        const pts = lineString.getCoordinates().map(coordinate => {
            return this.getMap().coordToContainerPoint(coordinate);
        });
        const mousePt = this.getMap().coordToContainerPoint(mouseCoordinate);
        let minDis = Infinity, coordinateIndex = -1;
        // Find the point with the shortest distance
        for (let i = 0, len = pts.length; i < len; i++) {
            const pt = pts[i];
            const dis = mousePt.distanceTo(pt);
            if (dis < minDis) {
                minDis = dis;
                coordinateIndex = i;
            }
        }
        const filterPts = [];
        if (coordinateIndex === 0) {
            filterPts.push(pts[0], pts[1]);
        } else if (coordinateIndex === pts.length - 1) {
            filterPts.push(pts[coordinateIndex - 1], pts[coordinateIndex]);
        } else {
            filterPts.push(pts[coordinateIndex - 1], pts[coordinateIndex], pts[coordinateIndex + 1]);
        }
        const xys = [];
        const { width, height } = this.getMap().getSize();
        //Calculate all pixels in the field of view
        for (let i = 0, len = filterPts.length - 1; i < len; i++) {
            const pt1 = filterPts[i], pt2 = filterPts[i + 1];
            if (pt1.x === pt2.x) {
                const miny = Math.max(0, Math.min(pt1.y, pt2.y));
                const maxy = Math.min(height, Math.max(pt1.y, pt2.y));
                for (let y = miny; y <= maxy; y++) {
                    xys.push(new Point(pt1.x, y));
                }
            } else {
                const k = (pt2.y - pt1.y) / (pt2.x - pt1.x);
                // y-y0=k(x-x0)
                // y-pt1.y=k(x-pt1.x)
                const minx = Math.max(0, Math.min(pt1.x, pt2.x));
                const maxx = Math.min(width, Math.max(pt1.x, pt2.x));
                for (let x = minx; x <= maxx; x++) {
                    const y = k * (x - pt1.x) + pt1.y;
                    xys.push(new Point(x, y));
                }
            }
        }
        let minPtDis = Infinity, ptIndex = -1;
        // Find the point with the shortest distance
        for (let i = 0, len = xys.length; i < len; i++) {
            const pt = xys[i];
            const dis = mousePt.distanceTo(pt);
            if (dis < minPtDis) {
                minPtDis = dis;
                ptIndex = i;
            }
        }
        return {
            dis: minPtDis,
            coordinate: ptIndex < 0 ? mouseCoordinate : this.getMap().containerPointToCoord(xys[ptIndex])
        };
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
