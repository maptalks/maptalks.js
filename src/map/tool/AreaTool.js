import Size from '../../geo/Size';
import { Geometry, Marker, Label } from '../../geometry';
import DistanceTool from './DistanceTool';

/**
 * @property {options} options
 * @property {String}  options.language         - language of the distance tool, zh-CN or en-US
 * @property {Boolean} options.metric           - display result in metric system
 * @property {Boolean} options.imperial         - display result in imperial system.
 * @property {Object}  options.symbol           - symbol of the line
 * @property {Object}  options.vertexSymbol     - symbol of the vertice
 * @property {Object}  options.labelOptions     - construct options of the vertice labels.
 * @memberOf AreaTool
 * @instance
 */
const options = {
    'mode': 'Polygon',
    'symbol': {
        'lineColor': '#000000',
        'lineWidth': 2,
        'lineOpacity': 1,
        'lineDasharray': '',
        'polygonFill': '#ffffff',
        'polygonOpacity': 0.5
    }
};

/**
 * A map tool to help measure area on the map
 * @category maptool
 * @extends DistanceTool
 * @example
 * var areaTool = new AreaTool({
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
 */
class AreaTool extends DistanceTool {

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

    _measure(toMeasure) {
        const map = this.getMap();
        let area;
        if (toMeasure instanceof Geometry) {
            area = map.computeGeometryArea(toMeasure);
        } else if (Array.isArray(toMeasure)) {
            area = map.getProjection().measureArea(toMeasure);
        }
        this._lastMeasure = area;
        let units;
        if (this.options['language'] === 'zh-CN') {
            units = [' 平方米', ' 平方公里', ' 平方英尺', ' 平方英里'];
        } else {
            units = [' sq.m', ' sq.km', ' sq.ft', ' sq.mi'];
        }
        let content = '';
        if (this.options['metric']) {
            content += area < 1E6 ? area.toFixed(0) + units[0] : (area / 1E6).toFixed(2) + units[1];
        }
        if (this.options['imperial']) {
            area *= 3.2808399;
            if (content.length > 0) {
                content += '\n';
            }
            const sqmi = 5280 * 5280;
            content += area < sqmi ? area.toFixed(0) + units[2] : (area / sqmi).toFixed(2) + units[3];
        }
        return content;
    }

    _msGetCoordsToMeasure(param) {
        return param['geometry'].getShell().concat([param['coordinate']]);
    }

    _msOnDrawVertex(param) {
        const prjCoord = this.getMap()._pointToPrj(param['point2d']);
        const vertexMarker = new Marker(param['coordinate'], {
            'symbol': this.options['vertexSymbol']
        });
        vertexMarker._setPrjCoordinates(prjCoord);
        this._measure(param['geometry']);
        this._lastVertex = vertexMarker;
        this._addVertexMarker(vertexMarker);
    }

    _msOnDrawEnd(param) {
        this._clearTailMarker();
        let prjCoord;
        if (param['point2d']) {
            prjCoord = this.getMap()._pointToPrj(param['point2d']);
        } else {
            let prjCoords = param['geometry']._getPrjCoordinates();
            prjCoords = prjCoords.slice(0, prjCoords.length - 1);
            param['geometry']._setPrjCoordinates(prjCoords);
            prjCoord = prjCoords[prjCoords.length - 1];
        }
        if (param['geometry']._getPrjCoordinates().length < 3) {
            this._lastMeasure = 0;
            this._clearMeasureLayers();
            return;
        }

        const ms = this._measure(param['geometry']);
        const projection = this.getMap().getProjection();
        const coord = projection.unproject(prjCoord);
        const endLabel = new Label(ms, coord, this.options['labelOptions'])
            .addTo(this._measureMarkerLayer);
        endLabel._setPrjCoordinates(prjCoord);
        let size = endLabel.getSize();
        if (!size) {
            size = new Size(10, 10);
        }
        this._addClearMarker(coord, prjCoord, size['width']);
        const geo = param['geometry'].copy();
        geo._setPrjCoordinates(param['geometry']._getPrjCoordinates());
        geo.addTo(this._measureLineLayer);
        this._lastMeasure = geo.getArea();
    }
}

AreaTool.mergeOptions(options);

export default AreaTool;
