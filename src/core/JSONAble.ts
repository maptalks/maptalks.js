import { MixinConstructor } from "./Mixin";

type JSONTypes = Record<string, any>

const registeredTypes:JSONTypes = {};

/**
 * A helper mixin for JSON serialization.
 * @mixin JSONAble
 */
export default function <Class extends MixinConstructor>(Base: Class) {
    return class JSONAble extends Base {
        _jsonType?: string
        /**
         * 静态方法，用于将该类注册用于JSON序列化与反序列化
         *
         * @english
         * It is a static method. <br>
         * Register class for JSON serialization and assign a JSON type.
         * @param  type - JSON type
         */
        static registerJSONType(type: string): void {
            if (!type) {
                return;
            }
            if (registeredTypes[type]) {
                console.error(`${type} has register. please use Different name for:`, this);
                return;
            }
            registeredTypes[type] = this;
            return;
        }

        /**
         * 静态方法，返回type对应的注册类
         * @english
         * It is a static method. <br>
         * Get class of input JSON type
         * @param  type - JSON type
         */
        static getJSONClass(type: string): Class | null {
            if (!type) {
                return null;
            }
            return registeredTypes[type];
        }

        /**
         * 返回该类的JSON type
         * @english
         * Get object's JSON Type
         */
        getJSONType(): string {
            if (this._jsonType === undefined) {
                const clazz = Object.getPrototypeOf(this).constructor;
                for (const p in registeredTypes) {
                    if (registeredTypes[p] === clazz) {
                        this._jsonType = p;
                        break;
                    }
                }
            }
            if (!this._jsonType) {
                throw new Error('Found an unregistered Layer/Geometry class!');
            }
            return this._jsonType;
        }
    }
}
