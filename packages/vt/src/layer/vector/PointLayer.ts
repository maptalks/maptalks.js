import * as maptalks from "maptalks";

import { ICON_PAINTER_SCENECONFIG } from "../core/Constant";
import type { OverlayLayerOptionsType } from "maptalks";
import Vector3DLayer from "./Vector3DLayer";
import Vector3DLayerRenderer from "./Vector3DLayerRenderer";
import { extend } from "../../common/Util";
import { fromJSON } from "./util/from_json";

const defaultOptions: PointLayerOptions = {
  glyphSdfLimitPerFrame: 15,
  iconErrorUrl: null,
  workarounds: {
    //#94, text rendering crashes on windows with intel gpu
    "win-intel-gpu-crash": true,
  },
  collision: false,
  collisionFrameLimit: 1
};

interface PointLayerOptions extends OverlayLayerOptionsType {
  glyphSdfLimitPerFrame?: number,
  iconErrorUrl?: string,
  workarounds?: {
    "win-intel-gpu-crash"?: boolean,
  },
  sceneConfig?: typeof ICON_PAINTER_SCENECONFIG,
  collisionFrameLimit?: number
}

class PointLayer extends Vector3DLayer {
  options: PointLayerOptions;

  /**
   * Reproduce a PointLayer from layer's JSON.
   * @param  {Object} layerJSON - layer's JSON
   * @return {PointLayer}
   * @static
   * @private
   * @function
   */
  static fromJSON(json: object): PointLayer {
    return fromJSON(json, "PointLayer", PointLayer);
  }

  constructor(...args: any) {
    //@ts-expect-error
    super(...args);
    if (!this.options.sceneConfig) {
      this.options.sceneConfig = extend({}, ICON_PAINTER_SCENECONFIG);
    }
  }

  getPolygonOffsetCount(): 0 | 1 {
    return 0;
  }

  getPolygonOffset() {
    return 0;
  }
}

PointLayer.mergeOptions(defaultOptions);

PointLayer.registerJSONType("PointLayer");

PointLayer.registerRenderer("canvas", null);

export default PointLayer;

const MAX_MARKER_SIZE = 255;

class PointLayerRenderer extends Vector3DLayerRenderer {
  GeometryTypes = [maptalks.Marker, maptalks.MultiPoint];

  constructor(...args: any) {
    super(...args);
  }

  onGeometryAdd(geometries?: maptalks.Geometries) {
    if (!geometries) {
      return;
    }
    if (Array.isArray(geometries)) {
      geometries.forEach((g) => {
        g.options["maxMarkerWidth"] = g.options["maxMarkerHeight"] =
          MAX_MARKER_SIZE;
      });
    } else {
      geometries.options["maxMarkerWidth"] = geometries.options[
        "maxMarkerHeight"
      ] = MAX_MARKER_SIZE;
    }
    super.onGeometryAdd(geometries);
  }
}

PointLayer.registerRenderer("gl", PointLayerRenderer);
