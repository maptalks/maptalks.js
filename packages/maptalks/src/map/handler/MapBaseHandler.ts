import Handler from "../../handler/Handler";
import Map from "../Map";

abstract class MapBaseHandler extends Handler {
    target: Map;

    abstract addHooks(): void
    abstract removeHooks(): void

}

export default MapBaseHandler;