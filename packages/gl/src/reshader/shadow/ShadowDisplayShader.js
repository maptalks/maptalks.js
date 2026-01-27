import { mat4 } from "gl-matrix";
import shadowDisplayFrag from "./glsl/shadow_display.frag";
import shadowDisplayVert from "./glsl/shadow_display.vert";
import { getWGSLSource } from "@maptalks/gl";
import MeshShader from "../shader/MeshShader.js";

class ShadowDisplayShader extends MeshShader {
    constructor(defines) {
        const projViewModelMatrix = [];
        super({
            name: "shadow_display",
            vert: shadowDisplayVert,
            frag: shadowDisplayFrag,
            wgslVert: getWGSLSource("gl_shadow_display_vert"),
            wgslFrag: getWGSLSource("gl_shadow_display_frag"),
            uniforms: [
                {
                    name: "projViewModelMatrix",
                    type: "function",
                    fn: function (context, props) {
                        return mat4.multiply(
                            projViewModelMatrix,
                            props["projViewMatrix"],
                            props["modelMatrix"],
                        );
                    },
                },
            ],
            defines: defines || {
                USE_ESM: 1,
            },
            extraCommandProps: {
                depth: {
                    enable: true,
                    mask: false,
                },
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props["globalTexSize"][0];
                    },
                    height: (context, props) => {
                        return props["globalTexSize"][1];
                    },
                },
            },
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands["shadow_display"]) {
            this.commands["shadow_display"] = this.createMeshCommand(
                regl,
                mesh,
            );
        }
        return this.commands["shadow_display"];
    }
}

export default ShadowDisplayShader;
