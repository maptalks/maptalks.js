export default class EditOutline {
    target: any;
    map: any;
    points: any;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    constructor(target: any, map: any);
    setPoints(points: any): void;
    hitTest(): boolean;
    render(ctx: CanvasRenderingContext2D): void;
    addTo(map: any): void;
    delete(): void;
}
