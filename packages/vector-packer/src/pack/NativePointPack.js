import VectorPack from './VectorPack';
import StyledVector from './StyledVector';

function getPackFormat() {
    return [
        {
            type: Int16Array,
            width: 3,
            name: 'aPosition'
        }
    ];
}

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
            }
        }
    }

}

