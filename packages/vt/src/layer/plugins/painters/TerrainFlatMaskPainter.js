import BasicPainter from './BasicPainter';
import { reshader, mat4 } from '@maptalks/gl';
import vert from './glsl/vt-flat-mask.vert';
import frag from './glsl/vt-flat-mask.frag';
// import wgslVert from './wgsl/fill_vert.wgsl';
// import wgslFrag from './wgsl/fill_frag.wgsl';

const IDENTITY_ARR = mat4.identity([]);

const DEFAULT_UNIFORMS = {

};


class TerrainFlatMaskPainter extends BasicPainter {
    isEnableTileStencil() {
        return false;
    }

    isTerrainMask() {
        return this.layer.options.awareOfTerrain;
    }

    needPolygonOffset() {
        return false;
    }

    createMesh(geo, transform) {
        const { geometry, symbolIndex } = geo;
        const uniforms = {
        };

        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: false
        });
        mesh.positionMatrix = this.getAltitudeOffsetMatrix();
        mesh.setLocalTransform(transform);
        mesh.properties.symbolIndex = symbolIndex;
        return mesh;
    }

    init(context) {
        const regl = this.regl;
        const canvas = this.canvas;
        const viewport = {
            x: (_, props) => {
                return props.viewport ? props.viewport.x : 0;
            },
            y: (_, props) => {
                return props.viewport ? props.viewport.y : 0;
            },
            width: (_, props) => {
                return props.viewport ? props.viewport.width : (canvas ? canvas.width : 1);
            },
            height: (_, props) => {
                return props.viewport ? props.viewport.height : (canvas ? canvas.height : 1);
            },
        };

        this.renderer = new reshader.Renderer(regl);
        const extraCommandProps = {
            viewport,
            depth: {
                enable: true,
                func: '>=',
            }
        };
        this._createShader(context, extraCommandProps);
    }

    _createShader(context, extraCommandProps) {
        const projViewModelMatrix = [];
        const uniforms = [
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    return projViewModelMatrix;
                }
            },
        ];

//         const TYPE_CONSTS = `#define POSITION_TYPE vec2i
// `;
        this.shader = new reshader.MeshShader({
            name: 'vt-terrain-flat-mask',
            vert, frag,
            // wgslVert: TYPE_CONSTS + wgslVert,
            // wgslFrag,
            uniforms,
            extraCommandProps
        });
    }


    getUniformValues(map, context) {
        const projViewMatrix = IDENTITY_ARR;
        // const blendSrc = this.sceneConfig.blendSrc;
        const uniforms = {
            projViewMatrix,
            viewport: context && context.viewport
        };
        return uniforms;
    }
}

export default TerrainFlatMaskPainter;
