import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import { getPointAnchors } from './util/get_point_anchors';
import { interpolated, piecewiseConstant } from '@maptalks/function-type';
import { isFnTypeSymbol } from '../style/Util';

const DEFAULT_SPACING = 250;

const format = [
    {
        type: Int16Array,
        width: 3,
        name: 'aPosition'
    }
];

export default class CirclePack extends VectorPack {
    constructor(features, symbol, options) {
        super(features, symbol, options);
        this._initFnTypes();
    }

    _initFnTypes() {
        if (isFnTypeSymbol('markerSpacing', this.symbolDef)) {
            this._markerSpacingFn = interpolated(this.symbolDef['markerSpacing']);
        }
        if (isFnTypeSymbol('markerPlacement', this.symbolDef)) {
            this._markerPlacementFn = piecewiseConstant(this.symbolDef['markerPlacement']);
        }
    }

    createStyledVector(feature, symbol, options) {
        //每个point的icon和text
        return new StyledVector(feature, symbol, options);
    }

    getFormat() {
        return format;
    }

    placeVector(point, scale, formatWidth) {
        const anchors = this._getAnchors(point, scale);
        const count = anchors.length;
        if (count === 0) {
            return;
        }
        const data = this.data;
        const altitude = this.getAltitude(point.feature.properties);
        let currentIdx = data.length / formatWidth;
        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            data.push(anchor.x * 2 + (-1 + 1) / 2, anchor.y * 2 + (-1 + 1) / 2, altitude);
            data.push(anchor.x * 2 + (1 + 1) / 2, anchor.y * 2 + (-1 + 1) / 2, altitude);
            data.push(anchor.x * 2 + (1 + 1) / 2, anchor.y * 2 + (1 + 1) / 2, altitude);
            data.push(anchor.x * 2 + (-1 + 1) / 2, anchor.y * 2 + (1 + 1) / 2, altitude);

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
        const { symbol } = point;
        const placement = this._getPlacement(symbol, point);
        const spacing = (symbol['markerSpacing'] || DEFAULT_SPACING) * scale;
        const EXTENT = this.options.EXTENT;
        const anchors = getPointAnchors(point, null, null, scale, EXTENT, placement, spacing);
        return anchors;
    }

    _getPlacement(symbol, point) {
        if (this._markerPlacementFn) {
            return this._markerPlacementFn(null, point.feature && point.feature.properties);
        }
        return symbol.markerPlacement;
    }
}
