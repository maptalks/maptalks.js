import Class from "../core/Class";
import { MixinConstructor } from "../core/Mixin";

/**
 * Common methods for classes can be rendered, e.g. Map, Layers
 * @mixin Renderable
 * @protected
 */
export default function <T extends MixinConstructor>(Base: T) {
    return class extends Base {
        /**
         * 用给定的 name 注册一个renderer类
         * @english
         * Register a renderer class with the given name.
         * @param  name  - renderer's register key
         * @param  clazz - renderer's class{@link Class}).
         */
        static registerRenderer<T extends Class>(name: string, clazz: T) {
            const proto = this.prototype as any;
            const parentProto = Object.getPrototypeOf(proto) as any;
            if (!proto._rendererClasses || proto._rendererClasses === parentProto._rendererClasses) {
                proto._rendererClasses = proto._rendererClasses ? Object.create(proto._rendererClasses) : {};
            }
            proto._rendererClasses[name.toLowerCase()] = clazz;
            return this;
        }

        /**
         * 返回用name注册的rendere 类
         * @english
         * Get the registered renderer class by the given name
         * @param  name  - renderer's register key
         */
        static getRendererClass(name: string): Class | null {
            const proto = this.prototype as any;
            if (!proto._rendererClasses) {
                return null;
            }
            return proto._rendererClasses[name.toLowerCase()];
        }
    }
}
