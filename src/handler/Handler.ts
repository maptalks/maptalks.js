import Eventable from '../core/Eventable';

class Base {}

/**
 * 所有交互Handler类的基类
 *
 * @english
 * Base class for all the interaction handlers
 * @category handler
 * @abstract
 * @protected
 */
abstract class Handler extends Eventable(Base) {
    target: any;
    dom?: HTMLElement;
    _enabled: boolean = false;

    constructor(target: any) {
        super();
        this.target = target;
    }

    abstract addHooks(): void
    abstract removeHooks(): void

    /**
     * 启用Handler
     *
     * @english
     * Enables the handler
     */
    enable() {
        if (this._enabled) {
            return this;
        }
        this._enabled = true;
        this.addHooks();
        return this;
    }

    /**
     * 停用Handler
     *
     * @english
     * Disables the handler
     */
    disable() {
        if (!this._enabled) {
            return this;
        }
        this._enabled = false;
        this.removeHooks();
        return this;
    }

    /**
     * 检查Handler是否启用
     *
     * @english
     * Returns true if the handler is enabled.
     */
    enabled() {
        return !!this._enabled;
    }

    /**
     * 从target上移除Handler
     *
     * @english
     * remove handler from target
     */
    remove() {
        this.disable();
        delete this.target;
        delete this.dom;
    }
}

export default Handler;
