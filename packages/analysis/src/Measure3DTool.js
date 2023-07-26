import * as maptalks from 'maptalks';

const options = {
    'mode': 'LineString',
    'language': 'zh-CN', //'en-US'
    'metric': true,
    'imperial': false,
    'once': true,
    'symbol': {
        'lineColor': '#f00',
        'lineWidth': 2,
        'polygonFill': '#ddd',
        'polygonOpacity': 0.4
    },
    'vertexSymbol': {
        'markerType': 'ellipse',
        'markerFill': '#fff',
        'markerLineColor': '#669955',
        'markerLineWidth': 3,
        'markerWidth': 12,
        'markerHeight': 12,
        'markerDy': 6
    },
    'labelSymbol': {
        'markerType': 'square',
        'markerFill': 'rgb(135,196,240)',
        'markerFillOpacity': '0.6',
        'markerDx': 20,
        'markerVerticalAlignment': 'middle',
        'markerHorizontalAlignment': 'left',
        'markerTextFit': 'both',
        'markerTextFitPadding': [5, 5, 5, 10],
        'textHorizontalAlignment': 'left',
        'textSize': 16,
        'textFill': '#fff',
        'textDx': 30
    }
};
export default class Measure3DTool extends maptalks.DrawTool {
    constructor(options) {
        super(options);
        this.on('enable', this._afterEnable, this);
        this.on('disable', this._afterDisable, this);
        this._drawCoordinates = [];
    }

    addTo(gllayer) {
        const map = gllayer.getMap();
        if (map) {
            super.addTo(map);
            this._gllayer = gllayer;
            this._map = map;
            this._addHelperLayer();
        } else {
            gllayer.once('add', () => {
                this.addTo(gllayer);
            }, this);
        }
        return this;
    }

    _addHelperLayer() {
        const id = maptalks.INTERNAL_LAYER_PREFIX + 'drawtool';
        this._map.getLayer(id).hide();
    }

    _afterEnable() {
        this.on('drawstart', this._msOnDrawStart, this)
            .on('drawvertex', this._msOnDrawVertex, this)
            .on('mousemove', this._msOnMouseMove, this)
            .on('drawend', this._msOnDrawEnd, this);
    }

    _afterDisable() {
        this.off('drawstart', this._msOnDrawStart, this)
            .off('drawvertex', this._msOnDrawVertex, this)
            .off('mousemove', this._msOnMouseMove, this)
            .off('drawend', this._msOnDrawEnd, this);
    }

    _getPickedCoordinate(coordinate) {
        const identifyData = this._gllayer.identify(coordinate, { includeInternals: true })[0];
        const pickedPoint = identifyData && identifyData.coordinate;
        if (pickedPoint) {
            return new maptalks.Coordinate(identifyData.coordinate);
        } else {
            return coordinate;
        }
    }

    _msOnDrawStart(e) {
        const coordinate = this._getPickedCoordinate(e.coordinate);
        if (!coordinate) {
            return;
        }
        this._first = true;
        this._drawCoordinates.push(coordinate);
        this._addHelperGeometry(coordinate);
    }

    _msOnDrawVertex(e) {
        const coordinate = this._getPickedCoordinate(e.coordinate);
        if (!coordinate) {
            return;
        }
        this._first = true;
        this._drawCoordinates[this._drawCoordinates.length - 1] = coordinate;
        this._drawVertexMarker();
    }

    _msOnMouseMove(e) {
        const coordinate = this._getPickedCoordinate(e.coordinate);
        if (!coordinate) {
            return;
        }
        if (this._first) {
            this._drawCoordinates.push(coordinate);
        } else {
            this._drawCoordinates[this._drawCoordinates.length - 1] = coordinate;
        }
        this._drawVertexMarker();
        this._first = false;
    }

    _msOnDrawEnd(e) {
        const coordinate = this._getPickedCoordinate(e.coordinate);
        if (!coordinate) {
            return;
        }
        this._drawCoordinates.push(coordinate);
        this._drawEnd();
    }

    _drawEnd() {
        this._drawVertexMarker();
        this._drawCoordinates = [];
        this._helperGeometry = null;
        this._label = null;
    }

    remove() {
        if (this._helperLayer) {
            this._helperLayer.remove();
        }
        if (this._markerLayer) {
            this._markerLayer.remove();
        }
    }

    clear() {
        if (this._helperLayer) {
            this._helperLayer.clear();
        }
        if (this._markerLayer) {
            this._markerLayer.clear();
        }
    }
}

Measure3DTool.mergeOptions(options);
