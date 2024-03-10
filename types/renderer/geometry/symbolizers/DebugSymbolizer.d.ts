import Point from '../../../geo/Point';
import PointSymbolizer from './PointSymbolizer';
export default class DebugSymbolizer extends PointSymbolizer {
    getPlacement(): string;
    getDxDy(): Point;
    symbolize(ctx: any): void;
}
