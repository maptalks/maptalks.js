import VectorPack from './VectorPack';
import clipLine from './util/clip_line';
import { getAnchors } from './util/get_anchors';
import { getFeatureAnchors } from './util/get_point_anchors';

const MAX_ANGLE = 45 * Math.PI / 100;
const DEFAULT_SPACING = 250;

/**
 * Native点类型数据
 */
export default class NativePointPack extends VectorPack {
    getFormat() {
        return [
            ...this.getPositionFormat()
        ];
    }

    placeVector(point) {
        const spacing = this.symbol['markerSpacing'] || DEFAULT_SPACING;
        const placement = this.symbol['markerPlacement'] || 'point';
        const anchors = this._getAnchors(point, spacing, placement);

        for (let ii = 0; ii < anchors.length; ii++) {
            const point = anchors[ii];

            this.fillPosition(this.data, point.x, point.y, point.z);

            const max = Math.max(Math.abs(point.x), Math.abs(point.y));
            if (max > this.maxPos) {
                this.maxPos = max;
            }
        }
    }

    _getAnchors(point, spacing, placement) {
        const feature = point.feature;
        const EXTENT = this.options.EXTENT;
        if (placement === 'line') {
            const anchors = [];
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
            return anchors;
        } else {
            return getFeatureAnchors(feature, placement, EXTENT);
        }

    }


    hasElements() {
        return false;
    }
}
