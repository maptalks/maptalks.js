import Handler from "../../handler/Handler";
import Map from "../Map";

class MapBaseHandler extends Handler {
    target: Map;

    addHooks(): void {
        throw new Error("Method not implemented.");
    }
    removeHooks(): void {
        throw new Error("Method not implemented.");
    }

}

export default MapBaseHandler;