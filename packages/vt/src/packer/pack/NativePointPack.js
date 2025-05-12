import VectorPack from './VectorPack';
import clipLine from './util/clip_line';
import { getAnchors } from './util/get_anchors';
import { getFeatureAnchors } from './util/get_point_anchors';
import { normalizeColor } from '../style/Util';
import { isFunctionDefinition } from '@maptalks/function-type';

const MAX_ANGLE = 45 * Math.PI / 100;
const DEFAULT_SPACING = 250;

/**
 * Native点类型数据
 */
export default class NativePointPack extends VectorPack {
    getFormat() {
        const { markerFillFn } = this._fnTypes;
        let format;
        if (this.symbol.markerRotationAlignment === 'line') {
            format = [
                ...this.getPositionFormat(),
                {
                    type: Float32Array,
                    width: 1,
                    name: 'aXYRotation'
                },
                // {
                //     type: Float32Array,
                //     width: 1,
                //     name: 'aYRotation'
                // },
                {
                    type: Float32Array,
                    width: 1,
                    name: 'aZRotation'
                }
            ];
        } else {
            format = [
                ...this.getPositionFormat()
            ];
        }
        if (markerFillFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 4,
                    name: 'aColor'
                }
            );
        }
        return format;
    }

    placeVector(point) {
        const feature = point.feature;
        const properties = feature.properties;
        const { markerFillFn } = this._fnTypes;
        let feaColor;
        if (markerFillFn) {
            // 为了支持和linePattern合成，把默认lineColor设为白色
            feaColor = markerFillFn(this.options['zoom'], properties) || [255, 255, 255, 255];
            if (isFunctionDefinition(feaColor)) {
                this.dynamicAttrs['aColor'] = 1;
                // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                feaColor = [0, 0, 0, 0];
            } else {
                feaColor = normalizeColor([], feaColor);
            }
        }
        const data = this.data;
        const spacing = this.symbol['markerSpacing'] || DEFAULT_SPACING;
        const placement = this.symbol['markerPlacement'] || 'point';
        const hasRotation = this.symbol.markerRotationAlignment === 'line';
        const anchors = this._getAnchors(point, spacing, placement, hasRotation);
        const needAltitudeAttribute = this.needAltitudeAttribute();
        for (let ii = 0; ii < anchors.length; ii++) {
            const point = anchors[ii];

            this.fillPosition(this.data, point.x, point.y, point.z);
            if (hasRotation) {
                // this.data.aXRotation.push(point.xRotation || 0);
                // this.data.aXYRotation.push(point.xyRotation || 0);
                // this.data.aZRotation.push(point.zRotation || 0);

                let index = data.aXYRotation.currentIndex;
                data.aXYRotation[index++] = point.xyRotation || 0;
                data.aXYRotation.currentIndex = index;

                index = data.aZRotation.currentIndex;
                data.aZRotation[index++] = point.zRotation || 0;
                data.aZRotation.currentIndex = index;
            }
            if (feaColor) {
                // this.data.aColor.push(...feaColor);

                let index = data.aColor.currentIndex;
                data.aColor[index++] = feaColor[0];
                data.aColor[index++] = feaColor[1];
                data.aColor[index++] = feaColor[2];
                data.aColor[index++] = feaColor[3];
                data.aColor.currentIndex = index;
            }
            let max;
            if (needAltitudeAttribute) {
                max = Math.max(Math.abs(point.x), Math.abs(point.y));
            } else {
                max = Math.max(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z));
            }
            if (max > this.maxPos) {
                this.maxPos = max;
            }
        }
    }

    _getAnchors(point, spacing, placement, hasRotation) {
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
            return getFeatureAnchors(feature, placement, EXTENT, hasRotation, this.options.altitudeToTileScale);
        }

    }


    hasElements() {
        return false;
    }
}
