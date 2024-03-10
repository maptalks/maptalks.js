export declare function clipLine(points: any, bounds: any, round: any, noCut?: any): any[];
export declare function clipSegment(a: any, b: any, bounds: any, useLastCode: any, round: any, noCut: any): false | any[];
export declare function clipPolygon(points: any, bounds: any, round?: any): any;
/**
 * caculate the distance from a point to a segment.
 * @param {Point} p
 * @param {Point} p1
 * @param {Point} p2
 * @return {Number} distance from p to (p1, p2)
 * @memberOf Util
 */
export declare function distanceToSegment(p: any, p1: any, p2: any): number;
/**
 * Whether the coordinate is inside the polygon
 * @param {Polygon}         - polygon
 * @param {Coordinate}      - coordinate
 * @return {Boolean}
 * @memberOf Util
 */
export declare function pointInsidePolygon(p: any, points: any): boolean;
/**
 * Is the point within an ellipse
 * @param {Point} point
 * @param {Point} center ellipse's center
 * @param {Point} southeast ellipse's southeast point
 * @param {Number} tolerance
 * @returns {Boolean}
 * @private
 * @memberOf Util
 */
export declare function withInEllipse(point: any, center: any, southeast: any, tolerance: any): boolean;
