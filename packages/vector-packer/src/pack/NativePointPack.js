import Color from 'color';
import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import { evaluate } from '../style/Util';


function getPackFormat() {
    return [
        {
            type: Int16Array,
            width: 3,
            name: 'aPosition'
        },
        {
            type: Uint8Array,
            width: 3,
            name: 'aColor'
        },
        {
            type: Uint8Array,
            width: 1,
            name: 'aSize'
        },
    ];
}

const DEFAULT_COLOR = [0, 0, 0];

/**
 * Native点类型数据
 */
export default class NativePointPack extends VectorPack {

    createStyledVector(feature, symbol, options) {
        return new StyledVector(feature, symbol, options);
    }

    getFormat() {
        return getPackFormat();
    }

    placeVector(point) {
        const feature = point.feature;
        const type = point.feature.type;
        const symbol = point.symbol;
        if (type !== 1) {
            //只适用于点类型数据
            return;
        }

        for (let i = 0; i < feature.geometry.length; i++) {
            const points = feature.geometry[i];
            for (let ii = 0; ii < points.length; ii++) {
                const point = points[ii];
                this.data.push(point.x, point.y, 0);
                const max = Math.max(Math.abs(point.x), Math.abs(point.y));
                if (max > this.maxPos) {
                    this.maxPos = max;
                }
                const markerFill = evaluate(symbol['markerFill'], feature.properties);
                const color = markerFill ? Color(markerFill).array() : DEFAULT_COLOR;
                this.data.push(...color);
                const markerSize = evaluate(symbol['markerSize'], feature.properties);
                this.data.push(markerSize);
            }
        }
    }

}

