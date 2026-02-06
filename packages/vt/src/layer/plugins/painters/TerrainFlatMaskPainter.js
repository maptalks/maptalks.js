import BasicPainter from './BasicPainter';
import { reshader, mat4, getWGSLSource } from '@maptalks/gl';
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

    // forbiddenTerrainUpscale() {
    //     return false;
    // }

    needPolygonOffset() {
        return false;
    }

    createMesh(geo, transform) {
        const { geometry, symbolIndex } = geo;
        const uniforms = {
        };
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: false
        });
        mesh.positionMatrix = this.getAltitudeOffsetMatrix();
        mesh.setLocalTransform(transform);
        mesh.properties.symbolIndex = symbolIndex;

        const defines = {};
        if (geometry.data.aAltitude) {
            defines['HAS_ALTITUDE'] = 1;
        }
        mesh.setDefines(defines);

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

        this.shader = new reshader.MeshShader({
            name: 'vt-terrain-flat-mask',
            vert,
            frag,
            wgslVert: getWGSLSource('vt_flat_mask_vert'),
            wgslFrag: getWGSLSource('vt_flat_mask_frag'),
            uniforms,
            extraCommandProps
        });
    }


    getUniformValues(map, context) {
        const projViewMatrix = IDENTITY_ARR;
        // const blendSrc = this.sceneConfig.blendSrc;
        const uniforms = {
            projViewMatrix,
            viewport: context && context.maskViewport,
        };
        return uniforms;
    }
}

export default TerrainFlatMaskPainter;
