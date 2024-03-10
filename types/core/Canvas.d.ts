declare const Canvas: {
    getCanvas2DContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D;
    setHitTesting(testing: boolean): void;
    createCanvas(width: number, height: number, canvasClass?: any): HTMLCanvasElement;
    prepareCanvasFont(ctx: CanvasRenderingContext2D, style: any): void;
    /**
     * Set canvas's fill and stroke style
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} style
     * @param {Object} resources
     * @param {Boolean} testing  - paint for testing, ignore stroke and fill patterns
     */
    prepareCanvas(ctx: CanvasRenderingContext2D, style: any, resources: any, testing?: boolean): void;
    _createGradient(ctx: CanvasRenderingContext2D, g: any, extent: any): CanvasGradient;
    _setStrokePattern(ctx: CanvasRenderingContext2D, strokePattern: any, strokeWidth: number, linePatternOffset: any, resources: any): void;
    clearRect(ctx: CanvasRenderingContext2D, x1: any, y1: any, x2: any, y2: any): void;
    fillCanvas(ctx: CanvasRenderingContext2D, fillOpacity: any, x?: number, y?: number): void;
    getRgba(color: any, op: any): string;
    normalizeColorToRGBA(fill: any, opacity?: number): string;
    image(ctx: CanvasRenderingContext2D, img: any, x: number, y: number, width?: number, height?: number): void;
    text(ctx: CanvasRenderingContext2D, text: any, pt: any, style: any, textDesc: any): void;
    _textOnMultiRow(ctx: CanvasRenderingContext2D, texts: any, style: any, point: any, splitTextSize: any, textSize: any): void;
    _textOnLine(ctx: CanvasRenderingContext2D, text: any, pt: any, textHaloRadius: any, textHaloFill: any, textHaloAlpha: any): void;
    fillText(ctx: CanvasRenderingContext2D, text: any, pt: any, rgba?: any): void;
    _stroke(ctx: CanvasRenderingContext2D, strokeOpacity: any, x?: number, y?: number): void;
    _path(ctx: CanvasRenderingContext2D, points: any, lineDashArray?: any, lineOpacity?: any, ignoreStrokePattern?: any): void;
    path(ctx: CanvasRenderingContext2D, points: any, lineOpacity: any, fillOpacity?: number, lineDashArray?: any): void;
    _multiClip(ctx: CanvasRenderingContext2D, points: any): void;
    polygon(ctx: CanvasRenderingContext2D, points: any, lineOpacity: any, fillOpacity: any, lineDashArray?: any, smoothness?: boolean): void;
    _ring(ctx: CanvasRenderingContext2D, ring: any, lineDashArray: any, lineOpacity: any, ignorePattern?: boolean): void;
    paintSmoothLine(ctx: CanvasRenderingContext2D, points: any, lineOpacity: any, smoothValue: any, close: any, tailIdx?: any, tailRatio?: any): void;
    /**
     * draw an arc from p1 to p2 with degree of (p1, center) and (p2, center)
     * @param  {Context} ctx    canvas context
     * @param  {Point} p1      point 1
     * @param  {Point} p2      point 2
     * @param  {Number} degree arc degree between p1 and p2
     */
    _arcBetween(ctx: CanvasRenderingContext2D, p1: any, p2: any, degree: any): any[];
    _lineTo(ctx: CanvasRenderingContext2D, p: any): void;
    bezierCurveAndFill(ctx: CanvasRenderingContext2D, points: any, lineOpacity: any, fillOpacity: any): void;
    _bezierCurveTo(ctx: CanvasRenderingContext2D, p1: any, p2: any, p3: any): void;
    ellipse(ctx: CanvasRenderingContext2D, pt: any, width: any, heightTop: any, heightBottom: any, lineOpacity: number, fillOpacity: number): void;
    rectangle(ctx: CanvasRenderingContext2D, pt: any, size: any, lineOpacity: number, fillOpacity: number): void;
    sector(ctx: CanvasRenderingContext2D, pt: any, size: any, angles: any, lineOpacity: number, fillOpacity: number): void;
    _isPattern(style: any): boolean;
    drawCross(ctx: CanvasRenderingContext2D, x: any, y: any, lineWidth: number, color: any): void;
    copy(canvas: HTMLCanvasElement, c: any): HTMLCanvasElement;
    pixelRect(ctx: CanvasRenderingContext2D, point: any, lineOpacity: number, fillOpacity: number): void;
};
export default Canvas;
