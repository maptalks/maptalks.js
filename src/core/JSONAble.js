
const registeredTypes = {};
/**
 * This provides methods used for event handling. It's a mixin and not meant to be used directly.
 * @mixin
 * @memberOf maptalks
 * @name JSONAble
 */
export default function (Base) {
    return class extends Base {
        /**
         * Register layer for JSON serialization and assign a JSON type.
         * @param  {String} type - JSON type
         */
        static registerJSONType(type) {
            if (!type) {
                return;
            }
            registeredTypes[type] = this;
        }

        /**
         * Get geometry class of input JSON type
         * @param  {String} type - JSON type
         * @return {class}      Geometry Class
         */
        static getClass(type) {
            if (!type) {
                return null;
            }
            return registeredTypes[type];
        }

        /**
         * Get object's JSON Type
         * @return {String}
         */
        getJSONType() {
            if (this._jsonType === undefined) {
                const clazz = Object.getPrototypeOf(this).constructor;
                for (let p in registeredTypes) {
                    if (registeredTypes[p] === clazz) {
                        this._jsonType = p;
                        break;
                    }
                }
            }
            if (!this._jsonType) {
                throw new Error('Found an unregistered geometry class!');
            }
            return this._jsonType;
        }
    };
}
