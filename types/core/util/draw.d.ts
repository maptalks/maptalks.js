export declare function drawImageMarker(ctx: CanvasRenderingContext2D, image: any, point: any, symbol: any): void;
export declare function getImage(resources: any, url: string): any;
export declare function drawVectorMarker(ctx: CanvasRenderingContext2D, point: any, symbol: any, resources: any): HTMLCanvasElement;
export declare function translateMarkerLineAndFill(s: any): {
    lineColor: any;
    linePatternFile: any;
    lineWidth: any;
    lineOpacity: any;
    lineDasharray: any;
    lineCap: string;
    lineJoin: string;
    polygonFill: any;
    polygonPatternFile: any;
    polygonOpacity: any;
};
export declare function getVectorMarkerPoints(markerType: string, width: number, height: number): any[];
