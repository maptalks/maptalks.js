import * as maptalks from 'maptalks';

const options = {
    'mode': 'LineString',
    'language': 'zh-CN', //'en-US'
    'metric': true,
    'imperial': false,
    'once': true,
    'symbol': {
        'lineColor': "#e8542b",
        'lineWidth': 2,
        'polygonFill': '#eee',
        'polygonOpacity': 0.5
    },
    'vertexSymbol': {
        'markerType': 'ellipse',
        'markerFill': '#e8542b',
        'markerLineColor': '#fff',
        'markerLineWidth': 2,
        'markerWidth': 10,
        'markerHeight': 10,
        'markerDy': 0
    },
    'labelSymbol': {
        'boxStyle' : {
            'padding' : [15, 6],
            'verticalAlignment' : 'top',
            'horizontalAlignment' : 'left',
            'minWidth' : 150,
            'minHeight' : 30,
            'symbol' : {
                'markerType': 'square',
                'markerFill': 'rgb(60, 60, 60)',
                'markerFillOpacity' : 0.8,
                'markerLineColor': '#fff',
                'markerLineWidth': 2,
                'textDx': -110
            }
        },
        'textSymbol': {
            'textFill': '#fff',
            'textSize': 16,
            'textVerticalAlignment': 'top'
        }
    }
};
export default class Measure3DTool extends maptalks.DrawTool {
    constructor(options) {
        super(options);
        this.on('enable', this._afterEnable, this);
        this.on('disable', this._afterDisable, this);
        this._drawCoordinates = [];
    }

    addTo(map) {
        if (map) {
            super.addTo(map);
            this._map = map;
            this._addHelperLayer();
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

    _getPickedCoordinate(e) {
        const { coordinate, containerPoint } = e;
        const gllayer = this._map.getLayers((layer) => {
            return layer.queryTerrainAtPoint;
        })[0];
        if (!gllayer) {
            coordinate.z = coordinate.z || 0;
            return coordinate;
        }
        const identifyData = gllayer.identify(coordinate, { includeInternals: false })[0];
        const pickedPoint = identifyData && identifyData.coordinate;
        let pickCoord = null;
        if (pickedPoint) {
            pickCoord = new maptalks.Coordinate(identifyData.coordinate);
        } else {
            coordinate.z = coordinate.z || 0;
            pickCoord = coordinate;
        }
        if (gllayer.getTerrainLayer()) {
            const pickedTerrainCoord = gllayer.queryTerrainAtPoint(containerPoint);
            return pickedTerrainCoord && pickedTerrainCoord.z > pickCoord.z ? pickedTerrainCoord : pickCoord;
        }
        return pickCoord;
    }

    _msOnDrawStart(e) {
        const coordinate = this._getPickedCoordinate(e);
        if (!coordinate) {
            return;
        }
        this._first = true;
        this._drawCoordinates.push(coordinate);
        this._addHelperGeometry(coordinate);
    }

    _msOnDrawVertex(e) {
        const coordinate = this._getPickedCoordinate(e);
        if (!coordinate) {
            return;
        }
        this._first = true;
        this._drawCoordinates[this._drawCoordinates.length - 1] = coordinate;
        this._drawVertexMarker();
    }

    _msOnMouseMove(e) {
        const coordinate = this._getPickedCoordinate(e);
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
        const coordinate = this._getPickedCoordinate(e);
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
