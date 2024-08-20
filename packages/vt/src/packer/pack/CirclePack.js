import VectorPack from './VectorPack';
import { getPointAnchors } from './util/get_point_anchors';

const DEFAULT_SPACING = 250;

const format = [
    {
        type: Int16Array,
        width: 3,
        name: 'aPosition'
    }
];

export default class CirclePack extends VectorPack {
    getFormat() {
        return format;
    }

    placeVector(point, scale) {
        const anchors = this._getAnchors(point, scale);
        const count = anchors.length;
        if (count === 0) {
            return;
        }
        const data = this.data;
        const altitude = this.getAltitude(point.feature.properties);
        let currentIdx = data.aPosition.getLength() / format[0].width;
        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            data.aPosition.push(anchor.x * 2 + (-1 + 1) / 2, anchor.y * 2 + (-1 + 1) / 2, altitude);
            data.aPosition.push(anchor.x * 2 + (1 + 1) / 2, anchor.y * 2 + (-1 + 1) / 2, altitude);
            data.aPosition.push(anchor.x * 2 + (1 + 1) / 2, anchor.y * 2 + (1 + 1) / 2, altitude);
            data.aPosition.push(anchor.x * 2 + (-1 + 1) / 2, anchor.y * 2 + (1 + 1) / 2, altitude);

            this.addElements(currentIdx, currentIdx + 1, currentIdx + 2);
            this.addElements(currentIdx, currentIdx + 2, currentIdx + 3);
            currentIdx += 4;
            const max = Math.max(Math.abs(anchor.x * 2 + 1), Math.abs(anchor.y * 2 + 1));
            if (max > this.maxPos) {
                this.maxPos = max;
            }
        }
    }

    _getAnchors(point, scale) {
        const { feature, symbol } = point;
        const placement = this._getPlacement(point, symbol);
        const properties = feature.properties;
        const { markerSpacingFn } = this._fnTypes;
        const spacing = (
            (markerSpacingFn ? markerSpacingFn(null, properties) : symbol['markerSpacing']) ||
            DEFAULT_SPACING
        ) * scale;
        const EXTENT = this.options.EXTENT;
        const anchors = getPointAnchors(point, null, null, scale, EXTENT, placement, spacing);
        return anchors;
    }

    _getPlacement(point, symbol) {
        if (this._fnTypes.markerPlacementFn) {
            return this._fnTypes.markerPlacementFn(this.options['zoom'], point.feature.properties);
        }
        return symbol.markerPlacement;
    }
}
