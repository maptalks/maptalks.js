
const registeredTypes = {};

/**
 * A helper mixin for JSON serialization.
 * @mixin JSONAble
 */
export default Base =>
    class extends Base {
        /**
         * It is a static method. <br>
         * Register layer for JSON serialization and assign a JSON type.
         * @param  {String} type - JSON type
         * @function JSONAble.registerJSONType
         */
        static registerJSONType(type) {
            if (!type) {
                return this;
            }
            if (registeredTypes[type]) {
                console.error(`${type} has register. please use Different name for:`, this);
                return this;
            }
            registeredTypes[type] = this;
            return this;
        }

        /**
         * It is a static method. <br>
         * Get class of input JSON type
         * @param  {String} type - JSON type
         * @return {Class}      Class
         * @function JSONAble.getJSONClass
         */
        static getJSONClass(type) {
            if (!type) {
                return null;
            }
            return registeredTypes[type];
        }

        /**
         * Get object's JSON Type
         * @return {String}
         * @function JSONAble.getJSONType
         */
        getJSONType() {
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
    };
