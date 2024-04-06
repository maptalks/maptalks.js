import { COLOR_PROPERTIES } from "../../../core/Constants";
import { isString } from "../../../core/util";
import { Bbox, bufferBBOX, getDefaultBBOX, setBBOX, } from "../../../core/util/bbox";
import { Geometry } from "../../../geometry";
import { Map } from "../../../map";
import Painter from "../Painter";

/**
 * symbolilzers的基础类,所有的symbolilzers都继承于此
 * 抽象类,不可实例化
 *
 * @english
 * @classdesc
 * Base class for all the symbolilzers
 * @class
 * @extends Class
 * @abstract
 * @private
 */
abstract class Symbolizer {
    public bbox: Bbox;
    public geometry: Geometry;
    public painter: Painter;
    public style: any;
    constructor() {
        this.bbox = getDefaultBBOX();
    }

    _setBBOX(ctx: CanvasRenderingContext2D, x1?: number | Bbox, y1?: number, x2?: number, y2?: number): Symbolizer {
        //@ts-expect-error todo 类型“CanvasRenderingContext2D”上不存在属性“isHitTesting”
        if (!ctx.isHitTesting) {
            setBBOX(this.bbox, x1, y1, x2, y2);
        }
        return this;
    }

    _bufferBBOX(ctx: CanvasRenderingContext2D, bufferSize: number): Symbolizer {
        //@ts-expect-error todo 类型“CanvasRenderingContext2D”上不存在属性“isHitTesting”
        if (!ctx.isHitTesting) {
            bufferBBOX(this.bbox, bufferSize);
        }
        return this;
    }

    getMap(): Map {
        return this.geometry.getMap();
    }

    getPainter(): Painter {
        return this.painter;
    }

    isDynamicSize(): boolean {
        return false;
    }

    isVisible(): boolean {
        if (!this.style) {
            return true;
        }
        const visible = this.style.visible;
        if (visible === false || visible === 0) {
            return false;
        }
        const opacity = this.style.opacity;
        if (opacity <= 0) {
            return false;
        }
        return true;
    }

    /**
     * 测试该属性是否是与着色相关的属性
     *
     * @english
     * Test if the property is a property related with coloring
     * @param  prop - property name to test
     * @static
     * @function
     * @memberof symbolizer.Symbolizer
     */
    static testColor(prop: string): boolean {
        if (!prop || !isString(prop)) {
            return false;
        }
        if (COLOR_PROPERTIES.indexOf(prop) >= 0) {
            return true;
        }
        return false;
    }
}

export default Symbolizer;
