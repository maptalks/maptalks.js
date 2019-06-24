import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import clipLine from './util/clip_line';
import { getAnchors } from './util/get_anchors';
import classifyRings from './util/classify_rings';
import findPoleOfInaccessibility from './util/find_pole_of_inaccessibility';

const FORMAT = [
    {
        type: Int16Array,
        width: 3,
        name: 'aPosition'
    }
];

const MAX_ANGLE = 45 * Math.PI / 100;
const DEFAULT_SPACING = 250;

/**
 * Native点类型数据
 */
export default class NativePointPack extends VectorPack {

    createStyledVector(feature, symbol, options) {
        return new StyledVector(feature, symbol, options);
    }

    getFormat() {
        return FORMAT;
    }

    placeVector(point) {
        const spacing = this.symbol['markerSpacing'] || DEFAULT_SPACING;
        const placement = this.symbol['markerPlacement'] || 'point';
        const anchors = this._getAnchors(point, spacing, placement);

        for (let ii = 0; ii < anchors.length; ii++) {
            const point = anchors[ii];
            this.data.push(point.x, point.y, 0);
            const max = Math.max(Math.abs(point.x), Math.abs(point.y));
            if (max > this.maxPos) {
                this.maxPos = max;
            }
        }
    }

    _getAnchors(point, spacing, placement) {
        const feature = point.feature,
            type = point.feature.type;
        const EXTENT = this.options.EXTENT;
        const anchors = [];
        if (placement === 'line') {
            let lines = feature.geometry;
            if (EXTENT) {
                lines = clipLine(feature.geometry, 0, 0, EXTENT, EXTENT);
            }

            for (let i = 0; i < lines.length; i++) {
                const lineAnchors = getAnchors(lines[i],
                    spacing,
                    MAX_ANGLE,
                    null, //shapedText
                    null, //shapedIcon,
                    24,
                    1,
                    1, //bucket.overscaling,
                    EXTENT || Infinity
                );

                anchors.push.apply(
                    anchors,
                    lineAnchors
                );
            }
        } else if (type === 3) {
            const rings = classifyRings(feature.geometry, 0);
            for (let i = 0; i < rings.length; i++) {
                const polygon = rings[i];
                // 16 here represents 2 pixels
                const poi = findPoleOfInaccessibility(polygon, 16);
                if (!isOut(poi, EXTENT)) {
                    anchors.push(poi);
                }
            }
        } else if (feature.type === 2) {
            for (let i = 0; i < feature.geometry.length; i++) {
                const line = feature.geometry[i];
                if (!isOut(line[0], EXTENT)) {
                    anchors.push(line[0]);
                }
            }
        } else if (feature.type === 1) {
            for (let i = 0; i < feature.geometry.length; i++) {
                const points = feature.geometry[i];
                for (let ii = 0; ii < points.length; ii++) {
                    const point = points[ii];
                    if (!isOut(point, EXTENT)) {
                        anchors.push(point);
                    }
                }
            }
        }
        return anchors;
    }

}

function isOut(point, extent) {
    return point.x < 0 || point.x > extent || point.y < 0 || point.y > extent;
}
