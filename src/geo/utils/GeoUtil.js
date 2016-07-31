/**
 * Utilities for geo
 * @class
 * @protected
 */
Z.GeoUtil = {
    /**
     * caculate the distance from a point to a segment.
     * @param {maptalks.Point} p
     * @param {maptalks.Point} p1
     * @param {maptalks.Point} p2
     */
    distanceToSegment: function (p, p1, p2) {
        var x = p.x,
            y = p.y,
            x1 = p1.x,
            y1 = p1.y,
            x2 = p2.x,
            y2 = p2.y;

        var cross = (x2 - x1) * (x - x1) + (y2 - y1) * (y - y1);
        if (cross <= 0) {
            // P->P1
            return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
        }
        var d2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (cross >= d2) {
            // P->P2
            return Math.sqrt((x - x2) * (x - x2) + (y - y2) * (y - y2));
        }
        var r = cross / d2;
        var px = x1 + (x2 - x1) * r;
        var py = y1 + (y2 - y1) * r;
        // P->P(px,py)
        return Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
    },

    /**
     * 判断点坐标是否在面中
     * @param {maptalks.Polygon} 面对象
     * @param {maptalks.Coordinate} 点对象
     * @return {Boolean} true：点在面中
     */
    pointInsidePolygon: function (p, points) {
        var i, j, p1, p2,
            len = points.length;
        var c = false;

        for (i = 0, j = len - 1; i < len; j = i++) {
            p1 = points[i];
            p2 = points[j];
            if (((p1.y > p.y) !== (p2.y > p.y)) &&
                (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
                c = !c;
            }
        }

        return c;
    },

    _computeLength:function (coordinates, measurer) {
        var result = 0;
        for (var i = 0, len = coordinates.length; i < len - 1; i++) {
            result += measurer.measureLength(coordinates[i], coordinates[i + 1]);
        }
        return result;
    },

    _computeArea:function (coordinates, measurer) {
        return measurer.measureArea(coordinates);
    }
};
