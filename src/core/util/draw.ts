import Point from '../../geo/Point';
import PointExtent from '../../geo/PointExtent';
import { isGradient } from './style';
import { isNumber } from './common';
import Canvas from '../Canvas';
import { ResourceCache } from '../../renderer/layer/CanvasRenderer'

export function drawImageMarker(ctx: CanvasRenderingContext2D, image, point, symbol) {
    let w = symbol && symbol['markerWidth'];
    if (!isNumber(w)) {
        w = image.width;
    }
    let h = symbol && symbol['markerHeight'];
    if (!isNumber(h)) {
        h = image.height;
    }
    Canvas.image(ctx, image, point, symbol['markerWidth'] || image.width, symbol['markerHeight'] || image.height);
}

export function getImage(resources: ResourceCache, url: string) {
    const img = resources && resources.getImage(url);
    return img || null;
}

export function drawVectorMarker(ctx: CanvasRenderingContext2D, point, symbol, resources: ResourceCache) {
    const strokeAndFill = translateMarkerLineAndFill(symbol);
    const style = symbol,
        markerType = style['markerType'].toLowerCase(),
        vectorArray = getVectorMarkerPoints(markerType, style['markerWidth'], style['markerHeight']),
        lineOpacity = strokeAndFill['lineOpacity'],
        fillOpacity = strokeAndFill['polygonOpacity'];
    const gradient = isGradient(strokeAndFill['polygonFill']);
    if (gradient) {
        let gradientExtent;
        if (isGradient(strokeAndFill['polygonFill'])) {
            if (!gradientExtent) {
                gradientExtent = getGraidentExtent(point, style.markerWidth, style.markerHeight);
            }
            strokeAndFill['polygonGradientExtent'] = gradientExtent;
        }
    }

    Canvas.prepareCanvas(ctx, strokeAndFill, resources);

    const width = style['markerWidth'],
        height = style['markerHeight'],
        hLineWidth = style['markerLineWidth'] / 2;
    if (markerType === 'ellipse') {
        //ellipse default
        Canvas.ellipse(ctx, point, width / 2, height / 2, height / 2, lineOpacity, fillOpacity);
    } else if (markerType === 'cross' || markerType === 'x') {
        for (let j = vectorArray.length - 1; j >= 0; j--) {
            vectorArray[j]._add(point);
        }
        //线类型
        Canvas.path(ctx, vectorArray.slice(0, 2), lineOpacity);
        Canvas.path(ctx, vectorArray.slice(2, 4), lineOpacity);
    } else if (markerType === 'diamond' || markerType === 'bar' || markerType === 'square' || markerType === 'rectangle' || markerType === 'triangle') {
        if (markerType === 'bar') {
            point = point.add(0, -hLineWidth);
        } else if (markerType === 'rectangle') {
            point = point.add(hLineWidth, hLineWidth);
        }
        for (let j = vectorArray.length - 1; j >= 0; j--) {
            vectorArray[j]._add(point);
        }
        //面类型
        Canvas.polygon(ctx, vectorArray, lineOpacity, fillOpacity);
    } else if (markerType === 'pin') {
        point = point.add(0, -hLineWidth);
        for (let j = vectorArray.length - 1; j >= 0; j--) {
            vectorArray[j]._add(point);
        }
        const lineCap = ctx.lineCap;
        ctx.lineCap = 'round'; //set line cap to round to close the pin bottom
        Canvas.bezierCurveAndFill(ctx, vectorArray, lineOpacity, fillOpacity);
        ctx.lineCap = lineCap;
    } else if (markerType === 'pie') {
        point = point.add(0, -hLineWidth);
        const angle = Math.atan(width / 2 / height) * 180 / Math.PI;
        const lineCap = ctx.lineCap;
        ctx.lineCap = 'round';
        Canvas.sector(ctx, point, height, [90 - angle, 90 + angle], lineOpacity, fillOpacity);
        ctx.lineCap = lineCap;
    } else {
        throw new Error('unsupported markerType: ' + markerType);
    }
    return ctx.canvas;
}

function getGraidentExtent(point: Point, w: number, h: number) {
    const e = new PointExtent();
    e._combine(point);
    e['xmin'] += -w / 2;
    e['ymin'] += -h / 2;
    e['xmax'] += w / 2;
    e['ymax'] += h / 2;
    return e;
}


interface TemplateSymbol {
    markerLineColor: any
    markerLinePatternFile: any
    markerLineWidth: any
    markerLineOpacity: any
    markerLineDasharray: any
    markerFill: any
    markerFillPatternFile: any
    markerFillOpacity: any
}


export function translateMarkerLineAndFill<T extends Partial<TemplateSymbol>>(s: T) {
    const result = {
        'lineColor': s['markerLineColor'],
        'linePatternFile': s['markerLinePatternFile'],
        'lineWidth': s['markerLineWidth'],
        'lineOpacity': s['markerLineOpacity'],
        'lineDasharray': s['markerLineDasharray'],
        'lineCap': 'butt',
        'lineJoin': 'round',
        'polygonFill': s['markerFill'],
        'polygonPatternFile': s['markerFillPatternFile'],
        'polygonOpacity': s['markerFillOpacity']
    };
    if (result['lineWidth'] === 0) {
        result['lineOpacity'] = 0;
    }
    return result;
}

export type MarkerType = 'triangle' | 'cross' | 'diamond' | 'square' | 'rectangle' | 'x' | 'bar' | 'pin' | 'pie'

export function getVectorMarkerPoints(markerType: MarkerType, width: number, height: number) {
    //half height and half width
    const hh = height / 2,
        hw = width / 2;
    const left = 0,
        top = 0;
    let v0, v1, v2, v3;
    if (markerType === 'triangle') {
        v0 = new Point(left, top - hh);
        v1 = new Point(left - hw, top + hh);
        v2 = new Point(left + hw, top + hh);
        return [v0, v1, v2];
    } else if (markerType === 'cross') {
        v0 = new Point((left - hw), top);
        v1 = new Point((left + hw), top);
        v2 = new Point((left), (top - hh));
        v3 = new Point((left), (top + hh));
        return [v0, v1, v2, v3];
    } else if (markerType === 'diamond') {
        v0 = new Point((left - hw), top);
        v1 = new Point(left, (top - hh));
        v2 = new Point((left + hw), top);
        v3 = new Point((left), (top + hh));
        return [v0, v1, v2, v3];
    } else if (markerType === 'square') {
        v0 = new Point((left - hw), (top + hh));
        v1 = new Point((left + hw), (top + hh));
        v2 = new Point((left + hw), (top - hh));
        v3 = new Point((left - hw), (top - hh));
        return [v0, v1, v2, v3];
    } else if (markerType === 'rectangle') {
        v0 = new Point(left, top);
        v1 = v0.add(width, 0);
        v2 = v0.add(width, height);
        v3 = v0.add(0, height);
        return [v0, v1, v2, v3];
    } else if (markerType === 'x') {
        v0 = new Point(left - hw, top + hh);
        v1 = new Point(left + hw, top - hh);
        v2 = new Point(left + hw, top + hh);
        v3 = new Point(left - hw, top - hh);
        return [v0, v1, v2, v3];
    } else if (markerType === 'bar') {
        v0 = new Point((left - hw), (top - height));
        v1 = new Point((left + hw), (top - height));
        v2 = new Point((left + hw), top);
        v3 = new Point((left - hw), top);
        return [v0, v1, v2, v3];
    } else if (markerType === 'pin' || markerType === 'pie') {
        const extWidth = height * Math.atan(hw / hh);
        v0 = new Point(left, top);
        v1 = new Point(left - extWidth, top - height);
        v2 = new Point(left + extWidth, top - height);
        v3 = new Point(left, top);
        return [v0, v1, v2, v3];
    }
    return [];
}
