import { isArrayHasData, isFunction, UID } from '../../core/util';
import { extendSymbol } from '../../core/util/style';
import Size from '../../geo/Size';
import Geometry from '../../geometry/Geometry';
import Marker from '../../geometry/Marker';
import Label from '../../geometry/Label';
import Translator from '../../lang/translator';
import DrawTool, { DrawToolOptions } from './DrawTool';
import Coordinate from '../../geo/Coordinate';
import { VectorMarkerSymbol } from '../../symbol';
import DrawToolLayer from '../../layer/DrawToolLayer';

export type DistanceToolOptions = {
    mode?: string,
    language?: string,
    metric?: boolean,
    imperial?: boolean,
    symbol?: any,
    vertexSymbol?: any,
    labelOptions?: any,
    decimalPlaces?: number,
    formatLabelContent?: any,
    clearButtonSymbol?: any,
    zIndex?: number
} & DrawToolOptions;

/**
 * 配置项说明
 *
 * @english
 * @property options
 * @property {String}  options.language         - language of the distance tool, zh-CN or en-US
 * @property {Boolean} options.metric           - display result in metric system
 * @property {Boolean} options.imperial         - display result in imperial system.
 * @property {Object}  options.symbol           - symbol of the line
 * @property {Object}  options.vertexSymbol     - symbol of the vertice
 * @property {Object}  options.labelOptions     - construct options of the vertice labels.
 * @property {Number}  options.decimalPlaces     - The  decimal places of the measured value
 * @property {Function}  options.formatLabelContent     - Content function for custom measurement result labels
 * @memberOf DistanceTool
 * @instance
 */
const options: DistanceToolOptions = {
    'formatLabelContent': null,
    'decimalPlaces': 2,
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
        'boxStyle': {
            'padding': [6, 2],
            'symbol': {
                'markerType': 'square',
                'markerFill': '#fff',
                'markerFillOpacity': 0.9,
                'markerLineColor': '#b4b3b3',
            }
        }
    },
    'clearButtonSymbol': [{
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
 * 距离测量工具类
 *
 * @english
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
    options: DistanceToolOptions;
    //@internal
    _measureLayers: Array<any>;
    translator: Translator;
    //@internal
    _tailMarker?: any;
    //@internal
    _tailLabel?: any;
    //@internal
    _lastMeasure?: number | string;
    //@internal
    _lastVertex?: any
    //@internal
    _measureMarkerLayer?: any
    //@internal
    _measureLineLayer?: any

    /**
     * 配置项
     *
     * @param options=null                  - construct options
     * @param options.language=zh-CN        - language of the distance tool, zh-CN or en-US
     * @param options.metric=true           - display result in metric system
     * @param options.imperial=false        - display result in imperial system.
     * @param options.symbol=null           - symbol of the line
     * @param options.vertexSymbol=null     - symbol of the vertice
     * @param options.labelOptions=null     - construct options of the vertice labels.
     */
    constructor(options: DistanceToolOptions) {
        super(options);
        this.on('enable', this._afterEnable, this)
            .on('disable', this._afterDisable, this);
        this._measureLayers = [];
        this.translator = new Translator(this.options['language'] as any);
    }

    /**
     * 清空测量
     *
     * @english
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
        this._outLayers(this._measureLayers);
        this._measureLayers = [];
        return this;
    }

    /**
     * 获取在绘制图形期间的DrawToolLayers
     *
     * @english
     * Get the DrawToolLayers with the geometries drawn on the map during measuring.
     * @return {Array<Layer>}
     */
    getMeasureLayers() {
        return this._measureLayers;
    }

    /**
     * 获取最后测量结果
     *
     * @english
     * Get last measuring result
     * @return {Number}
     */
    getLastMeasure() {
        if (!this._lastMeasure) {
            return 0;
        }
        return this._lastMeasure;
    }

    /**
     * 撤消绘图，仅适用于点击/删除模式
     *
     * @english
     * Undo drawing, only applicable for click/dblclick mode
     * @return {DistanceTool} this
     */
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

    /**
     * 重做绘图，只适用于click/dblclick模式
     *
     * @english
     * Redo drawing, only applicable for click/dblclick mode
     * @return {DistanceTool} this
     */
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

    //@internal
    _formatLabelContent(params: any) {
        const formatLabelContent = this.options.formatLabelContent;
        if (formatLabelContent && isFunction(formatLabelContent)) {
            return formatLabelContent.call(this, params) + '';
        }
        return null;
    }

    //@internal
    _measure(toMeasure: any) {
        const map: any = this.getMap();
        let length;
        if (toMeasure instanceof Geometry) {
            length = map.computeGeometryLength(toMeasure);
        } else if (Array.isArray(toMeasure)) {
            length = map.getProjection().measureLength(toMeasure);
        }
        this._lastMeasure = length;

        const result = this._formatLabelContent(length);
        if (result) {
            return result;
        }
        const units = [
            this.translator.translate('distancetool.units.meter'),
            this.translator.translate('distancetool.units.kilometer'),
            this.translator.translate('distancetool.units.feet'),
            this.translator.translate('distancetool.units.mile')
        ];
        let content = '';
        const decimals = this.options['decimalPlaces'];
        if (this.options['metric']) {
            content += length < 1000 ? length.toFixed(decimals) + units[0] : (length / 1000).toFixed(decimals) + units[1];
        }
        if (this.options['imperial']) {
            length *= 3.2808399;
            if (content.length > 0) {
                content += '\n';
            }
            content += length < 5280 ? length.toFixed(decimals) + units[2] : (length / 5280).toFixed(decimals) + units[3];
        }
        return content;
    }

    //@internal
    _registerMeasureEvents() {
        this.on('drawstart', this._msOnDrawStart, this)
            .on('drawvertex', this._msOnDrawVertex, this)
            .on('mousemove', this._msOnMouseMove, this)
            .on('drawend', this._msOnDrawEnd, this);
    }

    //@internal
    _afterEnable() {
        this._registerMeasureEvents();
    }

    //@internal
    _afterDisable() {
        this.off('drawstart', this._msOnDrawStart, this)
            .off('drawvertex', this._msOnDrawVertex, this)
            .off('mousemove', this._msOnMouseMove, this)
            .off('drawend', this._msOnDrawEnd, this);
    }

    //@internal
    _msOnDrawStart(param: any) {
        const map: any = this.getMap();
        // const prjCoord = map._pointToPrj(param['point2d']);
        const uid = UID();
        const layerId = 'distancetool_' + uid;
        const markerLayerId = 'distancetool_markers_' + uid;
        const zIndex = this.options.zIndex;
        const enableAltitude = this.options.enableAltitude;
        if (!map.getLayer(layerId)) {
            this._measureLineLayer = new DrawToolLayer(layerId, {
                zIndex,
                enableAltitude
            }).addTo(map);
            this._measureMarkerLayer = new DrawToolLayer(markerLayerId, {
                zIndex,
                enableAltitude
            }).addTo(map);
        } else {
            this._measureLineLayer = map.getLayer(layerId);
            this._measureMarkerLayer = map.getLayer(markerLayerId);
        }
        this._measureLayers.push(this._measureLineLayer);
        this._measureLayers.push(this._measureMarkerLayer);
        this._pushLayers([this._measureLineLayer, this._measureMarkerLayer]);
        //start marker
        const firstCoordinate = this._getFirstCoordinate() || param.coordinate;
        const marker = new Marker(firstCoordinate.copy(), {
            'symbol': this.options['vertexSymbol']
        });
        //调用_setPrjCoordinates主要是为了解决repeatworld下，让它能标注在其他世界的问题
        // marker._setPrjCoordinates(prjCoord);
        const content = this.translator.translate('distancetool.start');
        const startLabel = new Label(content, firstCoordinate.copy(), this.options['labelOptions']);
        // startLabel._setPrjCoordinates(prjCoord);
        this._lastVertex = startLabel;
        this._addVertexMarker(marker, startLabel);
    }

    //@internal
    _msOnMouseMove(param: any) {
        const ms = this._measure(this._msGetCoordsToMeasure(param));
        if (!this._tailMarker) {
            const symbol = extendSymbol(this.options['vertexSymbol']);
            symbol['markerWidth'] /= 2;
            symbol['markerHeight'] /= 2;
            this._tailMarker = new Marker(param['coordinate'], {
                'symbol': symbol as VectorMarkerSymbol
            }).addTo(this._measureMarkerLayer);
            this._tailLabel = new Label(ms, param['coordinate'], this.options['labelOptions'])
                .addTo(this._measureMarkerLayer);
        }
        // const prjCoords = this._geometry._getPrjCoordinates();
        // const lastCoord = prjCoords[prjCoords.length - 1];
        const lastCoordinate = this._getLasttCoordinate() || param.coordinate;
        this._tailMarker.setCoordinates(lastCoordinate.copy());
        // this._tailMarker._setPrjCoordinates(lastCoord);
        this._tailLabel.setContent(ms);
        this._tailLabel.setCoordinates(lastCoordinate.copy());
        // this._tailLabel._setPrjCoordinates(lastCoord);
    }

    //@internal
    _msGetCoordsToMeasure(param: any) {
        return param['geometry'].getCoordinates().concat([param['coordinate']]);
    }

    //@internal
    _msOnDrawVertex(param: any) {
        // const prjCoords = this._geometry._getPrjCoordinates();
        // const lastCoord = prjCoords[prjCoords.length - 1];

        const lastCoordinate = this._getLasttCoordinate() || param.coordinate;

        const geometry = param['geometry'];
        //vertex marker
        const marker = new Marker(lastCoordinate.copy(), {
            'symbol': this.options['vertexSymbol']
        });

        const length = this._measure(geometry);
        const vertexLabel = new Label(length, lastCoordinate.copy(), this.options['labelOptions']);
        this._addVertexMarker(marker, vertexLabel);
        // vertexLabel._setPrjCoordinates(lastCoord);
        // marker._setPrjCoordinates(lastCoord);
        this._lastVertex = vertexLabel;
    }

    //@internal
    _addVertexMarker(marker: Marker, vertexLabel?: any) {
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

    //@internal
    _msOnDrawEnd(param: any) {
        this._clearTailMarker();
        if (param['geometry'].getCoordinates().length < 2) {
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

        geo.setCoordinates(param.geometry.getCoordinates());

        // geo._setPrjCoordinates(param['geometry']._getPrjCoordinates());
        geo.addTo(this._measureLineLayer);
        this._lastMeasure = geo.getLength();
    }

    //@internal
    _addClearMarker(coordinates: Coordinate, prjCoord: any, dx: number | string) {
        let symbol = this.options['clearButtonSymbol'];
        let dxSymbol: any | Array<any> = {
            'markerDx': (symbol['markerDx'] || 0) + dx,
            'textDx': (symbol['textDx'] || 0) + dx
        };
        if (Array.isArray(symbol)) {
            dxSymbol = symbol.map(s => {
                if (s) {
                    return {
                        'markerDx': (s['markerDx'] || 0) + dx,
                        'textDx': (s['textDx'] || 0) + dx
                    };
                }
                return null;
            });
        }
        symbol = extendSymbol(symbol, dxSymbol);
        const endMarker: any = new Marker(coordinates, {
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
        // endMarker._setPrjCoordinates(prjCoord);
    }

    //@internal
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

    //@internal
    _clearMeasureLayers() {
        this._measureLineLayer.remove();
        this._measureMarkerLayer.remove();
    }

    //@internal
    _getFirstCoordinate() {
        if (!this._geometry) {
            return null;
        }
        const coordinates = this._geometry.getCoordinates() || [];
        return coordinates[0];
    }

    //@internal
    _getLasttCoordinate() {
        if (!this._geometry) {
            return null;
        }
        const coordinates = this._geometry.getCoordinates() || [];
        return coordinates[coordinates.length - 1];
    }

}

DistanceTool.mergeOptions(options);

export default DistanceTool;
