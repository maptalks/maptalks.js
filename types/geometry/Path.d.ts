import { Player } from '../core/Animation';
import Coordinate from '../geo/Coordinate';
import Extent from '../geo/Extent';
import Geometry, { GeometyOptionsType } from './Geometry';
import Point from '../geo/Point';
export type PathOptionsType = GeometyOptionsType & {
    'smoothness'?: number;
    'enableClip'?: boolean;
    'enableSimplify'?: boolean;
    'simplifyTolerance'?: number;
    'symbol'?: any;
};
/**
 * An abstract class Path containing common methods for Path geometry classes, e.g. LineString, Polygon
 * @abstract
 * @category geometry
 * @extends Geometry
 */
declare class Path extends Geometry {
    _showPlayer: Player;
    _animIdx: number;
    _animLenSoFar: number;
    _prjAniShowCenter: Point;
    _aniShowCenter: Coordinate;
    _tempCoord: Coordinate;
    _tempPrjCoord: Point;
    _animTailRatio: number;
    _simplified: any;
    _prjCoords: any;
    /**
     * Show the linestring with animation
     * @param  {Object} [options=null] animation options
     * @param  {Number} [options.duration=1000] duration
     * @param  {String} [options.easing=out] animation easing
     * @param  {Function} [cb=null] callback function in animation, function parameters: frame, currentCoord
     * @example
     *  line.animateShow({
     *    duration : 2000,
     *    easing : 'linear'
     *  }, function (frame, currentCoord) {
     *    //frame is the animation frame
     *    //currentCoord is current coordinate of animation
     *  });
     * @return {LineString}         this
     */
    animateShow(options: {}, cb: any): Player | this;
    _drawAnimShowFrame(t: any, duration: any, length: any, coordinates: any, prjCoords: any): any;
    _getCenterInExtent(extent: any, coordinates: any, clipFn: any): Coordinate;
    /**
     * Transform projected coordinates to view points
     * @param  {Coordinate[]} prjCoords           - projected coordinates
     * @param  {Boolean} disableSimplify          - whether to disable simplify\
     * @param  {Number} zoom                      - 2d points' zoom level
     * @returns {Point[]}
     * @private
     */
    _getPath2DPoints(prjCoords: any, disableSimplify: any, res?: any): any[] | Point;
    _shouldSimplify(): boolean;
    _setPrjCoordinates(prjPoints: any): void;
    _getPrjCoordinates(): any;
    _updateCache(): void;
    _clearProjection(): void;
    _projectCoords(points: any): any;
    _unprojectCoords(prjPoints: any): any;
    _computeCenter(): Coordinate;
    _computeExtent(): Extent;
    _computePrjExtent(): Extent;
    _get2DLength(): number;
    _hitTestTolerance(): any;
    _coords2Extent(coords: any, proj?: any): Extent;
}
export default Path;
