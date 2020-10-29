import { isArrayHasData, UID } from '../../core/util';
import { extendSymbol } from '../../core/util/style';
import Size from '../../geo/Size';
import Geometry from '../../geometry/Geometry';
import Marker from '../../geometry/Marker';
import Label from '../../geometry/Label';
import VectorLayer from '../../layer/VectorLayer';
import DrawTool from './DrawTool';

/**
 * @property {options} options
 * @property {String}  options.language         - language of the distance tool, zh-CN or en-US
 * @property {Boolean} options.metric           - display result in metric system
 * @property {Boolean} options.imperial         - display result in imperial system.
 * @property {Object}  options.symbol           - symbol of the line
 * @property {Object}  options.vertexSymbol     - symbol of the vertice
 * @property {Object}  options.labelOptions     - construct options of the vertice labels.
 * @memberOf DistanceTool
 * @instance
 */
const options = {
    'mode': 'LineString',
    'language': 'zh-CN', //'en-US'
    'metric': true,
    'imperial': false,
    'symbol': {
        'lineColor': '#000',
        'lineWidth': 3,
        'lineOpacity': 1
    },
    'vertexSymbol': {
        'markerType': 'ellipse',
        'markerFill': '#fff',
        'markerLineColor': '#000',
        'markerLineWidth': 3,
        'markerWidth': 11,
        'markerHeight': 11
    },
    'labelOptions': {
        'textSymbol': {
            'textFaceName': 'monospace',
            'textLineSpacing': 1,
            'textHorizontalAlignment': 'right',
            'textDx': 15
        },
        'boxStyle' : {
            'padding' : [6, 2],
            'symbol' : {
                'markerType' : 'square',
                'markerFill' : '#fff',
                'markerFillOpacity' : 0.9,
                'markerLineColor' : '#b4b3b3',
            }
        }
    },
    'clearButtonSymbol' :[{
        'markerType': 'square',
        'markerFill': '#fff',
        'markerLineColor': '#b4b3b3',
        'markerLineWidth': 2,
        'markerWidth': 15,
        'markerHeight': 15,
        'markerDx': 20
    }, {
        'markerType': 'x',
        'markerWidth': 10,
        'markerHeight': 10,
        'markerDx': 20
    }]
};


/**
 * A map tool to help measure distance on the map
 * @category maptool
 * @extends DrawTool
 * @example
 * var distanceTool = new DistanceTool({
 *     'once' : true,
 *     'symbol': {
 *       'lineColor' : '#34495e',
 *       'lineWidth' : 2
 *     },
 *     'vertexSymbol' : {
 *       'markerType'        : 'ellipse',
 *       'markerFill'        : '#1bbc9b',
 *       'markerLineColor'   : '#000',
 *       'markerLineWidth'   : 3,
 *       'markerWidth'       : 10,
 *      'markerHeight'      : 10
 *    },
 *    'language' : 'en-US'
 *  }).addTo(map);
 *
 */
class DistanceTool extends DrawTool {

    /**
     * @param {options} [options=null] - construct options
     * @param {String} [options.language=zh-CN]         - language of the distance tool, zh-CN or en-US
     * @param {Boolean} [options.metric=true]           - display result in metric system
     * @param {Boolean} [options.imperial=false]        - display result in imperial system.
     * @param {Object}  [options.symbol=null]           - symbol of the line
     * @param {Object}  [options.vertexSymbol=null]     - symbol of the vertice
     * @param {Object}  [options.labelOptions=null]     - construct options of the vertice labels.
     */
    constructor(options) {
        super(options);
        this.on('enable', this._afterEnable, this)
            .on('disable', this._afterDisable, this);
        this._measureLayers = [];
    }

    /**
     * Clear the measurements
     * @return {DistanceTool} this
     */
    clear() {
        if (isArrayHasData(this._measureLayers)) {
            for (let i = 0; i < this._measureLayers.length; i++) {
                this._measureLayers[i].remove();
            }
        }
        delete this._lastMeasure;
        delete this._lastVertex;
        this._measureLayers = [];
        return this;
    }

    /**
     * Get the VectorLayers with the geometries drawn on the map during measuring.
     * @return {Layer[]}
     */
    getMeasureLayers() {
        return this._measureLayers;
    }

    /**
     * Get last measuring result
     * @return {Number}
     */
    getLastMeasure() {
        if (!this._lastMeasure) {
            return 0;
        }
        return this._lastMeasure;
    }

    undo() {
        super.undo();
        const pointer = this._historyPointer;
        if (pointer !== this._vertexes.length) {
            for (let i = pointer; i < this._vertexes.length; i++) {
                if (this._vertexes[i].label) {
                    this._vertexes[i].label.remove();
                }
                this._vertexes[i].marker.remove();
            }
        }
        return this;
    }

    redo() {
        super.redo();
        const i = this._historyPointer - 1;
        if (this._vertexes[i]) {
            if (!this._vertexes[i].marker.getLayer()) {
                if (this._vertexes[i].label) {
                    this._vertexes[i].label.addTo(this._measureMarkerLayer);
                }
                this._vertexes[i].marker.addTo(this._measureMarkerLayer);
            }
        }
        return this;
    }

    _measure(toMeasure) {
        const map = this.getMap();
        let length;
        if (toMeasure instanceof Geometry) {
            length = map.computeGeometryLength(toMeasure);
        } else if (Array.isArray(toMeasure)) {
            length = map.getProjection().measureLength(toMeasure);
        }
        this._lastMeasure = length;
        let units;
        if (this.options['language'] === 'zh-CN') {
            units = [' 米', ' 公里', ' 英尺', ' 英里'];
        } else {
            units = [' m', ' km', ' feet', ' mile'];
        }
        let content = '';
        if (this.options['metric']) {
            content += length < 1000 ? length.toFixed(0) + units[0] : (length / 1000).toFixed(2) + units[1];
        }
        if (this.options['imperial']) {
            length *= 3.2808399;
            if (content.length > 0) {
                content += '\n';
            }
            content += length < 5280 ? length.toFixed(0) + units[2] : (length / 5280).toFixed(2) + units[3];
        }
        return content;
    }

    _registerMeasureEvents() {
        this.on('drawstart', this._msOnDrawStart, this)
            .on('drawvertex', this._msOnDrawVertex, this)
            .on('mousemove', this._msOnMouseMove, this)
            .on('drawend', this._msOnDrawEnd, this);
    }

    _afterEnable() {
        this._registerMeasureEvents();
    }

    _afterDisable() {
        this.off('drawstart', this._msOnDrawStart, this)
            .off('drawvertex', this._msOnDrawVertex, this)
            .off('mousemove', this._msOnMouseMove, this)
            .off('drawend', this._msOnDrawEnd, this);
    }

    _msOnDrawStart(param) {
        const map = this.getMap();
        const prjCoord = map._pointToPrj(param['point2d']);
        const uid = UID();
        const layerId = 'distancetool_' + uid;
        const markerLayerId = 'distancetool_markers_' + uid;
        if (!map.getLayer(layerId)) {
            this._measureLineLayer = new VectorLayer(layerId).addTo(map);
            this._measureMarkerLayer = new VectorLayer(markerLayerId).addTo(map);
        } else {
            this._measureLineLayer = map.getLayer(layerId);
            this._measureMarkerLayer = map.getLayer(markerLayerId);
        }
        this._measureLayers.push(this._measureLineLayer);
        this._measureLayers.push(this._measureMarkerLayer);
        //start marker
        const marker = new Marker(param['coordinate'], {
            'symbol': this.options['vertexSymbol']
        });
        //调用_setPrjCoordinates主要是为了解决repeatworld下，让它能标注在其他世界的问题
        marker._setPrjCoordinates(prjCoord);
        const content = (this.options['language'] === 'zh-CN' ? '起点' : 'start');
        const startLabel = new Label(content, param['coordinate'], this.options['labelOptions']);
        startLabel._setPrjCoordinates(prjCoord);
        this._lastVertex = startLabel;
        this._addVertexMarker(marker, startLabel);
    }

    _msOnMouseMove(param) {
        const ms = this._measure(this._msGetCoordsToMeasure(param));
        if (!this._tailMarker) {
            const symbol = extendSymbol(this.options['vertexSymbol']);
            symbol['markerWidth'] /= 2;
            symbol['markerHeight'] /= 2;
            this._tailMarker = new Marker(param['coordinate'], {
                'symbol': symbol
            }).addTo(this._measureMarkerLayer);
            this._tailLabel = new Label(ms, param['coordinate'], this.options['labelOptions'])
                .addTo(this._measureMarkerLayer);
        }
        const prjCoords = this._geometry._getPrjCoordinates();
        const lastCoord = prjCoords[prjCoords.length - 1];
        this._tailMarker.setCoordinates(param['coordinate']);
        this._tailMarker._setPrjCoordinates(lastCoord);
        this._tailLabel.setContent(ms);
        this._tailLabel.setCoordinates(param['coordinate']);
        this._tailLabel._setPrjCoordinates(lastCoord);
    }

    _msGetCoordsToMeasure(param) {
        return param['geometry'].getCoordinates().concat([param['coordinate']]);
    }

    _msOnDrawVertex(param) {
        const prjCoords = this._geometry._getPrjCoordinates();
        const lastCoord = prjCoords[prjCoords.length - 1];
        const geometry = param['geometry'];
        //vertex marker
        const marker = new Marker(param['coordinate'], {
            'symbol': this.options['vertexSymbol']
        });

        const length = this._measure(geometry);
        const vertexLabel = new Label(length, param['coordinate'], this.options['labelOptions']);
        this._addVertexMarker(marker, vertexLabel);
        vertexLabel._setPrjCoordinates(lastCoord);
        marker._setPrjCoordinates(lastCoord);
        this._lastVertex = vertexLabel;
    }

    _addVertexMarker(marker, vertexLabel) {
        if (!this._vertexes) {
            this._vertexes = [];
        }
        if (this._historyPointer !== undefined && this._vertexes.length > this._historyPointer - 1) {
            this._vertexes.length = this._historyPointer - 1;
        }
        this._vertexes.push({ label: vertexLabel, marker });
        this._measureMarkerLayer.addGeometry(marker);
        if (vertexLabel) {
            this._measureMarkerLayer.addGeometry(vertexLabel);
        }
    }

    _msOnDrawEnd(param) {
        this._clearTailMarker();
        if (param['geometry']._getPrjCoordinates().length < 2) {
            this._lastMeasure = 0;
            this._clearMeasureLayers();
            return;
        }
        let size = this._lastVertex.getSize();
        if (!size) {
            size = new Size(10, 10);
        }
        this._addClearMarker(this._lastVertex.getCoordinates(), this._lastVertex._getPrjCoordinates(), size['width']);
        const geo = param['geometry'].copy();
        geo._setPrjCoordinates(param['geometry']._getPrjCoordinates());
        geo.addTo(this._measureLineLayer);
        this._lastMeasure = geo.getLength();
    }

    _addClearMarker(coordinates, prjCoord, dx) {
        let symbol = this.options['clearButtonSymbol'];
        let dxSymbol = {
            'markerDx' : (symbol['markerDx'] || 0) + dx,
            'textDx' : (symbol['textDx'] || 0) + dx
        };
        if (Array.isArray(symbol)) {
            dxSymbol = symbol.map(s => {
                if (s) {
                    return {
                        'markerDx' : (s['markerDx'] || 0) + dx,
                        'textDx' : (s['textDx'] || 0) + dx
                    };
                }
                return null;
            });
        }
        symbol = extendSymbol(symbol, dxSymbol);
        const endMarker = new Marker(coordinates, {
            'symbol': symbol
        });
        const measureLineLayer = this._measureLineLayer,
            measureMarkerLayer = this._measureMarkerLayer;
        endMarker.on('click', function () {
            measureLineLayer.remove();
            measureMarkerLayer.remove();
            //return false to stop propagation of event.
            return false;
        }, this);
        endMarker.addTo(this._measureMarkerLayer);
        endMarker._setPrjCoordinates(prjCoord);
    }

    _clearTailMarker() {
        if (this._tailMarker) {
            this._tailMarker.remove();
            delete this._tailMarker;
        }
        if (this._tailLabel) {
            this._tailLabel.remove();
            delete this._tailLabel;
        }
    }

    _clearMeasureLayers() {
        this._measureLineLayer.remove();
        this._measureMarkerLayer.remove();
    }

}

DistanceTool.mergeOptions(options);

export default DistanceTool;
