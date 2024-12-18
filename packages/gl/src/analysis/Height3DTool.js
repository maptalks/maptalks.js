import * as maptalks from 'maptalks';
import Measure3DTool from './Measure3DTool';

const MEASURE_HEIGHT_NAMES = [['直线距离', '垂直高度', '水平距离'], ['spatial distance', 'vertical height', 'horizontal distance']];
export default class Height3DTool extends Measure3DTool {

    _addHelperLayer() {
        super._addHelperLayer();
        this._markerLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_height3dtool_marker', { enableAltitude: true }).addTo(this._map).bringToFront();
        this._helperLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_height3dtool', { enableAltitude: true }).addTo(this._map).bringToFront();
    }

    _msOnDrawVertex(e) {
        super._msOnDrawVertex(e);
        if (this._drawCoordinates.length > 1) {
            this._drawEnd();
            this.disable();
        }
    }

    _drawVertexMarker() {
        const markers = this._markerLayer.getGeometries();
        const geometryCount = this._helperLayer.getGeometries().length;
        for (let i = 0; i < markers.length; i++) {
            const id = markers[i].getId();
            if ( id !== 'label' + geometryCount + '_' + i && id.indexOf(`${geometryCount}_`) === 0) {
                markers[i].remove();
            }
        }
        for (let i = 0; i < this._drawCoordinates.length; i++) {
            new maptalks.Marker(this._drawCoordinates[i], {
                id: geometryCount + '_' + i,
                symbol: this.options['vertexSymbol']
            }).addTo(this._markerLayer);
        }
        const len = this._drawCoordinates.length;
        if (len > 1) {
            const x = this._drawCoordinates[len - 1].x, y = this._drawCoordinates[len - 1].y, z = this._drawCoordinates[len - 2].z;
            const coord = new maptalks.Coordinate([x, y, z]);
            new maptalks.Marker(coord, {
                id: geometryCount + '_' + 2,
                symbol: this.options['vertexSymbol']
            }).addTo(this._markerLayer);
            const coordinates = [].concat(this._drawCoordinates);
            coordinates.push(coord);
            coordinates.push(this._drawCoordinates[0]);
            const altitude = coordinates.map(c => { return c.z;});
            this._helperGeometry.setCoordinates(coordinates);
            this._helperGeometry.setProperties({ altitude });
            const horizontalDistance = this._map.getProjection().measureLenBetween(coordinates[0], coordinates[2]);
            const height = coordinates[1].z - coordinates[2].z;
            const distance = Math.sqrt(Math.pow(horizontalDistance, 2) + Math.pow(height, 2));
            this._drawLabel(coordinates, [distance, height, horizontalDistance]);
        }
    }

    _drawLabel(coordinates, distances) {
        for (let i = 0; i < coordinates.length - 1; i++) {
            const from = coordinates[i], to = coordinates[i + 1];
            const distance = distances[i];
            const language = this.options['language'] === 'zh-CN' ? 0 : 1;
            const unitContent = this._getUnitContent(distance);
            const content = MEASURE_HEIGHT_NAMES[language][i] + ':' + unitContent;
            const geometryCount = this._helperLayer.getGeometries().length;
            const id = 'label' + geometryCount + '_' + i;
            const options = JSON.parse(JSON.stringify(this.options.labelSymbol));
            options.id = id;
            if (i < 2) {
                options.boxStyle.symbol.textDx *= -1;
            }
            const labelCoordinate = i === 1 ? from : new maptalks.Coordinate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
            const label = this._markerLayer.getGeometryById(id);
            const markerId = `${id}_marker`;
            const marker = this._markerLayer.getGeometryById(markerId);
            if (!label) {
                new maptalks.Label(content, labelCoordinate, options).addTo(this._markerLayer);
                new maptalks.Marker(labelCoordinate, {
                    id: markerId,
                    symbol: this.options['vertexSymbol']
                }).addTo(this._markerLayer);
            } else {
                label.setContent(content);
                label.setCoordinates(labelCoordinate);
                marker.setCoordinates(labelCoordinate);
            }
        }
    }

    _getUnitContent(length) {
        let units;
        if (this.options['language'] === 'zh-CN') {
            units = [' 米', ' 公里', ' 英尺', ' 英里'];
        } else {
            units = [' m', ' km', ' feet', ' mile'];
        }
        let content = '';
        if (this.options['metric']) {
            this._measure = length < 1000 ? length.toFixed(1) : (length / 1000).toFixed(2);
            this._units = length < 1000 ? units[0] : units[1];
        }
        if (this.options['imperial']) {
            length *= 3.2808399;
            if (content.length > 0) {
                content += '\n';
            }
            this._measure = length < 5280 ? length.toFixed(1) : (length / 5280).toFixed(2);
            this._units = length < 5280 ? units[2] : units[3];
        }
        content += this._measure + this._units;
        return content;
    }

    _addHelperGeometry(coordinate) {
        if (!this._helperGeometry) {
            this._helperGeometry = new maptalks.LineString([coordinate], {
                symbol: this.options.symbol
            }).addTo(this._helperLayer);
        }
        this._drawVertexMarker();
        this._first = true;
    }

    getMeasureResult() {
        return this._helperGeometry.getLength();
    }
}
