import { isNil, isArrayHasData, removeFromArray } from '../core/util';
import LineString, { LineStringOptionsType } from './LineString';
import Geometry from './Geometry';
import ArcCurve, { ArcCurveOptionsType } from './ArcCurve';
type Constructor = new (...args: any[]) => {};
/**
 * Mixin of connector line methods.
 * @mixin Connectable
 * @private
 */
function Connectable<TBase extends Constructor>(Base: TBase) {
    return class extends Base {

        _connSource: Geometry;
        _connTarget: Geometry;

        static _hasConnectors(geometry) {
            return (!isNil(geometry.__connectors) && geometry.__connectors.length > 0);
        }

        static _getConnectors(geometry) {
            return geometry.__connectors;
        }

        /**
         * Gets the source of the connector line.
         * @return {Geometry|control.Control|UIComponent}
         * @function Connectable.getConnectSource
         */
        getConnectSource() {
            return this._connSource;
        }

        /**
         * Sets the source to the connector line.
         * @param {Geometry|control.Control|UIComponent} src
         * @return {ConnectorLine} this
         * @function Connectable.setConnectSource
         */
        setConnectSource(src: Geometry) {
            const target = this._connTarget;
            this.onRemove();
            this._connSource = src;
            this._connTarget = target;
            this.onAdd();
            return this;
        }

        /**
         * Gets the target of the connector line.
         * @return {Geometry|control.Control|UIComponent}
         * @function Connectable.getConnectTarget
         */
        getConnectTarget() {
            return this._connTarget;
        }

        /**
         * Sets the target to the connector line.
         * @param {Geometry|control.Control|UIComponent} target
         * @return {ConnectorLine} this
         * @function Connectable.setConnectTarget
         */
        setConnectTarget(target: Geometry) {
            const src = this._connSource;
            this.onRemove();
            this._connSource = src;
            this._connTarget = target;
            this._updateCoordinates();
            this._registerEvents();
            return this;
        }

        _updateCoordinates() {
            //@ts-ignore
            let map = this.getMap();
            if (!map && this._connSource) {
                map = this._connSource.getMap();
            }
            if (!map && this._connTarget) {
                map = this._connTarget.getMap();
            }
            if (!map) {
                return;
            }
            if (!this._connSource || !this._connTarget) {
                return;
            }
            const srcPoints = this._connSource._getConnectPoints();
            const targetPoints = this._connTarget._getConnectPoints();
            let minDist = 0;
            //@ts-ignore
            const oldCoordinates = this.getCoordinates();
            let c1, c2;
            for (let i = 0, len = srcPoints.length; i < len; i++) {
                const p1 = srcPoints[i];
                for (let j = 0, length = targetPoints.length; j < length; j++) {
                    const p2 = targetPoints[j];
                    const dist = map.computeLength(p1, p2);
                    if (i === 0 && j === 0) {
                        c1 = p1;
                        c2 = p2;
                        minDist = dist;
                    } else if (dist < minDist) {
                        c1 = p1;
                        c2 = p2;
                    }
                }
            }
            if (!isArrayHasData(oldCoordinates) || (!oldCoordinates[0].equals(c1) || !oldCoordinates[1].equals(c2))) {
                //@ts-ignore
                this.setCoordinates([c1, c2]);
            }
        }

        onAdd() {
            this._registerEvents();
            this._updateCoordinates();
        }

        onRemove() {
            if (this._connSource) {
                //@ts-ignore
                if (this._connSource.__connectors) {
                    //@ts-ignore
                    removeFromArray(this, this._connSource.__connectors);
                }
                this._connSource.off('dragging positionchange', this._updateCoordinates, this)
                    .off('remove', this.onRemove, this);
                this._connSource.off('dragstart mousedown mouseover', this._showConnect, this);
                //@ts-ignore
                this._connSource.off('dragend mouseup mouseout', this.hide, this);
                //@ts-ignore
                this._connSource.off('show', this._showConnect, this).off('hide', this.hide, this);
                delete this._connSource;
            }
            if (this._connTarget) {
                //@ts-ignore
                removeFromArray(this, this._connTarget.__connectors);
                this._connTarget.off('dragging positionchange', this._updateCoordinates, this)
                    .off('remove', this.onRemove, this);
                //@ts-ignore
                this._connTarget.off('show', this._showConnect, this).off('hide', this.hide, this);
                delete this._connTarget;
            }

            //not a geometry
            if (!(this._connSource instanceof Geometry) || !(this._connTarget instanceof Geometry)) {
                //@ts-ignore
                const map = this.getMap();
                if (map) {
                    map.off('movestart moving moveend zoomstart zooming zoomend rotate pitch fovchange spatialreferencechange', this._updateCoordinates, this);
                }
            }
        }

        _showConnect() {
            if (!this._connSource || !this._connTarget) {
                return;
            }
            if (this._connSource.isVisible() && this._connTarget.isVisible()) {
                this._updateCoordinates();
                //@ts-ignore
                this.show();
            }
        }

        _registerEvents() {
            if (!this._connSource || !this._connTarget) {
                return;
            }
            //@ts-ignore
            if (!this._connSource.__connectors) {
                //@ts-ignore
                this._connSource.__connectors = [];
            }
            //@ts-ignore
            if (!this._connTarget.__connectors) {
                //@ts-ignore
                this._connTarget.__connectors = [];
            }
            //@ts-ignore
            this._connSource.__connectors.push(this);
            //@ts-ignore
            this._connTarget.__connectors.push(this);
            this._connSource.on('dragging positionchange', this._updateCoordinates, this)
                //@ts-ignore
                .on('remove', this.remove, this);
            this._connTarget.on('dragging positionchange', this._updateCoordinates, this)
                //@ts-ignore
                .on('remove', this.remove, this);
            //@ts-ignore
            this._connSource.on('show', this._showConnect, this).on('hide', this.hide, this);
            //@ts-ignore
            this._connTarget.on('show', this._showConnect, this).on('hide', this.hide, this);
            //@ts-ignore
            const trigger = this.options['showOn'];
            //@ts-ignore
            this.hide();
            if (trigger === 'moving') {
                //@ts-ignore
                this._connSource.on('dragstart', this._showConnect, this).on('dragend', this.hide, this);
                //@ts-ignore
                this._connTarget.on('dragstart', this._showConnect, this).on('dragend', this.hide, this);
            } else if (trigger === 'click') {
                //@ts-ignore
                this._connSource.on('mousedown', this._showConnect, this).on('mouseup', this.hide, this);
                //@ts-ignore
                this._connTarget.on('mousedown', this._showConnect, this).on('mouseup', this.hide, this);
            } else if (trigger === 'mouseover') {
                //@ts-ignore
                this._connSource.on('mouseover', this._showConnect, this).on('mouseout', this.hide, this);
                //@ts-ignore
                this._connTarget.on('mouseover', this._showConnect, this).on('mouseout', this.hide, this);
            } else {
                this._showConnect();
            }

            //not a geometry
            if (!(this._connSource instanceof Geometry) || !(this._connTarget instanceof Geometry)) {
                //@ts-ignore
                const map = this.getMap();
                if (map) {
                    map.on('movestart moving moveend zoomstart zooming zoomend rotate pitch fovchange spatialreferencechange', this._updateCoordinates, this);
                }
            }
        }
    };
}

/**
 * @property {Object} options - ConnectorLine's options
 * @property {String} [options.showOn=always]  - when to show the connector line, possible values: 'moving', 'click', 'mouseover', 'always'
 * @memberOf ConnectorLine
 * @instance
 */
/**
 * @property {Object} options - ConnectorLine's options
 * @property {String} [options.showOn=always]  - when to show the connector line, possible values: 'moving', 'click', 'mouseover', 'always'
 * @memberOf ArcConnectorLine
 * @instance
 */
const options = {
    showOn: 'always'
};

/**
 * A straight connector line geometry can connect geometries or ui components with each other. <br>
 *
 * @category geometry
 * @extends LineString
 * @example
 * var src = new Marker([0,0]).addTo(layer),
 *     dst = new Marker([1,0]).addTo(layer),
 *     line = new ConnectorLine(src, dst, {
 *         showOn : 'always', //'moving', 'click', 'mouseover', 'always'
 *         arrowStyle : 'classic',
 *         arrowPlacement : 'vertex-last', //vertex-first, vertex-last, vertex-firstlast, point
 *         symbol: {
 *           lineColor: '#34495e',
 *           lineWidth: 2
 *        }
 *     }).addTo(layer);
 * @mixes connectorLineMixin
 */
class ConnectorLine extends Connectable(LineString) {
    _connSource: Geometry;
    _connTarget: Geometry;
    /**
     * @param {Geometry|control.Control|UIComponent} src     - source to connect
     * @param {Geometry|control.Control|UIComponent} target  - target to connect
     * @param {Object} [options=null]  - construct options defined in [ConnectorLine]{@link ConnectorLine#options}
     */
    constructor(src: Geometry, target: Geometry, options: LineStringOptionsType) {
        super(null, options);
        if (arguments.length === 1) {
            options = src;
            src = null;
            target = null;
        }
        this._connSource = src;
        this._connTarget = target;
    }
}

ConnectorLine.mergeOptions(options);

ConnectorLine.registerJSONType('ConnectorLine');

/**
 * An arc curve connector line geometry can connect geometries or ui components with each other. <br>
 *
 * @category geometry
 * @extends ArcCurve
 * @example
 * var src = new Marker([0,0]).addTo(layer),
 *     dst = new Marker([1,0]).addTo(layer),
 *     line = new ArcConnectorLine(src, dst, {
 *         arcDegree : 120,
 *         showOn : 'always', //'moving', 'click', 'mouseover', 'always'
 *         arrowStyle : 'classic',
 *         arrowPlacement : 'vertex-last', //vertex-first, vertex-last, vertex-firstlast, point
 *         symbol: {
 *           lineColor: '#34495e',
 *           lineWidth: 2
 *        }
 *     }).addTo(layer);
 * @mixes connectorLineMixin
 */
class ArcConnectorLine extends Connectable(ArcCurve) {
    _connSource: Geometry;
    _connTarget: Geometry;
    /**
     * @param {Geometry|control.Control|UIComponent} src     - source to connect
     * @param {Geometry|control.Control|UIComponent} target  - target to connect
     * @param {Object} [options=null]  - construct options defined in [ConnectorLine]{@link ConnectorLine#options}
     */
    constructor(src: Geometry, target: Geometry, options: ArcCurveOptionsType) {
        super(null, options);
        if (arguments.length === 1) {
            options = src;
            src = null;
            target = null;
        }
        this._connSource = src;
        this._connTarget = target;
    }
}

ArcConnectorLine.mergeOptions(options);

ArcConnectorLine.registerJSONType('ArcConnectorLine');

export { ConnectorLine, ArcConnectorLine };
